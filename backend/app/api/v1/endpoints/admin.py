from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.user import User
from app.schemas.admin import AccountStatusResponse, AdminStats, AuditLogList, UserList
from app.services.admin_service import AdminService

router = APIRouter()


@router.get("/users", response_model=UserList, summary="List users")
def list_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> UserList:
    return AdminService(db).list_users(skip=skip, limit=limit)


@router.patch("/users/{user_id}/enable", response_model=AccountStatusResponse, summary="Enable account")
def enable_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> AccountStatusResponse:
    user = AdminService(db, request.state.ip_address).enable_user(target_user_id=user_id, admin_user=current_user)
    return AccountStatusResponse(user=user, message="User account enabled.")


@router.patch("/users/{user_id}/disable", response_model=AccountStatusResponse, summary="Disable account")
def disable_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> AccountStatusResponse:
    user = AdminService(db, request.state.ip_address).disable_user(target_user_id=user_id, admin_user=current_user)
    return AccountStatusResponse(user=user, message="User account disabled.")


@router.get("/audit-logs", response_model=AuditLogList, summary="View audit logs")
def list_audit_logs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> AuditLogList:
    return AdminService(db).list_audit_logs(skip=skip, limit=limit)


@router.get("/stats", response_model=AdminStats, summary="View platform statistics")
def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> AdminStats:
    return AdminService(db).get_statistics()
