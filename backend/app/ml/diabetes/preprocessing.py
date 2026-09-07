from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


ZERO_AS_MISSING_COLUMNS = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]


class DiabetesPreprocessor(BaseEstimator, TransformerMixin):
    def __init__(
        self,
        feature_columns: list[str],
        zero_as_missing_columns: list[str] | None = None,
    ) -> None:
        self.feature_columns = feature_columns
        self.zero_as_missing_columns = zero_as_missing_columns or ZERO_AS_MISSING_COLUMNS
        self.pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]
        )

    def fit(self, x: pd.DataFrame, y: pd.Series | None = None) -> "DiabetesPreprocessor":
        cleaned = self._replace_zero_markers(x)
        self.pipeline.fit(cleaned, y)
        return self

    def transform(self, x: pd.DataFrame) -> Any:
        cleaned = self._replace_zero_markers(x)
        return self.pipeline.transform(cleaned)

    def _replace_zero_markers(self, x: pd.DataFrame) -> pd.DataFrame:
        cleaned = pd.DataFrame(x, columns=self.feature_columns).copy()
        for column in self.zero_as_missing_columns:
            cleaned[column] = cleaned[column].replace(0, np.nan)
        return cleaned
