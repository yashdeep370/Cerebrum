from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.limiter import limiter
from app.db.database import get_db
from app.db.models import ChatMessage, Document
from app.models.schemas import ReportRequest, ReportResponse
from app.services.report_generator import generate_report

router = APIRouter(prefix="/documents/{document_id}/reports", tags=["reports"])


@router.post("", response_model=ReportResponse)
@limiter.limit("5/minute")
def create_report(
    request: Request, document_id: str, body: ReportRequest, db: Session = Depends(get_db)
) -> ReportResponse:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    chat_history = (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id == document_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
        if body.include_chat_history
        else []
    )

    markdown = generate_report(
        document=document,
        chat_history=chat_history,
        title=body.title,
        include_summary=body.include_summary,
        include_chat_history=body.include_chat_history,
        research_query=body.research_query,
    )

    return ReportResponse(title=body.title, markdown=markdown)
