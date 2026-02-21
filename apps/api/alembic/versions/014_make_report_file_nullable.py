"""Make report file fields nullable

Revision ID: 014
Revises: 013
Create Date: 2026-02-21 12:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '014'
down_revision: Union[str, None] = '013'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('reports', 'file_path', existing_type=sa.String(length=500), nullable=True)
    op.alter_column('reports', 'file_size_bytes', existing_type=sa.BigInteger(), nullable=True)


def downgrade() -> None:
    op.alter_column('reports', 'file_size_bytes', existing_type=sa.BigInteger(), nullable=False)
    op.alter_column('reports', 'file_path', existing_type=sa.String(length=500), nullable=False)
