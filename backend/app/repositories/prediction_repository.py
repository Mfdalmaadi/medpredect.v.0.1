from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.prediction import (
    ClinicalInputDiabetes,
    ClinicalInputPCOS,
    DiseaseType,
    Notification,
    NotificationType,
    Prediction,
    Recommendation,
    RecommendationCategory,
    RiskLevel,
    ShapValue,
)
from app.schemas.prediction import ClinicalInputDiabetesCreate, ClinicalInputPCOSCreate
from app.services.ml_service import MLTopFactor


class PredictionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_prediction(
        self,
        *,
        patient_id: str,
        doctor_id: str,
        disease_type: DiseaseType,
        probability: float,
        risk_level: RiskLevel,
    ) -> Prediction:
        prediction = Prediction(
            patient_id=patient_id,
            doctor_id=doctor_id,
            disease_type=disease_type,
            probability=probability,
            risk_level=risk_level,
        )
        self.db.add(prediction)
        self.db.flush()
        return prediction

    def create_diabetes_input(self, *, prediction_id: str, data: ClinicalInputDiabetesCreate) -> ClinicalInputDiabetes:
        clinical_input = ClinicalInputDiabetes(prediction_id=prediction_id, **data.model_dump())
        self.db.add(clinical_input)
        self.db.flush()
        return clinical_input

    def create_pcos_input(self, *, prediction_id: str, data: ClinicalInputPCOSCreate) -> ClinicalInputPCOS:
        clinical_input = ClinicalInputPCOS(prediction_id=prediction_id, **data.model_dump())
        self.db.add(clinical_input)
        self.db.flush()
        return clinical_input

    def create_shap_values(self, *, prediction_id: str, factors: list[MLTopFactor]) -> list[ShapValue]:
        shap_values = [
            ShapValue(
                prediction_id=prediction_id,
                feature_name=factor.feature,
                input_value=factor.input_value,
                shap_value=factor.shap_value,
                absolute_impact=factor.absolute_impact,
                direction=factor.direction,
            )
            for factor in factors
        ]
        self.db.add_all(shap_values)
        self.db.flush()
        return shap_values

    def create_recommendation(
        self,
        *,
        prediction_id: str,
        category: RecommendationCategory,
        description: str,
    ) -> Recommendation:
        recommendation = Recommendation(
            prediction_id=prediction_id,
            category=category,
            description=description,
        )
        self.db.add(recommendation)
        self.db.flush()
        return recommendation

    def create_notification(
        self,
        *,
        user_id: str,
        prediction_id: str,
        notification_type: NotificationType,
        message: str,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            prediction_id=prediction_id,
            type=notification_type,
            message=message,
        )
        self.db.add(notification)
        self.db.flush()
        return notification

    def get_by_id(self, prediction_id: str) -> Prediction | None:
        stmt = self._detail_query().where(Prediction.id == prediction_id)
        return self.db.scalar(stmt)

    def get_owned_by_id(self, prediction_id: str, doctor_id: str) -> Prediction | None:
        stmt = self._detail_query().where(Prediction.id == prediction_id, Prediction.doctor_id == doctor_id)
        return self.db.scalar(stmt)

    def list_by_patient(self, patient_id: str, *, skip: int = 0, limit: int = 100) -> list[Prediction]:
        stmt = (
            self._detail_query()
            .where(Prediction.patient_id == patient_id)
            .order_by(Prediction.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def list_by_patient_and_doctor(
        self,
        patient_id: str,
        doctor_id: str,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Prediction]:
        stmt = (
            self._detail_query()
            .where(Prediction.patient_id == patient_id, Prediction.doctor_id == doctor_id)
            .order_by(Prediction.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def count_by_patient(self, patient_id: str) -> int:
        stmt = select(func.count()).select_from(Prediction).where(Prediction.patient_id == patient_id)
        return int(self.db.scalar(stmt) or 0)

    def count_by_patient_and_doctor(self, patient_id: str, doctor_id: str) -> int:
        stmt = (
            select(func.count())
            .select_from(Prediction)
            .where(Prediction.patient_id == patient_id, Prediction.doctor_id == doctor_id)
        )
        return int(self.db.scalar(stmt) or 0)

    def list_by_doctor(self, doctor_id: str, *, skip: int = 0, limit: int = 100) -> list[Prediction]:
        stmt = (
            self._detail_query()
            .where(Prediction.doctor_id == doctor_id)
            .order_by(Prediction.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def list_all(self, *, skip: int = 0, limit: int = 100) -> list[Prediction]:
        stmt = self._detail_query().order_by(Prediction.created_at.desc()).offset(skip).limit(limit)
        return list(self.db.scalars(stmt))

    def count_by_doctor(self, doctor_id: str) -> int:
        stmt = select(func.count()).select_from(Prediction).where(Prediction.doctor_id == doctor_id)
        return int(self.db.scalar(stmt) or 0)

    def count_all(self) -> int:
        stmt = select(func.count()).select_from(Prediction)
        return int(self.db.scalar(stmt) or 0)

    def _detail_query(self):
        return select(Prediction).options(
            selectinload(Prediction.diabetes_input),
            selectinload(Prediction.pcos_input),
            selectinload(Prediction.recommendations),
            selectinload(Prediction.shap_values),
            selectinload(Prediction.notifications),
        )
