"""create doctors table

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-02 00:06:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "doctors",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("specialization", sa.String(length=120), nullable=False),
        sa.Column("license_number", sa.String(length=120), nullable=False),
        sa.Column("hospital", sa.String(length=160), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_doctors_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_doctors")),
        sa.UniqueConstraint("license_number", name=op.f("uq_doctors_license_number")),
        sa.UniqueConstraint("user_id", name=op.f("uq_doctors_user_id")),
    )
    op.create_index(op.f("ix_doctors_license_number"), "doctors", ["license_number"], unique=False)
    op.create_index(op.f("ix_doctors_user_id"), "doctors", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_doctors_user_id"), table_name="doctors")
    op.drop_index(op.f("ix_doctors_license_number"), table_name="doctors")
    op.drop_table("doctors")
