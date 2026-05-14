"""Add chat behavior settings to users table

Revision ID: 0004_chat_behavior_settings
Revises: 0003_security_alerts_users
Create Date: 2026-05-13
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "0004_chat_behavior_settings"
down_revision: Union[str, None] = "0003_security_alerts_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    columns = inspect(bind).get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def upgrade() -> None:
    if not _column_exists("users", "model"):
        op.add_column("users", sa.Column("model", sa.String(), nullable=False, server_default="llama-3.1-8b-instant"))
    
    if not _column_exists("users", "temperature"):
        op.add_column("users", sa.Column("temperature", sa.Float(), nullable=False, server_default="0.3"))
    
    if not _column_exists("users", "top_k"):
        op.add_column("users", sa.Column("top_k", sa.Integer(), nullable=False, server_default="5"))
    
    if not _column_exists("users", "chunk_size"):
        op.add_column("users", sa.Column("chunk_size", sa.Integer(), nullable=False, server_default="800"))


def downgrade() -> None:
    if _column_exists("users", "model"):
        op.drop_column("users", "model")
    
    if _column_exists("users", "temperature"):
        op.drop_column("users", "temperature")
    
    if _column_exists("users", "top_k"):
        op.drop_column("users", "top_k")
    
    if _column_exists("users", "chunk_size"):
        op.drop_column("users", "chunk_size")
