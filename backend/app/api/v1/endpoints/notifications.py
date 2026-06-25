from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_authenticated
from app.models.user import User
from app.schemas.notification import NotificationList, NotificationMarkReadResponse
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get(
    "",
    response_model=NotificationList,
    summary="List notifications",
)
def list_notifications(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    unread_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
) -> NotificationList:
    return NotificationService(db).list_notifications(
        current_user,
        skip=skip,
        limit=limit,
        unread_only=unread_only,
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationMarkReadResponse,
    summary="Mark notification as read",
)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
) -> NotificationMarkReadResponse:
    notification = NotificationService(db).mark_notification_read(notification_id, current_user)
    return NotificationMarkReadResponse(notification=notification)
