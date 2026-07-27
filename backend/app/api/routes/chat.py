import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.constants import MAX_HISTORY_TURNS
from app.core.limiter import limiter
from app.db.database import get_db
from app.db.models import ChatMessage, Document
from app.models.schemas import ChatMessageOut, ChatRequest, ChatResponse, SourceChunk
from app.services import rag_engine
from app.services.llm.factory import get_llm_provider

router = APIRouter(prefix="/chat", tags=["chat"])

_SYSTEM_PROMPT = (
    "You are a research assistant with access to the user's document library. Answer the user's "
    "question using ONLY the provided excerpts, each labeled with its source document. Cite the "
    "excerpt number(s) you used like [1], [2]. If the excerpts don't contain the answer, say so. "
    "Prior conversation turns may be included for context."
)


@router.post("", response_model=ChatResponse)
@limiter.limit("15/minute")
def library_chat(request: Request, body: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    chunks = rag_engine.query_all(db, body.question)
    if not chunks:
        raise HTTPException(status_code=422, detail="No documents indexed yet")

    document_ids = {c["document_id"] for c in chunks}
    documents = {d.id: d for d in db.query(Document).filter(Document.id.in_(document_ids)).all()}

    excerpts = "\n\n".join(
        f"[{i + 1}] (from {documents[c['document_id']].filename}) {c['text']}"
        for i, c in enumerate(chunks)
        if c["document_id"] in documents
    )
    user_message = f"Excerpts:\n\n{excerpts}\n\nQuestion: {body.question}"

    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id.is_(None))
        .order_by(ChatMessage.created_at.desc())
        .limit(MAX_HISTORY_TURNS)
        .all()
    )
    history.reverse()
    history_messages = [{"role": m.role, "content": m.content} for m in history]

    answer = get_llm_provider().complete(
        system=_SYSTEM_PROMPT,
        messages=[*history_messages, {"role": "user", "content": user_message}],
        max_tokens=800,
    )

    sources = [
        SourceChunk(
            document_id=c["document_id"],
            document_filename=documents[c["document_id"]].filename,
            chunk_index=c["chunk_index"],
            text=c["text"],
        )
        for c in chunks
        if c["document_id"] in documents
    ]

    db.add(ChatMessage(document_id=None, role="user", content=body.question))
    db.add(
        ChatMessage(
            document_id=None,
            role="assistant",
            content=answer,
            sources=json.dumps([s.model_dump() for s in sources]),
        )
    )
    db.commit()

    return ChatResponse(answer=answer, sources=sources)


@router.get("/messages", response_model=list[ChatMessageOut])
def library_chat_history(db: Session = Depends(get_db)) -> list[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id.is_(None))
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
