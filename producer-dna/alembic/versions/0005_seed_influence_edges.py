"""Seed influence edges for batch001 producers."""
from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
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

    with open(SEEDS_DIR / "influence_edges.yaml") as f:
        data = yaml.safe_load(f)

    for edge in data["edges"]:
        from_id = id_map.get(edge["from_pdna"])
        to_id = id_map.get(edge["to_pdna"])
        if from_id is None or to_id is None:
            continue
        conn.execute(
            sa.text(
                "INSERT INTO influence_edges "
                "(from_producer_id, to_producer_id, direction, strength, confidence, notes) "
                "VALUES (:from_id, :to_id, :direction, :strength, :confidence, :notes) "
                "ON CONFLICT ON CONSTRAINT influence_unique DO NOTHING"
            ),
            {
                "from_id": from_id,
                "to_id": to_id,
                "direction": edge["direction"],
                "strength": edge.get("strength"),
                "confidence": edge.get("confidence", "D"),
                "notes": edge.get("notes"),
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    subq = "SELECT id FROM producers WHERE pdna_id LIKE 'PDNA-0000%'"
    conn.execute(
        sa.text(
            f"DELETE FROM influence_edges "
            f"WHERE from_producer_id IN ({subq}) "
            f"OR to_producer_id IN ({subq})"
        )
    )
