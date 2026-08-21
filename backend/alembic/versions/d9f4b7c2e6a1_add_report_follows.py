"""add report follows

Revision ID: d9f4b7c2e6a1
Revises: a4e7f2c1d6b8
"""

from alembic import op
import sqlalchemy as sa


revision = "d9f4b7c2e6a1"
down_revision = "a4e7f2c1d6b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "report_follows",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("report_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("report_follows")
