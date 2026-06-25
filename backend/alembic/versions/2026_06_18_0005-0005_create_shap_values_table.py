"""create shap values table

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-18 00:05:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "shap_values",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("prediction_id", sa.String(length=36), nullable=False),
        sa.Column("feature_name", sa.String(length=100), nullable=False),
        sa.Column("input_value", sa.Float(), nullable=False),
        sa.Column("shap_value", sa.Float(), nullable=False),
        sa.Column("absolute_impact", sa.Float(), nullable=False),
        sa.Column("direction", sa.String(length=30), nullable=False),
        sa.ForeignKeyConstraint(
            ["prediction_id"],
            ["predictions.id"],
            name=op.f("fk_shap_values_prediction_id_predictions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_shap_values")),
    )
    op.create_index(op.f("ix_shap_values_prediction_id"), "shap_values", ["prediction_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_shap_values_prediction_id"), table_name="shap_values")
    op.drop_table("shap_values")
