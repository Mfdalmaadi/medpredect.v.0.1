from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.prediction import (
    DiseaseType,
    NotificationType,
    RecommendationCategory,
    RiskLevel,
)


class ClinicalInputDiabetesBase(BaseModel):
    pregnancies: int = Field(ge=0, le=30, examples=[2])
    glucose: float = Field(ge=0, le=400, examples=[148.0])
    blood_pressure: float = Field(ge=0, le=250, examples=[72.0])
    skin_thickness: float = Field(ge=0, le=150, examples=[35.0])
    insulin: float = Field(ge=0, le=1000, examples=[94.0])
    bmi: float = Field(ge=0, le=100, examples=[33.6])
    diabetes_pedigree_function: float = Field(ge=0, le=5, examples=[0.627])
    age: int = Field(ge=1, le=120, examples=[50])


class ClinicalInputDiabetesCreate(ClinicalInputDiabetesBase):
    pass


class ClinicalInputDiabetesRead(ClinicalInputDiabetesBase):
    id: str
    prediction_id: str

    model_config = ConfigDict(from_attributes=True)


class ClinicalInputPCOSBase(BaseModel):
    age: int = Field(ge=1, le=120, examples=[28])
    bmi: float = Field(ge=0, le=100, examples=[27.5])
    cycle_regularity: bool = Field(examples=[False])
    acne: bool = Field(examples=[True])
    hair_loss: bool = Field(examples=[False])
    hirsutism: bool = Field(examples=[True])
    insulin_resistance: float = Field(ge=0, le=100, examples=[2.4])
    lh_fsh_ratio: float = Field(ge=0, le=50, examples=[1.8])
    follicle_size: float = Field(ge=0, le=100, examples=[12.0])


class ClinicalInputPCOSCreate(ClinicalInputPCOSBase):
    pass


class ClinicalInputPCOSRead(ClinicalInputPCOSBase):
    id: str
    prediction_id: str

    model_config = ConfigDict(from_attributes=True)


class RecommendationCreate(BaseModel):
    category: RecommendationCategory = Field(examples=[RecommendationCategory.LIFESTYLE])
    description: str = Field(min_length=1, max_length=1000, examples=["Schedule a medical follow-up."])


class RecommendationRead(RecommendationCreate):
    id: str
    prediction_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShapValueRead(BaseModel):
    id: str
    prediction_id: str
    feature_name: str
    input_value: float
    shap_value: float
    absolute_impact: float
    direction: str

    model_config = ConfigDict(from_attributes=True)


class NotificationCreate(BaseModel):
    user_id: str = Field(examples=["00000000-0000-0000-0000-000000000000"])
    prediction_id: str | None = Field(default=None, examples=["00000000-0000-0000-0000-000000000000"])
    type: NotificationType = Field(examples=[NotificationType.ALERT_HIGH_RISK])
    message: str = Field(min_length=1, max_length=1000, examples=["High risk prediction detected."])


class NotificationRead(NotificationCreate):
    id: str
    is_read: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PredictionBase(BaseModel):
    patient_id: str = Field(examples=["00000000-0000-0000-0000-000000000000"])
    doctor_id: str = Field(examples=["00000000-0000-0000-0000-000000000000"])
    disease_type: DiseaseType = Field(examples=[DiseaseType.DIABETES])
    probability: float = Field(ge=0, le=1, examples=[0.82])
    risk_level: RiskLevel = Field(examples=[RiskLevel.HIGH])


class PredictionCreate(PredictionBase):
    diabetes_input: ClinicalInputDiabetesCreate | None = None
    pcos_input: ClinicalInputPCOSCreate | None = None
    recommendations: list[RecommendationCreate] = Field(default_factory=list)


class PredictionRead(PredictionBase):
    id: str
    created_at: datetime
    updated_at: datetime
    diabetes_input: ClinicalInputDiabetesRead | None = None
    pcos_input: ClinicalInputPCOSRead | None = None
    recommendations: list[RecommendationRead] = Field(default_factory=list)
    shap_values: list[ShapValueRead] = Field(default_factory=list)
    notifications: list[NotificationRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PredictionList(BaseModel):
    items: list[PredictionRead]
    total: int
    skip: int
    limit: int


class DiabetesPredictionRequest(BaseModel):
    patient_id: str = Field(examples=["00000000-0000-0000-0000-000000000000"])
    clinical_input: ClinicalInputDiabetesCreate
    top_n: int = Field(default=5, ge=1, le=8, examples=[5])

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "patient_id": "00000000-0000-0000-0000-000000000000",
                    "clinical_input": {
                        "pregnancies": 2,
                        "glucose": 148,
                        "blood_pressure": 72,
                        "skin_thickness": 35,
                        "insulin": 94,
                        "bmi": 33.6,
                        "diabetes_pedigree_function": 0.627,
                        "age": 50,
                    },
                    "top_n": 5,
                }
            ]
        }
    }


class PCOSPredictionRequest(BaseModel):
    patient_id: str = Field(examples=["00000000-0000-0000-0000-000000000000"])
    clinical_input: ClinicalInputPCOSCreate
    top_n: int = Field(default=5, ge=1, le=9, examples=[5])


class PredictionFactorResponse(BaseModel):
    feature: str
    input_value: float
    shap_value: float
    absolute_impact: float
    direction: str


class PredictionResponse(BaseModel):
    prediction_id: str
    patient_id: str
    doctor_id: str
    disease_type: DiseaseType
    probability: float
    risk_level: RiskLevel
    top_factors: list[PredictionFactorResponse]
    recommendations: list[RecommendationRead]
    notification_created: bool
    interpretation_note: str
