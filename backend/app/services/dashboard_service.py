from sqlalchemy.orm import Session

from app.core.permissions import is_admin
from app.models.audit_log import AuditLog
from app.models.prediction import Prediction
from app.models.user import User
from app.repositories.stats_repository import StatsRepository
from app.schemas.dashboard import DashboardSummary, RecentActivityItem


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.stats = StatsRepository(db)

    def get_summary(self, current_user: User) -> DashboardSummary:
        if is_admin(current_user):
            recent_predictions = self.stats.recent_predictions(limit=5)
            recent_audits = self.stats.recent_audit_logs(limit=5)
            return DashboardSummary(
                scope="global",
                total_users=self.stats.total_users(),
                total_patients=self.stats.total_patients(),
                total_predictions=self.stats.total_predictions(),
                high_risk_predictions=self.stats.high_risk_predictions(),
                recent_activity=self._merge_recent_activity(recent_predictions, recent_audits),
            )

        recent_predictions = self.stats.recent_predictions_by_doctor(current_user.id, limit=5)
        recent_audits = self.stats.recent_audit_logs_by_user(current_user.id, limit=5)
        return DashboardSummary(
            scope="doctor",
            total_users=1,
            total_patients=self.stats.total_patients_by_doctor(current_user.id),
            total_predictions=self.stats.total_predictions_by_doctor(current_user.id),
            high_risk_predictions=self.stats.high_risk_predictions_by_doctor(current_user.id),
            recent_activity=self._merge_recent_activity(recent_predictions, recent_audits),
        )

    def _merge_recent_activity(
        self,
        predictions: list[Prediction],
        audit_logs: list[AuditLog],
    ) -> list[RecentActivityItem]:
        items: list[RecentActivityItem] = []

        for prediction in predictions:
            items.append(
                RecentActivityItem(
                    type="prediction",
                    title=f"{prediction.disease_type.value} prediction - {prediction.risk_level.value} risk",
                    resource=f"predictions:{prediction.id}",
                    timestamp=prediction.created_at,
                )
            )

        for audit_log in audit_logs:
            items.append(
                RecentActivityItem(
                    type="audit",
                    title=audit_log.action,
                    resource=audit_log.resource,
                    timestamp=audit_log.timestamp,
                )
            )

        return sorted(items, key=lambda item: item.timestamp, reverse=True)[:10]
