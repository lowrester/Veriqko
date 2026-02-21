"""Add MFA columns to User

Revision ID: 013
Revises: 012
Create Date: 2026-02-21 12:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '013'
down_revision: Union[str, None] = '012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('mfa_secret', sa.String(length=32), nullable=True))
    op.add_column('users', sa.Column('mfa_enabled', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'mfa_enabled')
    op.drop_column('users', 'mfa_secret')
