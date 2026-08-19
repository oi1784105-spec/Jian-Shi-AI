"""add user ai provider configs

Revision ID: d91f3a82c0be
Revises: c6b947f6941f
Create Date: 2026-08-19 10:20:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d91f3a82c0be"
down_revision: Union[str, None] = "c6b947f6941f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_provider_configs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("identifier", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("protocol", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("website_url", sa.String(length=500), nullable=True),
        sa.Column("base_url", sa.String(length=500), nullable=True),
        sa.Column("encrypted_api_key", sa.Text(), nullable=False),
        sa.Column("api_key_hint", sa.String(length=8), nullable=False),
        sa.Column("models", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("default_model", sa.String(length=200), nullable=False),
        sa.Column("api_version", sa.String(length=40), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_validated", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("last_tested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "identifier", name="uq_ai_provider_user_identifier"),
    )
    op.create_index(op.f("ix_ai_provider_configs_id"), "ai_provider_configs", ["id"], unique=False)
    op.create_index(op.f("ix_ai_provider_configs_user_id"), "ai_provider_configs", ["user_id"], unique=False)
    op.add_column("interviews", sa.Column("ai_provider_id", sa.Integer(), nullable=True))
    op.add_column("interviews", sa.Column("ai_model", sa.String(length=200), nullable=True))
    op.create_foreign_key(
        "fk_interviews_ai_provider_id",
        "interviews",
        "ai_provider_configs",
        ["ai_provider_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_interviews_ai_provider_id", "interviews", type_="foreignkey")
    op.drop_column("interviews", "ai_model")
    op.drop_column("interviews", "ai_provider_id")
    op.drop_index(op.f("ix_ai_provider_configs_user_id"), table_name="ai_provider_configs")
    op.drop_index(op.f("ix_ai_provider_configs_id"), table_name="ai_provider_configs")
    op.drop_table("ai_provider_configs")
