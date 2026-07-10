"""Seed creative iterations for batch001 producers."""
from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision = "0009"
down_revision = "0008"
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

    with open(SEEDS_DIR / "creative_iterations.yaml") as f:
        data = yaml.safe_load(f)

    for entry in data["iterations"]:
        producer_id = id_map.get(entry["pdna_id"])
        if producer_id is None:
            continue

        conn.execute(
            sa.text(
                "INSERT INTO creative_iterations "
                "(producer_id, iteration_number, title, prompt_text, target_context) "
                "VALUES (:producer_id, :iteration_number, :title, :prompt_text, :target_context) "
                "ON CONFLICT ON CONSTRAINT creative_iter_unique DO NOTHING"
            ),
            {
                "producer_id": producer_id,
                "iteration_number": entry["iteration_number"],
                "title": entry.get("title"),
                "prompt_text": entry["prompt_text"],
                "target_context": entry.get("target_context"),
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    subq = "SELECT id FROM producers WHERE pdna_id LIKE 'PDNA-0000%'"
    conn.execute(
        sa.text(f"DELETE FROM creative_iterations WHERE producer_id IN ({subq})")
    )
