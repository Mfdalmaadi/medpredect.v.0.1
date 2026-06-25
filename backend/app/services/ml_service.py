from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from app.ml.diabetes.shap_service import DiabetesSHAPService
from app.ml.diabetes.train_diabetes_model import FEATURE_COLUMNS
from app.models.prediction import DiseaseType, RiskLevel


DIABETES_ARTIFACTS_DIR = Path(__file__).resolve().parents[1] / "ml" / "diabetes" / "artifacts"


class MLServiceError(Exception):
    """Base exception for ML service failures."""


class MLArtifactsNotFoundError(MLServiceError):
    """Raised when model.pkl or scaler.pkl is missing."""


class MLInputError(MLServiceError):
    """Raised when clinical input is invalid for the selected model."""


class MLPredictionError(MLServiceError):
    """Raised when model inference or explainability fails."""


@dataclass(frozen=True)
class RiskThresholds:
    low_max: float = 0.33
    medium_max: float = 0.66


@dataclass(frozen=True)
class MLTopFactor:
    feature: str
    input_value: float
    shap_value: float
    absolute_impact: float
    direction: str


@dataclass(frozen=True)
class MLPredictionResult:
    disease_type: DiseaseType
    probability: float
    risk_level: RiskLevel
    top_factors: list[MLTopFactor]
    base_value: float
    feature_order: list[str]
    interpretation_note: str


class MLService:
    def __init__(
        self,
        *,
        diabetes_artifacts_dir: Path = DIABETES_ARTIFACTS_DIR,
        risk_thresholds: RiskThresholds = RiskThresholds(),
    ) -> None:
        self.diabetes_artifacts_dir = diabetes_artifacts_dir
        self.risk_thresholds = risk_thresholds
        self.diabetes_model = self._load_artifact(diabetes_artifacts_dir / "model.pkl")
        self.diabetes_scaler = self._load_artifact(diabetes_artifacts_dir / "scaler.pkl")
        self.diabetes_shap = DiabetesSHAPService(
            artifacts_dir=diabetes_artifacts_dir,
            model=self.diabetes_model,
            scaler=self.diabetes_scaler,
        )

    def predict_diabetes(self, clinical_input: dict[str, Any], *, top_n: int = 5) -> MLPredictionResult:
        model_features = self._normalize_diabetes_features(clinical_input)

        try:
            raw_frame = pd.DataFrame([[model_features[column] for column in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
            scaled_features = self.diabetes_scaler.transform(raw_frame)
            probability = float(self.diabetes_model.predict_proba(scaled_features)[0][1])
            shap_result = self.diabetes_shap.explain(model_features, top_n=top_n)
        except Exception as exc:
            raise MLPredictionError("Diabetes prediction failed.") from exc

        return MLPredictionResult(
            disease_type=DiseaseType.DIABETES,
            probability=probability,
            risk_level=self.classify_risk(probability),
            top_factors=[MLTopFactor(**factor) for factor in shap_result["top_factors"]],
            base_value=float(shap_result["base_value"]),
            feature_order=list(shap_result["feature_order"]),
            interpretation_note=shap_result["interpretation_note"],
        )

    def predict(self, disease_type: DiseaseType, clinical_input: dict[str, Any], *, top_n: int = 5) -> MLPredictionResult:
        if disease_type == DiseaseType.DIABETES:
            return self.predict_diabetes(clinical_input, top_n=top_n)

        raise MLInputError(f"No trained model is available for disease_type={disease_type.value}.")

    def classify_risk(self, probability: float) -> RiskLevel:
        if probability < 0 or probability > 1:
            raise MLInputError("Probability must be between 0 and 1.")

        if probability < self.risk_thresholds.low_max:
            return RiskLevel.LOW
        if probability < self.risk_thresholds.medium_max:
            return RiskLevel.MEDIUM
        return RiskLevel.HIGH

    def _load_artifact(self, artifact_path: Path) -> Any:
        if not artifact_path.exists():
            raise MLArtifactsNotFoundError(
                f"Missing ML artifact: {artifact_path}. Train the model before starting prediction endpoints."
            )

        try:
            return joblib.load(artifact_path)
        except Exception as exc:
            raise MLArtifactsNotFoundError(f"Could not load ML artifact: {artifact_path}.") from exc

    def _normalize_diabetes_features(self, clinical_input: dict[str, Any]) -> dict[str, float]:
        aliases = {
            "Pregnancies": "Pregnancies",
            "pregnancies": "Pregnancies",
            "Glucose": "Glucose",
            "glucose": "Glucose",
            "BloodPressure": "BloodPressure",
            "blood_pressure": "BloodPressure",
            "SkinThickness": "SkinThickness",
            "skin_thickness": "SkinThickness",
            "Insulin": "Insulin",
            "insulin": "Insulin",
            "BMI": "BMI",
            "bmi": "BMI",
            "DiabetesPedigreeFunction": "DiabetesPedigreeFunction",
            "diabetes_pedigree_function": "DiabetesPedigreeFunction",
            "Age": "Age",
            "age": "Age",
        }

        normalized: dict[str, float] = {}
        unexpected = [key for key in clinical_input if key not in aliases]
        if unexpected:
            raise MLInputError(f"Unexpected diabetes features: {unexpected}")

        for input_key, model_key in aliases.items():
            if input_key in clinical_input:
                normalized[model_key] = self._to_float(input_key, clinical_input[input_key])

        missing = [column for column in FEATURE_COLUMNS if column not in normalized]
        if missing:
            raise MLInputError(f"Missing diabetes features: {missing}")

        return normalized

    def _to_float(self, field_name: str, value: Any) -> float:
        try:
            return float(value)
        except (TypeError, ValueError) as exc:
            raise MLInputError(f"{field_name} must be numeric.") from exc
