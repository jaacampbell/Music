"""Seed collaborator edges for batch001 producers."""
from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None

SEEDS_DIR = Path(__file__).resolve().parent.parent.parent / "seeds" / "batch001"


def _id_map(conn) -> dict[str, int]:
    rows = conn.execute(sa.text("SELECT pdna_id, id FROM producers")).fetchall()
    return {r[0]: r[1] for r in rows}


def upgrade() -> None:
    import yaml

    conn = op.get_bind()

    # Two partial unique indexes (no UniqueConstraint exists on this table)
    conn.execute(sa.text("""
        CREATE UNIQUE INDEX IF NOT EXISTS ce_prod_unique
        ON collaborator_edges (from_producer_id, to_producer_id, edge_type)
        WHERE to_producer_id IS NOT NULL
    """))

    conn.execute(sa.text("""
        CREATE UNIQUE INDEX IF NOT EXISTS ce_entity_unique
        ON collaborator_edges (from_producer_id, to_entity_name, edge_type)
        WHERE to_entity_name IS NOT NULL AND to_producer_id IS NULL
    """))

    id_map = _id_map(conn)

    with open(SEEDS_DIR / "collaborator_edges.yaml") as f:
        data = yaml.safe_load(f)

    for entry in data["edges"]:
        from_id = id_map.get(entry["from_pdna"])
        if from_id is None:
            continue

        to_pdna = entry.get("to_pdna")

        if to_pdna:
            to_id = id_map.get(to_pdna)
            if to_id is None:
                continue
            conn.execute(
                sa.text(
                    "INSERT INTO collaborator_edges "
                    "(from_producer_id, to_entity_type, to_producer_id, "
                    "edge_type, strength, work_count, notes) "
                    "VALUES (:from_id, :to_entity_type, :to_id, "
                    ":edge_type, :strength, :work_count, :notes) "
                    "ON CONFLICT (from_producer_id, to_producer_id, edge_type) "
                    "WHERE to_producer_id IS NOT NULL DO NOTHING"
                ),
                {
                    "from_id": from_id,
                    "to_entity_type": entry["to_entity_type"],
                    "to_id": to_id,
                    "edge_type": entry["edge_type"],
                    "strength": entry.get("strength"),
                    "work_count": entry.get("work_count", 0),
                    "notes": entry.get("notes"),
                },
            )
        else:
            conn.execute(
                sa.text(
                    "INSERT INTO collaborator_edges "
                    "(from_producer_id, to_entity_type, to_entity_name, "
                    "edge_type, strength, work_count, notes) "
                    "VALUES (:from_id, :to_entity_type, :to_entity_name, "
                    ":edge_type, :strength, :work_count, :notes) "
                    "ON CONFLICT (from_producer_id, to_entity_name, edge_type) "
                    "WHERE to_entity_name IS NOT NULL AND to_producer_id IS NULL DO NOTHING"
                ),
                {
                    "from_id": from_id,
                    "to_entity_type": entry["to_entity_type"],
                    "to_entity_name": entry.get("to_entity_name"),
                    "edge_type": entry["edge_type"],
                    "strength": entry.get("strength"),
                    "work_count": entry.get("work_count", 0),
                    "notes": entry.get("notes"),
                },
            )


def downgrade() -> None:
    conn = op.get_bind()
    subq = "SELECT id FROM producers WHERE pdna_id LIKE 'PDNA-0000%'"
    conn.execute(
        sa.text(f"DELETE FROM collaborator_edges WHERE from_producer_id IN ({subq})")
    )
    conn.execute(sa.text("DROP INDEX IF EXISTS ce_prod_unique"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ce_entity_unique"))
