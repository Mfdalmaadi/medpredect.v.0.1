from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.patient import Patient
from app.models.prediction import Notification, Prediction, RiskLevel
from app.models.user import User


class StatsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def total_users(self) -> int:
        return self._count(User)

    def active_users(self) -> int:
        stmt = select(func.count()).select_from(User).where(User.is_active.is_(True))
        return int(self.db.scalar(stmt) or 0)

    def inactive_users(self) -> int:
        stmt = select(func.count()).select_from(User).where(User.is_active.is_(False))
        return int(self.db.scalar(stmt) or 0)

    def total_patients(self) -> int:
        return self._count(Patient)

    def total_patients_by_doctor(self, doctor_id: str) -> int:
        stmt = select(func.count()).select_from(Patient).where(Patient.doctor_id == doctor_id)
        return int(self.db.scalar(stmt) or 0)

    def total_predictions(self) -> int:
        return self._count(Prediction)

    def total_predictions_by_doctor(self, doctor_id: str) -> int:
        stmt = select(func.count()).select_from(Prediction).where(Prediction.doctor_id == doctor_id)
        return int(self.db.scalar(stmt) or 0)

    def high_risk_predictions(self) -> int:
        stmt = select(func.count()).select_from(Prediction).where(Prediction.risk_level == RiskLevel.HIGH)
        return int(self.db.scalar(stmt) or 0)

    def high_risk_predictions_by_doctor(self, doctor_id: str) -> int:
        stmt = (
            select(func.count())
            .select_from(Prediction)
            .where(Prediction.risk_level == RiskLevel.HIGH, Prediction.doctor_id == doctor_id)
        )
        return int(self.db.scalar(stmt) or 0)

    def unread_notifications(self) -> int:
        stmt = select(func.count()).select_from(Notification).where(Notification.is_read.is_(False))
        return int(self.db.scalar(stmt) or 0)

    def audit_log_count(self) -> int:
        return self._count(AuditLog)

    def predictions_by_disease(self) -> dict[str, int]:
        stmt = select(Prediction.disease_type, func.count()).group_by(Prediction.disease_type)
        return {disease.value: int(count) for disease, count in self.db.execute(stmt).all()}

    def predictions_by_risk(self) -> dict[str, int]:
        stmt = select(Prediction.risk_level, func.count()).group_by(Prediction.risk_level)
        return {risk.value: int(count) for risk, count in self.db.execute(stmt).all()}

    def recent_predictions(self, *, limit: int = 5) -> list[Prediction]:
        stmt = select(Prediction).order_by(Prediction.created_at.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def recent_predictions_by_doctor(self, doctor_id: str, *, limit: int = 5) -> list[Prediction]:
        stmt = select(Prediction).where(Prediction.doctor_id == doctor_id).order_by(Prediction.created_at.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def recent_audit_logs(self, *, limit: int = 5) -> list[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def recent_audit_logs_by_user(self, user_id: str, *, limit: int = 5) -> list[AuditLog]:
        stmt = select(AuditLog).where(AuditLog.user_id == user_id).order_by(AuditLog.timestamp.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def _count(self, model) -> int:
        stmt = select(func.count()).select_from(model)
        return int(self.db.scalar(stmt) or 0)
