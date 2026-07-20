"""
added two new columns into processing status model and also added step enums

Revision ID: 92b9270a6ca5
Revises: e8d4c8a40292
Create Date: 2026-07-10 01:08:55.092322

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '92b9270a6ca5'
down_revision: Union[str, Sequence[str], None] = 'e8d4c8a40292'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Create PostgreSQL enum type first
    processing_step_enum = sa.Enum(
        'DOCUMENT_SAVED',
        'CHUNKING',
        'EMBEDDING',
        'VECTOR_STORE',
        'COMPLETED',
        name='processingstepenum'
    )

    processing_step_enum.create(
        op.get_bind(),
        checkfirst=True
    )


    # Add current_step column
    op.add_column(
        'processing_status',
        sa.Column(
            'current_step',
            processing_step_enum,
            nullable=False,
            server_default='DOCUMENT_SAVED'
        )
    )


    # Add progress column
    op.add_column(
        'processing_status',
        sa.Column(
            'progress',
            sa.Integer(),
            nullable=False,
            server_default='0'
        )
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        'processing_status',
        'progress'
    )

    op.drop_column(
        'processing_status',
        'current_step'
    )


    processing_step_enum = sa.Enum(
        'DOCUMENT_SAVED',
        'CHUNKING',
        'EMBEDDING',
        'VECTOR_STORE',
        'COMPLETED',
        name='processingstepenum'
    )

    processing_step_enum.drop(
        op.get_bind(),
        checkfirst=True
    )