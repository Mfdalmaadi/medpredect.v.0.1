from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.prediction import NotificationType


class NotificationRead(BaseModel):
    id: str
    user_id: str
    prediction_id: str | None
    type: NotificationType
    message: str
    is_read: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationList(BaseModel):
    items: list[NotificationRead]
    total: int
    unread_count: int
    skip: int
    limit: int


class NotificationMarkReadResponse(BaseModel):
    notification: NotificationRead


class EmailNotificationDraft(BaseModel):
    to_email: EmailStr
    subject: str
    body: str
    notification_id: str
    prediction_id: str | None


class NotificationDispatchResult(BaseModel):
    notification: NotificationRead | None = None
    email_draft: EmailNotificationDraft | None = None
    should_send_email: bool = False
    reason: str = Field(examples=["Probability is below configured threshold."])
