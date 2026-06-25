from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.audit_repository import AuditRepository
from app.repositories.stats_repository import StatsRepository
from app.repositories.user_repository import UserRepository
from app.schemas.admin import AdminStats, AuditLogList, UserList
from app.services.audit_service import AuditService


class AdminService:
    def __init__(self, db: Session, ip_address: str | None = None) -> None:
        self.db = db
        self.ip_address = ip_address
        self.users = UserRepository(db)
        self.audits = AuditRepository(db)
        self.stats = StatsRepository(db)
        self.audit_service = AuditService(db)

    def list_users(self, *, skip: int = 0, limit: int = 100) -> UserList:
        return UserList(items=self.users.list(skip=skip, limit=limit), total=self.users.count(), skip=skip, limit=limit)

    def enable_user(self, *, target_user_id: str, admin_user: User) -> User:
        return self._set_user_status(target_user_id=target_user_id, is_active=True, admin_user=admin_user)

    def disable_user(self, *, target_user_id: str, admin_user: User) -> User:
        if target_user_id == admin_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot disable their own account.",
            )
        return self._set_user_status(target_user_id=target_user_id, is_active=False, admin_user=admin_user)

    def list_audit_logs(self, *, skip: int = 0, limit: int = 100) -> AuditLogList:
        return AuditLogList(items=self.audits.list(skip=skip, limit=limit), total=self.audits.count(), skip=skip, limit=limit)

    def get_statistics(self) -> AdminStats:
        return AdminStats(
            total_users=self.stats.total_users(),
            active_users=self.stats.active_users(),
            inactive_users=self.stats.inactive_users(),
            users_by_role=self.users.count_by_role(),
            total_patients=self.stats.total_patients(),
            total_predictions=self.stats.total_predictions(),
            high_risk_predictions=self.stats.high_risk_predictions(),
            predictions_by_disease=self.stats.predictions_by_disease(),
            predictions_by_risk=self.stats.predictions_by_risk(),
            unread_notifications=self.stats.unread_notifications(),
            audit_log_count=self.stats.audit_log_count(),
        )

    def _set_user_status(self, *, target_user_id: str, is_active: bool, admin_user: User) -> User:
        user = self.users.get_by_id(target_user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        updated_user = self.users.set_active(user, is_active)
        action = "user_enabled" if is_active else "user_disabled"
        self.audit_service.log_action(
            user_id=admin_user.id,
            action=action,
            resource=f"users:{target_user_id}",
            ip_address=self.ip_address,
        )
        self.db.commit()
        return updated_user
