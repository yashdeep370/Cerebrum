from fastapi import APIRouter, Request

from app.core.limiter import limiter
from app.models.schemas import ResearchRequest, ResearchResponse
from app.services.research_agent import research

router = APIRouter(prefix="/research", tags=["research"])


@router.post("", response_model=ResearchResponse)
@limiter.limit("10/minute")
def run_research(request: Request, body: ResearchRequest) -> ResearchResponse:
    result = research(body.query, body.max_results)
    return ResearchResponse(**result)
