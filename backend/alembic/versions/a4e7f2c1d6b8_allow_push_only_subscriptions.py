"""allow push subscriptions without location

Revision ID: a4e7f2c1d6b8
Revises: f1a8c3d9e2b4
"""

from alembic import op


revision = "a4e7f2c1d6b8"
down_revision = "f1a8c3d9e2b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("push_subscriptions", "latitude", nullable=True)
    op.alter_column("push_subscriptions", "longitude", nullable=True)


def downgrade() -> None:
    op.alter_column("push_subscriptions", "latitude", nullable=False)
    op.alter_column("push_subscriptions", "longitude", nullable=False)
