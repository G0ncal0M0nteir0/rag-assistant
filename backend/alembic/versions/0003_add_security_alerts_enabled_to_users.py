"""Add security_alerts_enabled to users table

Revision ID: 0003_security_alerts_users
Revises: 0002_add_full_name_to_users
Create Date: 2026-05-13
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "0003_security_alerts_users"
down_revision: Union[str, None] = "0002_add_full_name_to_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    columns = inspect(bind).get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def upgrade() -> None:
    if not _column_exists("users", "security_alerts_enabled"):
        op.add_column("users", sa.Column("security_alerts_enabled", sa.Boolean(), nullable=False, server_default="true"))


def downgrade() -> None:
    if _column_exists("users", "security_alerts_enabled"):
        op.drop_column("users", "security_alerts_enabled")
