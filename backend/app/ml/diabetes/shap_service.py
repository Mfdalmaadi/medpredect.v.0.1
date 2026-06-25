from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import shap

from app.ml.diabetes.train_diabetes_model import FEATURE_COLUMNS


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_ARTIFACTS_DIR = BASE_DIR / "artifacts"


@dataclass(frozen=True)
class SHAPFactor:
    feature: str
    input_value: float
    shap_value: float
    absolute_impact: float
    direction: str


class DiabetesSHAPService:
    def __init__(
        self,
        artifacts_dir: Path = DEFAULT_ARTIFACTS_DIR,
        model: Any | None = None,
        scaler: Any | None = None,
    ) -> None:
        self.artifacts_dir = artifacts_dir
        self.model = model if model is not None else self._load_artifact("model.pkl")
        self.scaler = scaler if scaler is not None else self._load_artifact("scaler.pkl")
        self.explainer = shap.TreeExplainer(self.model)

    def explain(self, features: dict[str, float], *, top_n: int = 5) -> dict[str, Any]:
        self._validate_features(features)

        raw_frame = pd.DataFrame([[features[column] for column in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
        scaled_features = self.scaler.transform(raw_frame)

        probability = float(self.model.predict_proba(scaled_features)[0][1])
        shap_values = self._extract_positive_class_shap_values(scaled_features)
        base_value = self._extract_positive_class_base_value()

        factors = self._build_ranked_factors(features, shap_values, top_n)

        return {
            "disease_type": "diabetes",
            "probability": probability,
            "base_value": base_value,
            "top_factors": [factor.__dict__ for factor in factors],
            "feature_order": FEATURE_COLUMNS,
            "interpretation_note": (
                "Positive SHAP values push the prediction toward higher diabetes risk. "
                "Negative SHAP values push it toward lower diabetes risk."
            ),
        }

    def _load_artifact(self, filename: str) -> Any:
        artifact_path = self.artifacts_dir / filename
        if not artifact_path.exists():
            raise FileNotFoundError(
                f"Missing artifact: {artifact_path}. Train the diabetes model before using SHAP."
            )
        return joblib.load(artifact_path)

    def _validate_features(self, features: dict[str, float]) -> None:
        missing = [column for column in FEATURE_COLUMNS if column not in features]
        extra = [column for column in features if column not in FEATURE_COLUMNS]

        if missing:
            raise ValueError(f"Missing diabetes features: {missing}")
        if extra:
            raise ValueError(f"Unexpected diabetes features: {extra}")

    def _extract_positive_class_shap_values(self, scaled_features: Any) -> np.ndarray:
        shap_values = self.explainer.shap_values(scaled_features)

        if isinstance(shap_values, list):
            return np.asarray(shap_values[1][0], dtype=float)

        shap_array = np.asarray(shap_values, dtype=float)
        if shap_array.ndim == 3:
            return shap_array[0, :, 1]
        if shap_array.ndim == 2:
            return shap_array[0]

        raise ValueError(f"Unsupported SHAP values shape: {shap_array.shape}")

    def _extract_positive_class_base_value(self) -> float:
        expected_value = self.explainer.expected_value

        if isinstance(expected_value, list):
            return float(expected_value[1])

        expected_array = np.asarray(expected_value, dtype=float)
        if expected_array.ndim == 1 and expected_array.size > 1:
            return float(expected_array[1])

        return float(expected_array.reshape(-1)[0])

    def _build_ranked_factors(
        self,
        features: dict[str, float],
        shap_values: np.ndarray,
        top_n: int,
    ) -> list[SHAPFactor]:
        factors = [
            SHAPFactor(
                feature=feature,
                input_value=float(features[feature]),
                shap_value=float(shap_value),
                absolute_impact=abs(float(shap_value)),
                direction="increases_risk" if shap_value >= 0 else "decreases_risk",
            )
            for feature, shap_value in zip(FEATURE_COLUMNS, shap_values, strict=True)
        ]
        return sorted(factors, key=lambda factor: factor.absolute_impact, reverse=True)[:top_n]
