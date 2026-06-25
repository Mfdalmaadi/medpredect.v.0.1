from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.prediction import Notification, NotificationType


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        user_id: str,
        notification_type: NotificationType,
        message: str,
        prediction_id: str | None = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            prediction_id=prediction_id,
            type=notification_type,
            message=message,
        )
        self.db.add(notification)
        self.db.flush()
        self.db.refresh(notification)
        return notification

    def get_by_id(self, notification_id: str) -> Notification | None:
        return self.db.get(Notification, notification_id)

    def get_owned_by_id(self, notification_id: str, user_id: str) -> Notification | None:
        stmt = select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
        return self.db.scalar(stmt)

    def list_all(self, *, skip: int = 0, limit: int = 100, unread_only: bool = False) -> list[Notification]:
        stmt = select(Notification).order_by(Notification.created_at.desc())
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))
        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.scalars(stmt))

    def list_by_user(self, user_id: str, *, skip: int = 0, limit: int = 100, unread_only: bool = False) -> list[Notification]:
        stmt = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))
        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.scalars(stmt))

    def count_all(self, *, unread_only: bool = False) -> int:
        stmt = select(func.count()).select_from(Notification)
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))
        return int(self.db.scalar(stmt) or 0)

    def count_by_user(self, user_id: str, *, unread_only: bool = False) -> int:
        stmt = select(func.count()).select_from(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))
        return int(self.db.scalar(stmt) or 0)

    def mark_read(self, notification: Notification) -> Notification:
        notification.is_read = True
        self.db.add(notification)
        self.db.flush()
        self.db.refresh(notification)
        return notification
