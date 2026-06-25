from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.permissions import is_admin
from app.models.prediction import Notification, NotificationType
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.notification import EmailNotificationDraft, NotificationDispatchResult, NotificationList


class NotificationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.notifications = NotificationRepository(db)
        self.users = UserRepository(db)

    def create_high_risk_notification_if_needed(
        self,
        *,
        probability: float,
        prediction_id: str,
        recipient_user_id: str,
        disease_label: str,
    ) -> NotificationDispatchResult:
        threshold = settings.high_risk_notification_threshold
        if probability <= threshold:
            return NotificationDispatchResult(
                should_send_email=False,
                reason=f"Probability {probability:.4f} is below or equal to threshold {threshold:.4f}.",
            )

        recipient = self.users.get_by_id(recipient_user_id)
        if recipient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification recipient not found.")

        message = f"High-risk {disease_label} prediction detected with probability {probability:.2%}."
        notification = self.notifications.create(
            user_id=recipient_user_id,
            prediction_id=prediction_id,
            notification_type=NotificationType.ALERT_HIGH_RISK,
            message=message,
        )
        return NotificationDispatchResult(
            notification=notification,
            email_draft=EmailNotificationDraft(
                to_email=recipient.email,
                subject=f"MedPredict AI - High-risk {disease_label} alert",
                body=(
                    f"{message}\n\n"
                    f"Prediction ID: {prediction_id}\n"
                    "Please review the patient result in MedPredict AI."
                ),
                notification_id=notification.id,
                prediction_id=prediction_id,
            ),
            should_send_email=True,
            reason="Probability exceeded configured threshold. Email notification prepared.",
        )

    def list_notifications(
        self,
        current_user: User,
        *,
        skip: int = 0,
        limit: int = 100,
        unread_only: bool = False,
    ) -> NotificationList:
        if is_admin(current_user):
            items = self.notifications.list_all(skip=skip, limit=limit, unread_only=unread_only)
            total = self.notifications.count_all(unread_only=unread_only)
            unread_count = self.notifications.count_all(unread_only=True)
        else:
            items = self.notifications.list_by_user(
                current_user.id,
                skip=skip,
                limit=limit,
                unread_only=unread_only,
            )
            total = self.notifications.count_by_user(current_user.id, unread_only=unread_only)
            unread_count = self.notifications.count_by_user(current_user.id, unread_only=True)

        return NotificationList(items=items, total=total, unread_count=unread_count, skip=skip, limit=limit)

    def mark_notification_read(self, notification_id: str, current_user: User) -> Notification:
        notification = (
            self.notifications.get_by_id(notification_id)
            if is_admin(current_user)
            else self.notifications.get_owned_by_id(notification_id, current_user.id)
        )
        if notification is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

        notification = self.notifications.mark_read(notification)
        self.db.commit()
        return notification
