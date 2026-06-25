"""create prediction structures

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-17 00:04:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "predictions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("patient_id", sa.String(length=36), nullable=False),
        sa.Column("doctor_id", sa.String(length=36), nullable=False),
        sa.Column(
            "disease_type",
            sa.Enum("diabetes", "pcos", name="disease_type", native_enum=False, length=20),
            nullable=False,
        ),
        sa.Column("probability", sa.Float(), nullable=False),
        sa.Column(
            "risk_level",
            sa.Enum("low", "medium", "high", name="risk_level", native_enum=False, length=20),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("probability >= 0 AND probability <= 1", name="ck_predictions_probability_range"),
        sa.ForeignKeyConstraint(
            ["doctor_id"],
            ["users.id"],
            name=op.f("fk_predictions_doctor_id_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["patients.id"],
            name=op.f("fk_predictions_patient_id_patients"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_predictions")),
    )
    op.create_index(op.f("ix_predictions_disease_type"), "predictions", ["disease_type"], unique=False)
    op.create_index(op.f("ix_predictions_doctor_id"), "predictions", ["doctor_id"], unique=False)
    op.create_index(op.f("ix_predictions_patient_id"), "predictions", ["patient_id"], unique=False)
    op.create_index(op.f("ix_predictions_risk_level"), "predictions", ["risk_level"], unique=False)

    op.create_table(
        "clinical_inputs_diabetes",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("prediction_id", sa.String(length=36), nullable=False),
        sa.Column("pregnancies", sa.Integer(), nullable=False),
        sa.Column("glucose", sa.Float(), nullable=False),
        sa.Column("blood_pressure", sa.Float(), nullable=False),
        sa.Column("skin_thickness", sa.Float(), nullable=False),
        sa.Column("insulin", sa.Float(), nullable=False),
        sa.Column("bmi", sa.Float(), nullable=False),
        sa.Column("diabetes_pedigree_function", sa.Float(), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["prediction_id"],
            ["predictions.id"],
            name=op.f("fk_clinical_inputs_diabetes_prediction_id_predictions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_clinical_inputs_diabetes")),
        sa.UniqueConstraint("prediction_id", name=op.f("uq_clinical_inputs_diabetes_prediction_id")),
    )

    op.create_table(
        "clinical_inputs_pcos",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("prediction_id", sa.String(length=36), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("bmi", sa.Float(), nullable=False),
        sa.Column("cycle_regularity", sa.Boolean(), nullable=False),
        sa.Column("acne", sa.Boolean(), nullable=False),
        sa.Column("hair_loss", sa.Boolean(), nullable=False),
        sa.Column("hirsutism", sa.Boolean(), nullable=False),
        sa.Column("insulin_resistance", sa.Float(), nullable=False),
        sa.Column("lh_fsh_ratio", sa.Float(), nullable=False),
        sa.Column("follicle_size", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(
            ["prediction_id"],
            ["predictions.id"],
            name=op.f("fk_clinical_inputs_pcos_prediction_id_predictions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_clinical_inputs_pcos")),
        sa.UniqueConstraint("prediction_id", name=op.f("uq_clinical_inputs_pcos_prediction_id")),
    )

    op.create_table(
        "recommendations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("prediction_id", sa.String(length=36), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "diet",
                "exercise",
                "lifestyle",
                "consultation",
                "follow_up",
                name="recommendation_category",
                native_enum=False,
                length=30,
            ),
            nullable=False,
        ),
        sa.Column("description", sa.String(length=1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["prediction_id"],
            ["predictions.id"],
            name=op.f("fk_recommendations_prediction_id_predictions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recommendations")),
    )
    op.create_index(op.f("ix_recommendations_prediction_id"), "recommendations", ["prediction_id"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("prediction_id", sa.String(length=36), nullable=True),
        sa.Column(
            "type",
            sa.Enum(
                "alert_high_risk",
                "reminder_consult",
                "goal_achieved",
                name="notification_type",
                native_enum=False,
                length=40,
            ),
            nullable=False,
        ),
        sa.Column("message", sa.String(length=1000), nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["prediction_id"],
            ["predictions.id"],
            name=op.f("fk_notifications_prediction_id_predictions"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_notifications_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications")),
    )
    op.create_index(op.f("ix_notifications_prediction_id"), "notifications", ["prediction_id"], unique=False)
    op.create_index(op.f("ix_notifications_type"), "notifications", ["type"], unique=False)
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_type"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_prediction_id"), table_name="notifications")
    op.drop_table("notifications")

    op.drop_index(op.f("ix_recommendations_prediction_id"), table_name="recommendations")
    op.drop_table("recommendations")

    op.drop_table("clinical_inputs_pcos")
    op.drop_table("clinical_inputs_diabetes")

    op.drop_index(op.f("ix_predictions_risk_level"), table_name="predictions")
    op.drop_index(op.f("ix_predictions_patient_id"), table_name="predictions")
    op.drop_index(op.f("ix_predictions_doctor_id"), table_name="predictions")
    op.drop_index(op.f("ix_predictions_disease_type"), table_name="predictions")
    op.drop_table("predictions")
