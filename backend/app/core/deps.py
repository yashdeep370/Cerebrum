from fastapi import Header, HTTPException

from app.core.config import get_settings


def verify_password(authorization: str | None = Header(default=None)) -> None:
    settings = get_settings()
    if not settings.app_password:
        return
    if authorization != f"Bearer {settings.app_password}":
        raise HTTPException(status_code=401, detail="Invalid or missing password")
