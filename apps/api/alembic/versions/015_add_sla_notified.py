"""Add SLA notification fields

Revision ID: 015
Revises: 014
Create Date: 2026-02-21 12:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '015'
down_revision: Union[str, None] = '014'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('jobs', sa.Column('sla_warning_notified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('jobs', sa.Column('sla_breach_notified_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('jobs', 'sla_breach_notified_at')
    op.drop_column('jobs', 'sla_warning_notified_at')
