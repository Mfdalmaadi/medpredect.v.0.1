# MLService Guide

`MLService` is the backend-facing machine learning layer.

It hides the details of:

```text
loading model.pkl
loading scaler.pkl
scaling clinical input
predicting probability
generating SHAP explanations
classifying LOW/MEDIUM/HIGH risk
```

## Why This Service Exists

API routes should not load models, scale features, or call SHAP directly.

Routes should call one clean service method:

```python
result = ml_service.predict_diabetes(clinical_input)
```

That keeps ML logic isolated and easier to test.

## Risk Classification

The current educational thresholds are:

```text
probability < 0.33  -> LOW
probability < 0.66  -> MEDIUM
probability >= 0.66 -> HIGH
```

These thresholds are placeholders for the graduation project. In a real medical context, thresholds must be validated with domain experts.

## Dependency Injection

FastAPI can inject the service with:

```python
from fastapi import Depends
from app.api.deps import get_ml_service
from app.services.ml_service import MLService

def endpoint(ml_service: MLService = Depends(get_ml_service)):
    ...
```

The dependency uses caching so the model is not loaded again for every request.

## Error Handling

The service raises domain-specific exceptions:

```text
MLArtifactsNotFoundError
MLInputError
MLPredictionError
```

`get_ml_service()` converts missing artifact errors into HTTP 503 so future API endpoints return a clear response when `model.pkl` or `scaler.pkl` is missing.

## Example

```python
from app.services.ml_service import MLService

ml_service = MLService()

result = ml_service.predict_diabetes(
    {
        "pregnancies": 2,
        "glucose": 148,
        "blood_pressure": 72,
        "skin_thickness": 35,
        "insulin": 94,
        "bmi": 33.6,
        "diabetes_pedigree_function": 0.627,
        "age": 50,
    }
)

print(result.probability)
print(result.risk_level)
print(result.top_factors)
```
