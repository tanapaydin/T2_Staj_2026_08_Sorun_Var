"""add report location fields

Revision ID: e6b8c4d1f2a7
Revises: d9f4b7c2e6a1
"""

from alembic import op
import sqlalchemy as sa


revision = "e6b8c4d1f2a7"
down_revision = "d9f4b7c2e6a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("reports", sa.Column("city", sa.String(), nullable=True))
    op.add_column("reports", sa.Column("municipality", sa.String(), nullable=True))
    op.add_column("reports", sa.Column("district", sa.String(), nullable=True))
    op.add_column("reports", sa.Column("neighborhood", sa.String(), nullable=True))
    op.add_column("reports", sa.Column("address", sa.Text(), nullable=True))
    op.add_column(
        "reports",
        sa.Column("follower_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("reports", "follower_count")
    op.drop_column("reports", "address")
    op.drop_column("reports", "neighborhood")
    op.drop_column("reports", "district")
    op.drop_column("reports", "municipality")
    op.drop_column("reports", "city")
