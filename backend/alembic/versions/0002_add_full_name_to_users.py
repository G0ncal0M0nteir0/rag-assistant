"""Add full_name to users table

Revision ID: 0002_add_full_name_to_users
Revises: 0001_initial_schema
Create Date: 2026-05-12
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "0002_add_full_name_to_users"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    columns = inspect(bind).get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def upgrade() -> None:
    if not _column_exists("users", "full_name"):
        op.add_column("users", sa.Column("full_name", sa.String(), nullable=True))


def downgrade() -> None:
    if _column_exists("users", "full_name"):
        op.drop_column("users", "full_name")
