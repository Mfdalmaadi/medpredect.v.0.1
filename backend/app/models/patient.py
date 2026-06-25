from datetime import date
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Gender(StrEnum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Patient(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "patients"
    __table_args__ = (
        UniqueConstraint("doctor_id", "medical_identifier", name="uq_patients_doctor_medical_identifier"),
    )

    doctor_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    medical_identifier: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(nullable=False)
    gender: Mapped[Gender] = mapped_column(
        Enum(Gender, name="gender", native_enum=False, length=20),
        nullable=False,
    )
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    predictions: Mapped[list["Prediction"]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
