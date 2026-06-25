from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_ml_service, require_doctor_or_admin
from app.models.user import User
from app.schemas.prediction import DiabetesPredictionRequest, PCOSPredictionRequest, PredictionResponse
from app.services.ml_service import MLService
from app.services.prediction_service import PredictionService

router = APIRouter()


@router.post(
    "/diabetes",
    response_model=PredictionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Predict diabetes risk",
)
def predict_diabetes(
    payload: DiabetesPredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
    ml_service: MLService = Depends(get_ml_service),
) -> PredictionResponse:
    return PredictionService(db, ml_service).predict_diabetes(payload, current_user)


@router.post(
    "/pcos",
    response_model=PredictionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Predict PCOS risk",
)
def predict_pcos(
    payload: PCOSPredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> PredictionResponse:
    return PredictionService(db).predict_pcos(payload, current_user)
