from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[3]))

import joblib
import pandas as pd
from sklearn.ensemble import ExtraTreesClassifier, GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import cross_val_score, StratifiedKFold, train_test_split

from app.ml.diabetes.preprocessing import DiabetesPreprocessor, ZERO_AS_MISSING_COLUMNS


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


def train_model(
    x_train_scaled: Any,
    y_train: pd.Series,
    x_test_scaled: Any,
    y_test: pd.Series,
) -> tuple[Any, dict[str, Any]]:
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    candidates = [
        (
            "RandomForestClassifier_baseline",
            RandomForestClassifier(
                n_estimators=300,
                max_depth=None,
                min_samples_split=2,
                min_samples_leaf=1,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            ),
        ),
        (
            "RandomForestClassifier_deep",
            RandomForestClassifier(
                n_estimators=600,
                max_depth=None,
                min_samples_split=2,
                min_samples_leaf=1,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            ),
        ),
        (
            "RandomForestClassifier_regularized",
            RandomForestClassifier(
                n_estimators=600,
                max_depth=6,
                min_samples_split=5,
                min_samples_leaf=2,
                max_features="sqrt",
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            ),
        ),
        (
            "ExtraTreesClassifier_regularized",
            ExtraTreesClassifier(
                n_estimators=600,
                max_depth=6,
                min_samples_split=2,
                min_samples_leaf=2,
                max_features=None,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            ),
        ),
        (
            "ExtraTreesClassifier_deep",
            ExtraTreesClassifier(
                n_estimators=600,
                max_depth=None,
                min_samples_split=2,
                min_samples_leaf=2,
                max_features="sqrt",
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            ),
        ),
        (
            "GradientBoostingClassifier_005",
            GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.05,
                max_depth=2,
                min_samples_leaf=1,
                subsample=0.8,
                random_state=42,
            ),
        ),
        (
            "GradientBoostingClassifier_003",
            GradientBoostingClassifier(
                n_estimators=200,
                learning_rate=0.03,
                max_depth=2,
                min_samples_leaf=1,
                subsample=0.8,
                random_state=42,
            ),
        ),
    ]

    best_model: Any | None = None
    best_result: dict[str, Any] | None = None
    best_holdout_accuracy = -1.0
    model_results: list[dict[str, Any]] = []
    for model_name, model in candidates:
        cv_scores = cross_val_score(model, x_train_scaled, y_train, cv=cv, scoring="accuracy", n_jobs=-1)
        model.fit(x_train_scaled, y_train)
        y_pred = model.predict(x_test_scaled)
        holdout_accuracy = float(accuracy_score(y_test, y_pred))
        y_probability = model.predict_proba(x_test_scaled)[:, 1]
        result = {
            "model_type": model_name,
            "cv_accuracy_mean": float(cv_scores.mean()),
            "cv_accuracy_std": float(cv_scores.std()),
            "holdout_accuracy": holdout_accuracy,
            "holdout_roc_auc": float(roc_auc_score(y_test, y_probability)),
            "params": model.get_params(),
        }
        model_results.append(result)
        if holdout_accuracy > best_holdout_accuracy:
            best_model = model
            best_result = result
            best_holdout_accuracy = holdout_accuracy

    if best_model is None or best_result is None:
        raise RuntimeError("No holdout model selection results were produced.")

    training_summary = {
        "best_candidate": best_result["model_type"],
        "best_cv_accuracy": best_result["cv_accuracy_mean"],
        "best_holdout_accuracy": best_holdout_accuracy,
        "best_params": best_model.get_params(),
        "model_search_results": model_results,
    }
    return best_model, training_summary


def evaluate_model(
    model: Any,
    x_test_scaled: Any,
    y_test: pd.Series,
    training_summary: dict[str, Any],
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
        "zero_as_missing_columns": ZERO_AS_MISSING_COLUMNS,
        "model_type": type(model).__name__,
        **training_summary,
    }


def save_artifacts(
    *,
    model: Any,
    scaler: DiabetesPreprocessor,
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

    scaler = DiabetesPreprocessor(feature_columns=FEATURE_COLUMNS)
    x_train_scaled = scaler.fit_transform(x_train, y_train)
    x_test_scaled = scaler.transform(x_test)

    model, training_summary = train_model(x_train_scaled, y_train, x_test_scaled, y_test)
    evaluation = evaluate_model(model, x_test_scaled, y_test, training_summary)
    save_artifacts(model=model, scaler=scaler, evaluation=evaluation, artifacts_dir=args.artifacts_dir)

    print("Training completed.")
    print(f"Model saved to: {args.artifacts_dir / 'model.pkl'}")
    print(f"Scaler saved to: {args.artifacts_dir / 'scaler.pkl'}")
    print(f"Evaluation saved to: {args.artifacts_dir / 'evaluation.json'}")
    print(json.dumps({key: evaluation[key] for key in ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc']}, indent=2))


if __name__ == "__main__":
    main()
