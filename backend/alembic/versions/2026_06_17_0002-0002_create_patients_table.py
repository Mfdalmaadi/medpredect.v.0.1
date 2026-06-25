"""create patients table

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-17 00:02:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "patients",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("doctor_id", sa.String(length=36), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("medical_identifier", sa.String(length=100), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column(
            "gender",
            sa.Enum("male", "female", "other", name="gender", native_enum=False, length=20),
            nullable=False,
        ),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], name=op.f("fk_patients_doctor_id_users"), ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_patients")),
        sa.UniqueConstraint("doctor_id", "medical_identifier", name="uq_patients_doctor_medical_identifier"),
    )
    op.create_index(op.f("ix_patients_doctor_id"), "patients", ["doctor_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_patients_doctor_id"), table_name="patients")
    op.drop_table("patients")
