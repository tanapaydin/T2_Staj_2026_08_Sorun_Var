"""add verification codes table

Revision ID: g2b9d5e3f7c1
Revises: e6b8c4d1f2a7
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "g2b9d5e3f7c1"
down_revision = "e6b8c4d1f2a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Accounts created before verification existed have already had access, so
    # grandfather them in. New registrations explicitly start unverified.
    op.execute("UPDATE users SET email_verified = true")
    op.alter_column(
        "users",
        "email_verified",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=sa.false(),
    )

    op.create_table(
        "verification_codes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("code_hash", sa.String(), nullable=False),
        sa.Column("purpose", sa.String(), nullable=False),
        sa.Column("consumed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_verification_codes_email_purpose",
        "verification_codes",
        ["email", "purpose"],
    )


def downgrade() -> None:
    op.drop_index("ix_verification_codes_email_purpose", table_name="verification_codes")
    op.drop_table("verification_codes")
    op.alter_column(
        "users",
        "email_verified",
        existing_type=sa.Boolean(),
        nullable=True,
        server_default=None,
    )
