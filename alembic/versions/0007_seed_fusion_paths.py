"""Seed fusion paths for batch001 producers."""
from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None

SEEDS_DIR = Path(__file__).resolve().parent.parent.parent / "seeds" / "batch001"


def _id_map(conn) -> dict[str, int]:
    rows = conn.execute(sa.text("SELECT pdna_id, id FROM producers")).fetchall()
    return {r[0]: r[1] for r in rows}


def upgrade() -> None:
    import yaml

    conn = op.get_bind()

    # Unique constraint on (primary_producer_id, secondary_element) for idempotent upserts
    conn.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fp_unique'
            ) THEN
                ALTER TABLE fusion_paths
                ADD CONSTRAINT fp_unique UNIQUE (primary_producer_id, secondary_element);
            END IF;
        END $$
    """))

    id_map = _id_map(conn)

    with open(SEEDS_DIR / "fusion_paths.yaml") as f:
        data = yaml.safe_load(f)

    for fp in data["fusions"]:
        primary_id = id_map.get(fp["primary_pdna"])
        if primary_id is None:
            continue
        secondary_id = id_map.get(fp.get("secondary_pdna")) if fp.get("secondary_pdna") else None

        conn.execute(
            sa.text(
                "INSERT INTO fusion_paths "
                "(primary_producer_id, secondary_producer_id, secondary_element, "
                "fusion_description, creative_prompt) "
                "VALUES (:primary_id, :secondary_id, :secondary_element, "
                ":fusion_description, :creative_prompt) "
                "ON CONFLICT ON CONSTRAINT fp_unique DO NOTHING"
            ),
            {
                "primary_id": primary_id,
                "secondary_id": secondary_id,
                "secondary_element": fp["secondary_element"],
                "fusion_description": fp["fusion_description"],
                "creative_prompt": fp.get("creative_prompt"),
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    subq = "SELECT id FROM producers WHERE pdna_id LIKE 'PDNA-0000%'"
    conn.execute(
        sa.text(f"DELETE FROM fusion_paths WHERE primary_producer_id IN ({subq})")
    )
    conn.execute(sa.text(
        "ALTER TABLE fusion_paths DROP CONSTRAINT IF EXISTS fp_unique"
    ))
