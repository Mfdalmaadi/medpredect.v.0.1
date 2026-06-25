# SHAP Explainability Guide

SHAP stands for SHapley Additive exPlanations.

It is a method for explaining why a machine learning model produced a specific prediction.

## Beginner Explanation

Imagine the model predicts:

```text
diabetes risk probability = 0.82
```

SHAP helps answer:

```text
Which clinical values pushed the model toward this risk score?
Which values pushed the model away from risk?
```

Each feature gets a contribution value.

```text
positive SHAP value = pushes prediction higher
negative SHAP value = pushes prediction lower
larger absolute value = stronger influence
```

## Why SHAP Is Useful

Without SHAP, a model only returns a score.

With SHAP, the system can explain the main factors behind that score, such as:

```text
Glucose increased risk
BMI increased risk
Age increased risk
Insulin decreased risk
```

This fits the MedPredict AI conception document because the platform must avoid being a black box.

## Important Medical Warning

SHAP explains the model, not the biological truth.

If SHAP says glucose contributed strongly, it means:

```text
the trained model used glucose strongly for this prediction
```

It does not mean:

```text
glucose alone caused the patient condition
```

## Example Response

```json
{
  "disease_type": "diabetes",
  "probability": 0.82,
  "base_value": 0.35,
  "top_factors": [
    {
      "feature": "Glucose",
      "input_value": 148.0,
      "shap_value": 0.21,
      "absolute_impact": 0.21,
      "direction": "increases_risk"
    },
    {
      "feature": "BMI",
      "input_value": 33.6,
      "shap_value": 0.14,
      "absolute_impact": 0.14,
      "direction": "increases_risk"
    },
    {
      "feature": "Age",
      "input_value": 50.0,
      "shap_value": 0.09,
      "absolute_impact": 0.09,
      "direction": "increases_risk"
    }
  ],
  "feature_order": [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age"
  ],
  "interpretation_note": "Positive SHAP values push the prediction toward higher diabetes risk. Negative SHAP values push it toward lower diabetes risk."
}
```

## Integration Plan

1. Train the model and save:

```text
app/ml/diabetes/artifacts/model.pkl
app/ml/diabetes/artifacts/scaler.pkl
```

2. In the future prediction service:

```text
receive clinical input
validate fields
scale values with scaler.pkl
predict probability with model.pkl
call DiabetesSHAPService.explain()
save prediction result
save top SHAP factors
return probability + risk level + SHAP explanation
```

3. In the frontend:

```text
show risk gauge
show top contributing factors chart
show explanation note
```

## Backend Usage Example

```python
from app.ml.diabetes.shap_service import DiabetesSHAPService

service = DiabetesSHAPService()

result = service.explain(
    {
        "Pregnancies": 2,
        "Glucose": 148,
        "BloodPressure": 72,
        "SkinThickness": 35,
        "Insulin": 94,
        "BMI": 33.6,
        "DiabetesPedigreeFunction": 0.627,
        "Age": 50,
    },
    top_n=5,
)
```
