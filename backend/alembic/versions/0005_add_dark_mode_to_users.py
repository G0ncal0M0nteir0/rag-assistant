"""Add dark_mode setting to users table

Revision ID: 0005_dark_mode_users
Revises: 0004_chat_behavior_settings
Create Date: 2026-05-14
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "0005_dark_mode_users"
down_revision: Union[str, None] = "0004_chat_behavior_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    columns = inspect(bind).get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def upgrade() -> None:
    if not _column_exists("users", "dark_mode"):
        op.add_column("users", sa.Column("dark_mode", sa.Boolean(), nullable=False, server_default="true"))


def downgrade() -> None:
    if _column_exists("users", "dark_mode"):
        op.drop_column("users", "dark_mode")
