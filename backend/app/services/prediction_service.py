from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.permissions import is_admin
from app.models.patient import Patient
from app.models.prediction import DiseaseType, RecommendationCategory, RiskLevel
from app.models.user import User
from app.repositories.patient_repository import PatientRepository
from app.repositories.prediction_repository import PredictionRepository
from app.schemas.prediction import (
    DiabetesPredictionRequest,
    PCOSPredictionRequest,
    PredictionResponse,
    RecommendationRead,
)
from app.services.ml_service import MLInputError, MLPredictionError, MLService
from app.services.notification_service import NotificationService


class PredictionService:
    def __init__(self, db: Session, ml_service: MLService | None = None) -> None:
        self.db = db
        self.ml_service = ml_service
        self.patients = PatientRepository(db)
        self.predictions = PredictionRepository(db)
        self.notifications = NotificationService(db)

    def predict_diabetes(self, data: DiabetesPredictionRequest, current_user: User) -> PredictionResponse:
        patient = self._get_authorized_patient(data.patient_id, current_user)
        if self.ml_service is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ML service is not available.",
            )

        try:
            ml_result = self.ml_service.predict_diabetes(data.clinical_input.model_dump(), top_n=data.top_n)
        except MLInputError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
        except MLPredictionError as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="ML prediction failed.") from exc

        try:
            prediction = self.predictions.create_prediction(
                patient_id=patient.id,
                doctor_id=patient.doctor_id,
                disease_type=DiseaseType.DIABETES,
                probability=ml_result.probability,
                risk_level=ml_result.risk_level,
            )
            self.predictions.create_diabetes_input(prediction_id=prediction.id, data=data.clinical_input)
            self.predictions.create_shap_values(prediction_id=prediction.id, factors=ml_result.top_factors)
            recommendations = self._create_recommendations(prediction.id, ml_result.risk_level)
            notification_result = self.notifications.create_high_risk_notification_if_needed(
                probability=ml_result.probability,
                prediction_id=prediction.id,
                recipient_user_id=patient.doctor_id,
                disease_label="diabetes",
            )
            self.db.commit()
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Prediction result could not be saved.",
            ) from exc

        return PredictionResponse(
            prediction_id=prediction.id,
            patient_id=patient.id,
            doctor_id=patient.doctor_id,
            disease_type=DiseaseType.DIABETES,
            probability=ml_result.probability,
            risk_level=ml_result.risk_level,
            top_factors=[factor.__dict__ for factor in ml_result.top_factors],
            recommendations=[RecommendationRead.model_validate(recommendation) for recommendation in recommendations],
            notification_created=notification_result.notification is not None,
            interpretation_note=ml_result.interpretation_note,
        )

    def predict_pcos(self, data: PCOSPredictionRequest, current_user: User) -> PredictionResponse:
        from app.services.pcos_prediction_service import PcosPredictionService
        return PcosPredictionService(self.db).predict(data, current_user)

    def _get_authorized_patient(self, patient_id: str, current_user: User) -> Patient:
        if is_admin(current_user):
            patient = self.patients.get_by_id(patient_id)
        else:
            patient = self.patients.get_owned_by_id(patient_id, current_user.id)

        if patient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

        return patient

    def _create_recommendations(self, prediction_id: str, risk_level: RiskLevel):
        if risk_level == RiskLevel.HIGH:
            return [
                self.predictions.create_recommendation(
                    prediction_id=prediction_id,
                    category=RecommendationCategory.CONSULTATION,
                    description="High risk detected. Schedule a medical consultation and review clinical factors.",
                ),
                self.predictions.create_recommendation(
                    prediction_id=prediction_id,
                    category=RecommendationCategory.LIFESTYLE,
                    description="Review diet, physical activity, and follow-up monitoring with a healthcare professional.",
                ),
            ]

        if risk_level == RiskLevel.MEDIUM:
            return [
                self.predictions.create_recommendation(
                    prediction_id=prediction_id,
                    category=RecommendationCategory.FOLLOW_UP,
                    description="Medium risk detected. Plan follow-up monitoring and review modifiable factors.",
                )
            ]

        return [
            self.predictions.create_recommendation(
                prediction_id=prediction_id,
                category=RecommendationCategory.LIFESTYLE,
                description="Low risk detected. Maintain healthy habits and routine monitoring.",
            )
        ]
