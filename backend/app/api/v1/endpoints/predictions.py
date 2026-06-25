from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_doctor_or_admin
from app.models.user import User
from app.schemas.prediction import PredictionList, PredictionRead
from app.services.prediction_history_service import PredictionHistoryService

router = APIRouter()


@router.get(
    "/patient/{patient_id}/history",
    response_model=PredictionList,
    summary="Get patient prediction history",
)
def get_patient_prediction_history(
    patient_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> PredictionList:
    return PredictionHistoryService(db).list_patient_predictions(
        patient_id,
        current_user,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/doctor/history",
    response_model=PredictionList,
    summary="Get doctor prediction history",
)
def get_doctor_prediction_history(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> PredictionList:
    return PredictionHistoryService(db).list_doctor_predictions(
        current_user,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{prediction_id}",
    response_model=PredictionRead,
    summary="Get prediction by ID",
)
def get_prediction(
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> PredictionRead:
    return PredictionHistoryService(db).get_prediction(prediction_id, current_user)
