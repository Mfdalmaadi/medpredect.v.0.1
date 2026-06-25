from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def log_action(
        self,
        *,
        user_id: str,
        action: str,
        resource: str,
        ip_address: str | None,
    ) -> AuditLog:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            ip_address=ip_address,
        )
        self.db.add(audit_log)
        self.db.flush()
        return audit_log
