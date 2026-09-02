"""add optional user phone number

Revision ID: h4c8a1d2e3f9
Revises: g2b9d5e3f7c1
"""

from alembic import op
import sqlalchemy as sa


revision = "h4c8a1d2e3f9"
down_revision = "g2b9d5e3f7c1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone_number", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "phone_number")
