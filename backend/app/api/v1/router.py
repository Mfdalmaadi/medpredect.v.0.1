from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    dashboard,
    health,
    notifications,
    patients,
    predict,
    predictions,
    rbac_examples,
    reports,
)

api_router = APIRouter()
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(predict.router, prefix="/predict", tags=["predictions"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["prediction history"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(rbac_examples.router, prefix="/rbac/examples", tags=["rbac examples"])
