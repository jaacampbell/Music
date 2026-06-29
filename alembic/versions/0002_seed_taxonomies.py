"""Seed taxonomy tables: eras, genres, producer roles

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-29
"""
from pathlib import Path
import yaml
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

SEEDS_DIR = Path(__file__).resolve().parent.parent.parent / "seeds" / "taxonomies"


def _load(filename: str) -> dict:
    with open(SEEDS_DIR / filename) as f:
        return yaml.safe_load(f)


def upgrade() -> None:
    conn = op.get_bind()
    eras_data = _load("eras.yaml")["eras"]
    conn.execute(
        sa.text(
            "INSERT INTO eras (code, label, year_start, year_end, sort_order) "
            "VALUES (:code, :label, :year_start, :year_end, :sort_order) "
            "ON CONFLICT (code) DO NOTHING"
        ),
        eras_data,
    )

    roles_data = _load("roles.yaml")["roles"]
    conn.execute(
        sa.text(
            "INSERT INTO producer_roles (code, label, tier) "
            "VALUES (:code, :label, :tier) "
            "ON CONFLICT (code) DO NOTHING"
        ),
        roles_data,
    )

    genres_raw = _load("genres.yaml")["genres"]

    # First pass: insert genres without parent_id
    for g in genres_raw:
        conn.execute(
            sa.text(
                "INSERT INTO genres (code, label, region) "
                "VALUES (:code, :label, :region) "
                "ON CONFLICT (code) DO NOTHING"
            ),
            {"code": g["code"], "label": g["label"], "region": g.get("region")},
        )

    # Second pass: set parent_id
    for g in genres_raw:
        parent_code = g.get("parent")
        if parent_code:
            conn.execute(
                sa.text(
                    "UPDATE genres SET parent_id = (SELECT id FROM genres WHERE code = :parent) "
                    "WHERE code = :code"
                ),
                {"parent": parent_code, "code": g["code"]},
            )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM genres"))
    conn.execute(sa.text("DELETE FROM producer_roles"))
    conn.execute(sa.text("DELETE FROM eras"))
