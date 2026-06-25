from typing import Any
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.permissions import is_admin
from app.models.patient import Patient
from app.models.prediction import (
    DiseaseType,
    Recommendation,
    RecommendationCategory,
    RiskLevel,
)
from app.models.user import User
from app.repositories.patient_repository import PatientRepository
from app.repositories.prediction_repository import PredictionRepository
from app.schemas.prediction import (
    ClinicalInputPCOSCreate,
    PCOSPredictionRequest,
    PredictionResponse,
    RecommendationRead,
)
from app.services.ml_service import MLTopFactor
from app.services.notification_service import NotificationService


class PcosPredictionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.patients = PatientRepository(db)
        self.predictions = PredictionRepository(db)
        self.notifications = NotificationService(db)

    def predict(self, data: PCOSPredictionRequest, current_user: User) -> PredictionResponse:
        # 1. Resolve patient and perform authorization check
        patient = self._get_authorized_patient(data.patient_id, current_user)

        # 2. Run Clinical Scoring Engine
        score, top_factors, explanation = self._score_pcos(data.clinical_input, top_n=data.top_n)

        # 3. Classify risk level
        if score >= 0.66:
            risk_level = RiskLevel.HIGH
        elif score >= 0.33:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.LOW

        # 4. Persistence block (Prediction, ClinicalInput, SHAP values, Recommendations, Notification)
        try:
            prediction = self.predictions.create_prediction(
                patient_id=patient.id,
                doctor_id=patient.doctor_id,
                disease_type=DiseaseType.PCOS,
                probability=score,
                risk_level=risk_level,
            )

            # Save clinical input details
            self.predictions.create_pcos_input(prediction_id=prediction.id, data=data.clinical_input)

            # Map the scoring engine factors into the SHAP/Top Factors structure
            top_factors_objs = [
                MLTopFactor(
                    feature=f["feature"],
                    input_value=f["input_value"],
                    shap_value=f["shap_value"],
                    absolute_impact=f["absolute_impact"],
                    direction=f["direction"],
                )
                for f in top_factors
            ]
            self.predictions.create_shap_values(prediction_id=prediction.id, factors=top_factors_objs)

            # Generate and persist recommendations
            recommendations = self._generate_recommendations(prediction.id, score, data.clinical_input)

            # Check if high-risk alert/notification is needed
            notification_result = self.notifications.create_high_risk_notification_if_needed(
                probability=score,
                prediction_id=prediction.id,
                recipient_user_id=patient.doctor_id,
                disease_label="PCOS",
            )

            self.db.commit()
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PCOS prediction result could not be saved.",
            ) from exc

        return PredictionResponse(
            prediction_id=prediction.id,
            patient_id=patient.id,
            doctor_id=patient.doctor_id,
            disease_type=DiseaseType.PCOS,
            probability=score,
            risk_level=risk_level,
            top_factors=[factor.__dict__ for factor in top_factors_objs],
            recommendations=[RecommendationRead.model_validate(rec) for rec in recommendations],
            notification_created=notification_result.notification is not None,
            interpretation_note=explanation,
        )

    def _get_authorized_patient(self, patient_id: str, current_user: User) -> Patient:
        if is_admin(current_user):
            patient = self.patients.get_by_id(patient_id)
        else:
            patient = self.patients.get_owned_by_id(patient_id, current_user.id)

        if patient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

        return patient

    def _score_pcos(
        self, input_data: ClinicalInputPCOSCreate, top_n: int = 5
    ) -> tuple[float, list[dict[str, Any]], str]:
        """Calculates a PCOS risk score (0.0 to 1.0) using clinical diagnostic rules.

        Weights are allocated based on diagnostic significance:
        - Cycle irregularity (ovulatory dysfunction): 0.25
        - Hirsutism (hyperandrogenism): 0.15
        - Follicle size (2.0 to 9.0 mm arrested development): 0.15
        - LH/FSH ratio (>= 2.0: 0.15, >= 1.5: 0.07)
        - Acne (hyperandrogenism): 0.10
        - Hair loss (hyperandrogenism): 0.10
        - Insulin resistance (>= 2.5: 0.05, >= 1.9: 0.02)
        - BMI (>= 30.0: 0.05, >= 25.0: 0.03)
        """
        score = 0.0
        factors = []

        # 1. Menstrual Cycle Irregularity (cycle_regularity == False represents irregular cycle)
        if not input_data.cycle_regularity:
            impact = 0.25
            score += impact
            factors.append({
                "feature": "cycle_regularity",
                "input_value": 0.0,
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        else:
            factors.append({
                "feature": "cycle_regularity",
                "input_value": 1.0,
                "shap_value": 0.0,
                "absolute_impact": 0.0,
                "direction": "neutral",
            })

        # 2. Hirsutism (excessive hair growth)
        if input_data.hirsutism:
            impact = 0.15
            score += impact
            factors.append({
                "feature": "hirsutism",
                "input_value": 1.0,
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        else:
            factors.append({
                "feature": "hirsutism",
                "input_value": 0.0,
                "shap_value": 0.0,
                "absolute_impact": 0.0,
                "direction": "neutral",
            })

        # 3. Follicle size (2 to 9 mm indicating arrested antral follicles of PCOM)
        if 2.0 <= input_data.follicle_size <= 9.0:
            impact = 0.15
            score += impact
            factors.append({
                "feature": "follicle_size",
                "input_value": float(input_data.follicle_size),
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        else:
            factors.append({
                "feature": "follicle_size",
                "input_value": float(input_data.follicle_size),
                "shap_value": 0.0,
                "absolute_impact": 0.0,
                "direction": "neutral",
            })

        # 4. LH/FSH ratio
        if input_data.lh_fsh_ratio >= 2.0:
            impact = 0.15
            score += impact
            factors.append({
                "feature": "lh_fsh_ratio",
                "input_value": float(input_data.lh_fsh_ratio),
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        elif input_data.lh_fsh_ratio >= 1.5:
            impact = 0.07
            score += impact
            factors.append({
                "feature": "lh_fsh_ratio",
                "input_value": float(input_data.lh_fsh_ratio),
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        else:
            factors.append({
                "feature": "lh_fsh_ratio",
                "input_value": float(input_data.lh_fsh_ratio),
                "shap_value": 0.0,
                "absolute_impact": 0.0,
                "direction": "neutral",
            })

        # 5. Acne
        if input_data.acne:
            impact = 0.10
            score += impact
            factors.append({
                "feature": "acne",
                "input_value": 1.0,
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        else:
            factors.append({
                "feature": "acne",
                "input_value": 0.0,
                "shap_value": 0.0,
                "absolute_impact": 0.0,
                "direction": "neutral",
            })

        # 6. Hair loss (alopecia)
        if input_data.hair_loss:
            impact = 0.10
            score += impact
            factors.append({
                "feature": "hair_loss",
                "input_value": 1.0,
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        else:
            factors.append({
                "feature": "hair_loss",
                "input_value": 0.0,
                "shap_value": 0.0,
                "absolute_impact": 0.0,
                "direction": "neutral",
            })

        # 7. Insulin resistance (HOMA-IR markers)
        if input_data.insulin_resistance >= 2.5:
            impact = 0.05
            score += impact
            factors.append({
                "feature": "insulin_resistance",
                "input_value": float(input_data.insulin_resistance),
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        elif input_data.insulin_resistance >= 1.9:
            impact = 0.02
            score += impact
            factors.append({
                "feature": "insulin_resistance",
                "input_value": float(input_data.insulin_resistance),
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        else:
            factors.append({
                "feature": "insulin_resistance",
                "input_value": float(input_data.insulin_resistance),
                "shap_value": 0.0,
                "absolute_impact": 0.0,
                "direction": "neutral",
            })

        # 8. BMI
        if input_data.bmi >= 30.0:
            impact = 0.05
            score += impact
            factors.append({
                "feature": "bmi",
                "input_value": float(input_data.bmi),
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        elif input_data.bmi >= 25.0:
            impact = 0.03
            score += impact
            factors.append({
                "feature": "bmi",
                "input_value": float(input_data.bmi),
                "shap_value": impact,
                "absolute_impact": impact,
                "direction": "positive",
            })
        else:
            factors.append({
                "feature": "bmi",
                "input_value": float(input_data.bmi),
                "shap_value": 0.0,
                "absolute_impact": 0.0,
                "direction": "neutral",
            })

        # Standardize score boundaries
        score = min(max(score, 0.0), 1.0)

        # Sort factors by absolute impact descending
        factors.sort(key=lambda x: x["absolute_impact"], reverse=True)
        top_factors = factors[:top_n]

        # Generate detailed explanation text
        risk_level = "LOW"
        if score >= 0.66:
            risk_level = "HIGH"
        elif score >= 0.33:
            risk_level = "MEDIUM"

        explanation_parts = [
            f"PCOS clinical scoring engine calculated a risk score of {score:.1%} (Risk Level: {risk_level})."
        ]

        pos_factors = [f for f in factors if f["shap_value"] > 0]
        if pos_factors:
            explanation_parts.append("Key contributing clinical risk factors identified:")
            for f in pos_factors:
                feat_name = f["feature"].replace("_", " ").title()
                raw_val = input_data.__getattribute__(f["feature"])
                if isinstance(raw_val, bool):
                    val_str = "Present" if raw_val else "Abnormal/Irregular" if f["feature"] == "cycle_regularity" else "Normal/Regular"
                else:
                    val_str = f"{raw_val}"
                explanation_parts.append(f"- {feat_name} ({val_str}): +{f['shap_value']:.1%} risk impact")
        else:
            explanation_parts.append("No abnormal clinical risk factors were identified.")

        explanation = "\n".join(explanation_parts)

        return score, top_factors, explanation

    def _generate_recommendations(
        self, prediction_id: str, score: float, input_data: ClinicalInputPCOSCreate
    ) -> list[Recommendation]:
        recommendations = []

        if score >= 0.66:
            # High Risk
            recommendations.append(
                self.predictions.create_recommendation(
                    prediction_id=prediction_id,
                    category=RecommendationCategory.CONSULTATION,
                    description="High risk detected. Schedule a comprehensive consultation with a gynecologist or endocrinologist to evaluate PCOS.",
                )
            )
            recommendations.append(
                self.predictions.create_recommendation(
                    prediction_id=prediction_id,
                    category=RecommendationCategory.LIFESTYLE,
                    description="Incorporate targeted lifestyle modifications such as a low-glycemic index diet and consistent cardiovascular exercise.",
                )
            )

            # Symptom-specific recommendations
            if not input_data.cycle_regularity:
                recommendations.append(
                    self.predictions.create_recommendation(
                        prediction_id=prediction_id,
                        category=RecommendationCategory.FOLLOW_UP,
                        description="Irregular cycles increase endometrial risks. Discuss cycle-regulation therapies with your doctor.",
                    )
                )
            if input_data.insulin_resistance >= 2.0:
                recommendations.append(
                    self.predictions.create_recommendation(
                        prediction_id=prediction_id,
                        category=RecommendationCategory.DIET,
                        description="Significant insulin resistance detected. Focus on complex carbohydrates and speak to a doctor about insulin-sensitizing options.",
                    )
                )
            if input_data.bmi >= 25.0:
                recommendations.append(
                    self.predictions.create_recommendation(
                        prediction_id=prediction_id,
                        category=RecommendationCategory.DIET,
                        description="Elevated BMI (overweight/obese) exacerbates PCOS metabolic symptoms. A structured weight management program is advised.",
                    )
                )
            if input_data.hirsutism or input_data.acne or input_data.hair_loss:
                recommendations.append(
                    self.predictions.create_recommendation(
                        prediction_id=prediction_id,
                        category=RecommendationCategory.FOLLOW_UP,
                        description="Hyperandrogenic symptoms detected. Review anti-androgenic options or dermatological support with your healthcare team.",
                    )
                )
        elif score >= 0.33:
            # Medium Risk
            recommendations.append(
                self.predictions.create_recommendation(
                    prediction_id=prediction_id,
                    category=RecommendationCategory.FOLLOW_UP,
                    description="Medium risk detected. Track your menstrual cycles and schedule a routine follow-up with your primary physician.",
                )
            )
            recommendations.append(
                self.predictions.create_recommendation(
                    prediction_id=prediction_id,
                    category=RecommendationCategory.LIFESTYLE,
                    description="Emphasize balanced nutrition and regular physical activity to support hormone regulation.",
                )
            )
            if input_data.bmi >= 25.0:
                recommendations.append(
                    self.predictions.create_recommendation(
                        prediction_id=prediction_id,
                        category=RecommendationCategory.DIET,
                        description="Maintain a balanced, nutrient-dense diet to assist with weight control and prevent insulin resistance progression.",
                    )
                )
        else:
            # Low Risk
            recommendations.append(
                self.predictions.create_recommendation(
                    prediction_id=prediction_id,
                    category=RecommendationCategory.LIFESTYLE,
                    description="Low risk detected. Continue with healthy eating habits, regular physical activity, and standard clinical wellness checks.",
                )
            )

        return recommendations
