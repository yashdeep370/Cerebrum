from datetime import datetime

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    filename: str
    status: str
    summary: str | None
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    question: str


class SourceChunk(BaseModel):
    document_id: str
    document_filename: str
    chunk_index: int
    text: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ResearchRequest(BaseModel):
    query: str
    max_results: int = 5


class ResearchSource(BaseModel):
    title: str
    url: str
    snippet: str


class ResearchResponse(BaseModel):
    synthesis: str
    sources: list[ResearchSource]


class ReportRequest(BaseModel):
    title: str
    include_summary: bool = True
    include_chat_history: bool = True
    research_query: str | None = None


class ReportResponse(BaseModel):
    title: str
    markdown: str
