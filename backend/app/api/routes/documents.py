import json
import os

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from app.core.constants import ALLOWED_UPLOAD_EXTENSIONS, MAX_HISTORY_TURNS, MAX_UPLOAD_BYTES
from app.core.limiter import limiter
from app.db.database import get_db
from app.db.models import ChatMessage, Document
from app.models.schemas import ChatMessageOut, ChatRequest, ChatResponse, DocumentOut, SourceChunk
from app.services import document_processor, rag_engine
from app.services.llm.factory import get_llm_provider

router = APIRouter(prefix="/documents", tags=["documents"])

_CHAT_SYSTEM_PROMPT = (
    "You are a document assistant. Answer the user's question using ONLY the provided excerpts. "
    "Cite the excerpt number(s) you used like [1], [2]. If the excerpts don't contain the answer, say so. "
    "Prior conversation turns may be included for context."
)
_SUMMARY_SYSTEM_PROMPT = (
    "You write concise, accurate summaries of documents. Capture the key points and structure; "
    "do not add information that isn't in the text."
)


@router.post("", response_model=DocumentOut)
@limiter.limit("5/minute")
async def upload_document(request: Request, file: UploadFile, db: Session = Depends(get_db)) -> Document:
    filename = file.filename or "untitled"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext or 'unknown'}")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 15MB)")

    document = Document(filename=filename, status="processing")
    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        text = document_processor.extract_text(file_bytes, document.filename)
        chunks = document_processor.chunk_text(text)
        rag_engine.add_chunks(db, document.id, chunks)

        summary_source = text[:8000]
        summary = get_llm_provider().complete(
            system=_SUMMARY_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Summarize this document:\n\n{summary_source}"}],
            max_tokens=600,
        )

        document.chunk_count = len(chunks)
        document.summary = summary
        document.status = "ready"
    except Exception:
        document.status = "failed"
        raise
    finally:
        db.commit()
        db.refresh(document)

    return document


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db)) -> list[Document]:
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: str, db: Session = Depends(get_db)) -> Document:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: str, db: Session = Depends(get_db)) -> None:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    rag_engine.delete_document(db, document_id)
    db.delete(document)
    db.commit()


@router.post("/{document_id}/chat", response_model=ChatResponse)
@limiter.limit("15/minute")
def chat_with_document(
    request: Request, document_id: str, body: ChatRequest, db: Session = Depends(get_db)
) -> ChatResponse:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if document.status != "ready":
        raise HTTPException(status_code=409, detail=f"Document is not ready (status: {document.status})")

    chunks = rag_engine.query(db, document_id, body.question)
    if not chunks:
        raise HTTPException(status_code=422, detail="No indexed content found for this document")

    excerpts = "\n\n".join(f"[{i + 1}] {c['text']}" for i, c in enumerate(chunks))
    user_message = f"Excerpts:\n\n{excerpts}\n\nQuestion: {body.question}"

    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id == document_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(MAX_HISTORY_TURNS)
        .all()
    )
    history.reverse()
    history_messages = [{"role": m.role, "content": m.content} for m in history]

    answer = get_llm_provider().complete(
        system=_CHAT_SYSTEM_PROMPT,
        messages=[*history_messages, {"role": "user", "content": user_message}],
        max_tokens=800,
    )

    sources = [
        SourceChunk(document_id=document_id, document_filename=document.filename, chunk_index=c["chunk_index"], text=c["text"])
        for c in chunks
    ]

    db.add(ChatMessage(document_id=document_id, role="user", content=body.question))
    db.add(
        ChatMessage(
            document_id=document_id,
            role="assistant",
            content=answer,
            sources=json.dumps([s.model_dump() for s in sources]),
        )
    )
    db.commit()

    return ChatResponse(answer=answer, sources=sources)


@router.get("/{document_id}/messages", response_model=list[ChatMessageOut])
def get_chat_history(document_id: str, db: Session = Depends(get_db)) -> list[ChatMessage]:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id == document_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
