from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_doctor_or_admin
from app.models.user import User
from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get(
    "/summary",
    response_model=DashboardSummary,
    summary="Get dashboard statistics",
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> DashboardSummary:
    return DashboardService(db).get_summary(current_user)
