"""Seed gear claims for batch001 producers."""
from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None

SEEDS_DIR = Path(__file__).resolve().parent.parent.parent / "seeds" / "batch001"


def _id_map(conn) -> dict[str, int]:
    rows = conn.execute(sa.text("SELECT pdna_id, id FROM producers")).fetchall()
    return {r[0]: r[1] for r in rows}


def upgrade() -> None:
    import yaml

    conn = op.get_bind()
    id_map = _id_map(conn)

    with open(SEEDS_DIR / "gear_claims.yaml") as f:
        data = yaml.safe_load(f)

    for entry in data["gear"]:
        producer_id = id_map.get(entry["pdna_id"])
        if producer_id is None:
            continue
        for claim in entry["claims"]:
            conn.execute(
                sa.text(
                    "INSERT INTO gear_claims "
                    "(producer_id, gear_category, gear_name, gear_era, status, notes) "
                    "VALUES (:producer_id, :gear_category, :gear_name, :gear_era, :status, :notes) "
                    "ON CONFLICT DO NOTHING"
                ),
                {
                    "producer_id": producer_id,
                    "gear_category": claim["gear_category"],
                    "gear_name": claim["gear_name"],
                    "gear_era": claim.get("gear_era"),
                    "status": claim.get("status", "reported"),
                    "notes": claim.get("notes"),
                },
            )


def downgrade() -> None:
    conn = op.get_bind()
    subq = "SELECT id FROM producers WHERE pdna_id LIKE 'PDNA-0000%'"
    conn.execute(
        sa.text(f"DELETE FROM gear_claims WHERE producer_id IN ({subq})")
    )
