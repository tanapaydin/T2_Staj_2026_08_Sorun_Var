"""add notification settings to users

Revision ID: c7d2e9f4a1b3
Revises: b845c49d8e7c
"""

from alembic import op
import sqlalchemy as sa


revision = "c7d2e9f4a1b3"
down_revision = "b845c49d8e7c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("push_notifications", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "users",
        sa.Column("location_notifications", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "users",
        sa.Column("email_notifications", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("users", "email_notifications")
    op.drop_column("users", "location_notifications")
    op.drop_column("users", "push_notifications")