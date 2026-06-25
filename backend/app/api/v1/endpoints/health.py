from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings

router = APIRouter()


@router.get("")
def health_check(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
        "database": "ok",
    }
