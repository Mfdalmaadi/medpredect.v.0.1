from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET_PATH = BASE_DIR / "data" / "diabetes.csv"
DEFAULT_ARTIFACTS_DIR = BASE_DIR / "artifacts"

FEATURE_COLUMNS = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]
TARGET_COLUMN = "Outcome"


def load_dataset(dataset_path: Path) -> pd.DataFrame:
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {dataset_path}. "
            "Place diabetes.csv in app/ml/diabetes/data/ or pass --data-path."
        )

    df = pd.read_csv(dataset_path)
    validate_dataset(df)
    return df


def validate_dataset(df: pd.DataFrame) -> None:
    required_columns = FEATURE_COLUMNS + [TARGET_COLUMN]
    missing_columns = [column for column in required_columns if column not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")

    if df[required_columns].isna().any().any():
        raise ValueError("Dataset contains missing values. Clean or impute them before training.")

    invalid_targets = set(df[TARGET_COLUMN].unique()) - {0, 1}
    if invalid_targets:
        raise ValueError(f"Outcome must contain only 0 and 1. Found: {sorted(invalid_targets)}")


def split_features_and_target(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    x = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    return x, y


def train_model(x_train_scaled: Any, y_train: pd.Series) -> RandomForestClassifier:
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(x_train_scaled, y_train)
    return model


def evaluate_model(
    model: RandomForestClassifier,
    x_test_scaled: Any,
    y_test: pd.Series,
) -> dict[str, Any]:
    y_pred = model.predict(x_test_scaled)
    y_probability = model.predict_proba(x_test_scaled)[:, 1]

    return {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1_score": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_probability),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "classification_report": classification_report(y_test, y_pred, zero_division=0, output_dict=True),
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "model_type": "RandomForestClassifier",
    }


def save_artifacts(
    *,
    model: RandomForestClassifier,
    scaler: StandardScaler,
    evaluation: dict[str, Any],
    artifacts_dir: Path,
) -> None:
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, artifacts_dir / "model.pkl")
    joblib.dump(scaler, artifacts_dir / "scaler.pkl")

    with (artifacts_dir / "evaluation.json").open("w", encoding="utf-8") as file:
        json.dump(evaluation, file, indent=2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the MedPredict AI diabetes model.")
    parser.add_argument("--data-path", type=Path, default=DEFAULT_DATASET_PATH)
    parser.add_argument("--artifacts-dir", type=Path, default=DEFAULT_ARTIFACTS_DIR)
    parser.add_argument("--test-size", type=float, default=0.2)
    args = parser.parse_args()

    df = load_dataset(args.data_path)
    x, y = split_features_and_target(df)

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=args.test_size,
        random_state=42,
        stratify=y,
    )

    scaler = StandardScaler()
    x_train_scaled = scaler.fit_transform(x_train)
    x_test_scaled = scaler.transform(x_test)

    model = train_model(x_train_scaled, y_train)
    evaluation = evaluate_model(model, x_test_scaled, y_test)
    save_artifacts(model=model, scaler=scaler, evaluation=evaluation, artifacts_dir=args.artifacts_dir)

    print("Training completed.")
    print(f"Model saved to: {args.artifacts_dir / 'model.pkl'}")
    print(f"Scaler saved to: {args.artifacts_dir / 'scaler.pkl'}")
    print(f"Evaluation saved to: {args.artifacts_dir / 'evaluation.json'}")
    print(json.dumps({key: evaluation[key] for key in ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc']}, indent=2))


if __name__ == "__main__":
    main()
