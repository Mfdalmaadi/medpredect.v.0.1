# Example PDF Output

Endpoint:

```text
GET /api/v1/reports/predictions/{prediction_id}/pdf
```

Response:

```text
Content-Type: application/pdf
Content-Disposition: attachment; filename*=UTF-8''MedPredict_Benali_Amina_diabetes_20260618.pdf
```

The generated PDF contains:

```text
MedPredict AI - Prediction Report

Medical disclaimer

Patient Information
- Patient ID
- Medical Identifier
- Full Name
- Date of Birth
- Gender
- Phone

Prediction Result
- Prediction ID
- Disease
- Probability
- Risk Level
- Created At

Clinical Input
- Diabetes or PCOS fields, depending on prediction type

SHAP Summary
- Feature
- Input Value
- SHAP Value
- Impact
- Direction

Recommendations
- Category
- Recommendation text
```

The report is generated from persisted database data, not from client-submitted payloads.
