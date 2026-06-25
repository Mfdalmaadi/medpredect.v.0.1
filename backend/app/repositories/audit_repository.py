from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100) -> list[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit)
        return list(self.db.scalars(stmt))

    def count(self) -> int:
        stmt = select(func.count()).select_from(AuditLog)
        return int(self.db.scalar(stmt) or 0)
