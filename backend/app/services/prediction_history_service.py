from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import is_admin
from app.models.prediction import Prediction
from app.models.user import User
from app.repositories.patient_repository import PatientRepository
from app.repositories.prediction_repository import PredictionRepository
from app.schemas.prediction import PredictionList


class PredictionHistoryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.patients = PatientRepository(db)
        self.predictions = PredictionRepository(db)

    def get_prediction(self, prediction_id: str, current_user: User) -> Prediction:
        prediction = (
            self.predictions.get_by_id(prediction_id)
            if is_admin(current_user)
            else self.predictions.get_owned_by_id(prediction_id, current_user.id)
        )
        if prediction is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found.")
        return prediction

    def list_patient_predictions(
        self,
        patient_id: str,
        current_user: User,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> PredictionList:
        if is_admin(current_user):
            patient = self.patients.get_by_id(patient_id)
            if patient is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

            items = self.predictions.list_by_patient(patient_id, skip=skip, limit=limit)
            total = self.predictions.count_by_patient(patient_id)
        else:
            patient = self.patients.get_owned_by_id(patient_id, current_user.id)
            if patient is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

            items = self.predictions.list_by_patient_and_doctor(
                patient_id,
                current_user.id,
                skip=skip,
                limit=limit,
            )
            total = self.predictions.count_by_patient_and_doctor(patient_id, current_user.id)

        return PredictionList(items=items, total=total, skip=skip, limit=limit)

    def list_doctor_predictions(
        self,
        current_user: User,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> PredictionList:
        if is_admin(current_user):
            items = self.predictions.list_all(skip=skip, limit=limit)
            total = self.predictions.count_all()
        else:
            items = self.predictions.list_by_doctor(current_user.id, skip=skip, limit=limit)
            total = self.predictions.count_by_doctor(current_user.id)

        return PredictionList(items=items, total=total, skip=skip, limit=limit)
