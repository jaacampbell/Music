"""Seed inspired directions for batch001 producers."""
from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None

SEEDS_DIR = Path(__file__).resolve().parent.parent.parent / "seeds" / "batch001"


def _id_map(conn) -> dict[str, int]:
    rows = conn.execute(sa.text("SELECT pdna_id, id FROM producers")).fetchall()
    return {r[0]: r[1] for r in rows}


def upgrade() -> None:
    import yaml

    conn = op.get_bind()

    conn.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'id_unique'
            ) THEN
                ALTER TABLE inspired_directions
                ADD CONSTRAINT id_unique UNIQUE (producer_id, title);
            END IF;
        END $$
    """))

    id_map = _id_map(conn)

    with open(SEEDS_DIR / "inspired_directions.yaml") as f:
        data = yaml.safe_load(f)

    for entry in data["directions"]:
        producer_id = id_map.get(entry["pdna_id"])
        if producer_id is None:
            continue

        conn.execute(
            sa.text(
                "INSERT INTO inspired_directions "
                "(producer_id, title, direction_text, direction_type, sort_order) "
                "VALUES (:producer_id, :title, :direction_text, :direction_type, :sort_order) "
                "ON CONFLICT ON CONSTRAINT id_unique DO NOTHING"
            ),
            {
                "producer_id": producer_id,
                "title": entry["title"],
                "direction_text": entry["direction_text"],
                "direction_type": entry.get("direction_type"),
                "sort_order": entry.get("sort_order"),
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    subq = "SELECT id FROM producers WHERE pdna_id LIKE 'PDNA-0000%'"
    conn.execute(
        sa.text(f"DELETE FROM inspired_directions WHERE producer_id IN ({subq})")
    )
    conn.execute(sa.text(
        "ALTER TABLE inspired_directions DROP CONSTRAINT IF EXISTS id_unique"
    ))
