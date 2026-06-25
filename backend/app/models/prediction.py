from enum import StrEnum

from sqlalchemy import CheckConstraint, Enum, Float, ForeignKey, String, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DiseaseType(StrEnum):
    DIABETES = "diabetes"
    PCOS = "pcos"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RecommendationCategory(StrEnum):
    DIET = "diet"
    EXERCISE = "exercise"
    LIFESTYLE = "lifestyle"
    CONSULTATION = "consultation"
    FOLLOW_UP = "follow_up"


class NotificationType(StrEnum):
    ALERT_HIGH_RISK = "alert_high_risk"
    REMINDER_CONSULT = "reminder_consult"
    GOAL_ACHIEVED = "goal_achieved"


class Prediction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "predictions"
    __table_args__ = (
        CheckConstraint("probability >= 0 AND probability <= 1", name="ck_predictions_probability_range"),
    )

    patient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("patients.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    doctor_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    disease_type: Mapped[DiseaseType] = mapped_column(
        Enum(DiseaseType, name="disease_type", native_enum=False, length=20),
        index=True,
        nullable=False,
    )
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[RiskLevel] = mapped_column(
        Enum(RiskLevel, name="risk_level", native_enum=False, length=20),
        index=True,
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship(back_populates="predictions")
    doctor: Mapped["User"] = relationship(back_populates="predictions")
    diabetes_input: Mapped["ClinicalInputDiabetes | None"] = relationship(
        back_populates="prediction",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )
    pcos_input: Mapped["ClinicalInputPCOS | None"] = relationship(
        back_populates="prediction",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(
        back_populates="prediction",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    shap_values: Mapped[list["ShapValue"]] = relationship(
        back_populates="prediction",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="prediction",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ClinicalInputDiabetes(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "clinical_inputs_diabetes"

    prediction_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    pregnancies: Mapped[int] = mapped_column(nullable=False)
    glucose: Mapped[float] = mapped_column(Float, nullable=False)
    blood_pressure: Mapped[float] = mapped_column(Float, nullable=False)
    skin_thickness: Mapped[float] = mapped_column(Float, nullable=False)
    insulin: Mapped[float] = mapped_column(Float, nullable=False)
    bmi: Mapped[float] = mapped_column(Float, nullable=False)
    diabetes_pedigree_function: Mapped[float] = mapped_column(Float, nullable=False)
    age: Mapped[int] = mapped_column(nullable=False)

    prediction: Mapped["Prediction"] = relationship(back_populates="diabetes_input")


class ClinicalInputPCOS(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "clinical_inputs_pcos"

    prediction_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    age: Mapped[int] = mapped_column(nullable=False)
    bmi: Mapped[float] = mapped_column(Float, nullable=False)
    cycle_regularity: Mapped[bool] = mapped_column(nullable=False)
    acne: Mapped[bool] = mapped_column(nullable=False)
    hair_loss: Mapped[bool] = mapped_column(nullable=False)
    hirsutism: Mapped[bool] = mapped_column(nullable=False)
    insulin_resistance: Mapped[float] = mapped_column(Float, nullable=False)
    lh_fsh_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    follicle_size: Mapped[float] = mapped_column(Float, nullable=False)

    prediction: Mapped["Prediction"] = relationship(back_populates="pcos_input")


class Recommendation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "recommendations"

    prediction_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    category: Mapped[RecommendationCategory] = mapped_column(
        Enum(RecommendationCategory, name="recommendation_category", native_enum=False, length=30),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(String(1000), nullable=False)

    prediction: Mapped["Prediction"] = relationship(back_populates="recommendations")


class ShapValue(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "shap_values"

    prediction_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    input_value: Mapped[float] = mapped_column(Float, nullable=False)
    shap_value: Mapped[float] = mapped_column(Float, nullable=False)
    absolute_impact: Mapped[float] = mapped_column(Float, nullable=False)
    direction: Mapped[str] = mapped_column(String(30), nullable=False)

    prediction: Mapped["Prediction"] = relationship(back_populates="shap_values")


class Notification(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    prediction_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type", native_enum=False, length=40),
        index=True,
        nullable=False,
    )
    message: Mapped[str] = mapped_column(String(1000), nullable=False)
    is_read: Mapped[bool] = mapped_column(default=False, server_default=false(), nullable=False)

    user: Mapped["User"] = relationship(back_populates="notifications")
    prediction: Mapped["Prediction | None"] = relationship(back_populates="notifications")
