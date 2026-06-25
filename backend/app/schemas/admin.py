from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserRead


class UserList(BaseModel):
    items: list[UserRead]
    total: int
    skip: int
    limit: int


class AccountStatusResponse(BaseModel):
    user: UserRead
    message: str


class AuditLogRead(BaseModel):
    id: str
    user_id: str
    action: str
    resource: str
    timestamp: datetime
    ip_address: str | None

    model_config = ConfigDict(from_attributes=True)


class AuditLogList(BaseModel):
    items: list[AuditLogRead]
    total: int
    skip: int
    limit: int


class AdminStats(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    users_by_role: dict[str, int]
    total_patients: int
    total_predictions: int
    high_risk_predictions: int
    predictions_by_disease: dict[str, int]
    predictions_by_risk: dict[str, int]
    unread_notifications: int
    audit_log_count: int
