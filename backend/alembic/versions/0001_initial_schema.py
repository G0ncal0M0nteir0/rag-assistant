"""Initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-08
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    return inspect(bind).has_table(table_name)


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    columns = inspect(bind).get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def upgrade() -> None:
    if not _table_exists("users"):
        op.create_table(
            "users",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("password", sa.String(), nullable=False),
            sa.Column("is_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column("verification_token", sa.String(), nullable=True),
            sa.Column("reset_token", sa.String(), nullable=True),
            sa.Column("reset_token_expires", sa.DateTime(), nullable=True),
            sa.Column("is_admin", sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    else:
        op.alter_column("users", "is_verified", server_default=None)
        op.execute(
            """
            ALTER TABLE users
            ALTER COLUMN is_verified TYPE BOOLEAN
            USING CASE WHEN lower(is_verified::text) = 'true' THEN true ELSE false END
            """
        )
        op.execute("UPDATE users SET is_verified = false WHERE is_verified IS NULL")
        op.alter_column("users", "is_verified", nullable=False, server_default=sa.false())

        op.alter_column("users", "is_admin", server_default=None)
        op.execute(
            """
            ALTER TABLE users
            ALTER COLUMN is_admin TYPE BOOLEAN
            USING CASE WHEN lower(is_admin::text) = 'true' THEN true ELSE false END
            """
        )
        op.execute("UPDATE users SET is_admin = false WHERE is_admin IS NULL")
        op.alter_column("users", "is_admin", nullable=False, server_default=sa.false())

    if not _table_exists("documents"):
        op.create_table(
            "documents",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("filename", sa.String(), nullable=False),
            sa.Column("file_path", sa.String(), nullable=True),
            sa.Column("status", sa.String(), nullable=True),
            sa.Column("chunk_count", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    elif not _column_exists("documents", "file_path"):
        op.add_column("documents", sa.Column("file_path", sa.String(), nullable=True))

    if not _table_exists("conversation_sessions"):
        op.create_table(
            "conversation_sessions",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("title", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if not _table_exists("chat_messages"):
        op.create_table(
            "chat_messages",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("question", sa.Text(), nullable=False),
            sa.Column("answer", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["session_id"], ["conversation_sessions.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if not _table_exists("token_usage"):
        op.create_table(
            "token_usage",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("prompt_tokens", sa.Integer(), nullable=True),
            sa.Column("answer_tokens", sa.Integer(), nullable=True),
            sa.Column("total_tokens", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["session_id"], ["conversation_sessions.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )


def downgrade() -> None:
    op.drop_table("token_usage")
    op.drop_table("chat_messages")
    op.drop_table("conversation_sessions")
    op.drop_table("documents")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
