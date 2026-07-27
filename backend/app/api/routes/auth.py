from fastapi import APIRouter, Depends

from app.core.deps import verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/check", dependencies=[Depends(verify_password)])
def check() -> dict[str, bool]:
    return {"ok": True}
