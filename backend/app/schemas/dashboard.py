from datetime import datetime

from pydantic import BaseModel


class RecentActivityItem(BaseModel):
    type: str
    title: str
    resource: str
    timestamp: datetime


class DashboardSummary(BaseModel):
    scope: str
    total_users: int
    total_patients: int
    total_predictions: int
    high_risk_predictions: int
    recent_activity: list[RecentActivityItem]
