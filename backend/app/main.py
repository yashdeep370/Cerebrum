import truststore

truststore.inject_into_ssl()

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import auth, chat, documents, reports, research
from app.core.config import get_settings
from app.core.deps import verify_password
from app.core.limiter import limiter
from app.db.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cerebrum API", version="0.1.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_protected = [Depends(verify_password)]
app.include_router(documents.router, dependencies=_protected)
app.include_router(chat.router, dependencies=_protected)
app.include_router(research.router, dependencies=_protected)
app.include_router(reports.router, dependencies=_protected)
app.include_router(auth.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
