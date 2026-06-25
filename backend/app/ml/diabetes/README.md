# Diabetes Prediction Model Training

This folder contains the training workflow for the MedPredict AI diabetes model.

Expected dataset format:

```text
Pregnancies
Glucose
BloodPressure
SkinThickness
Insulin
BMI
DiabetesPedigreeFunction
Age
Outcome
```

`Outcome` is the target column:

```text
0 = no diabetes risk label in dataset
1 = diabetes risk label in dataset
```

Recommended source: the Pima Indians Diabetes dataset, commonly distributed as
`diabetes.csv`.

Put the CSV here:

```text
app/ml/diabetes/data/diabetes.csv
```

Then run:

```bash
python app/ml/diabetes/train_diabetes_model.py
```

Generated artifacts:

```text
app/ml/diabetes/artifacts/model.pkl
app/ml/diabetes/artifacts/scaler.pkl
app/ml/diabetes/artifacts/evaluation.json
```

SHAP explainability is implemented in:

```text
app/ml/diabetes/shap_service.py
```

It requires trained artifacts before use:

```text
model.pkl
scaler.pkl
```

Important: this model is educational and must not be used as a medical device.
