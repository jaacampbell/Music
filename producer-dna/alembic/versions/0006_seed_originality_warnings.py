"""Add unique constraint and seed originality warnings for batch001 producers."""
from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None

SEEDS_DIR = Path(__file__).resolve().parent.parent.parent / "seeds" / "batch001"


def _id_map(conn) -> dict[str, int]:
    rows = conn.execute(sa.text("SELECT pdna_id, id FROM producers")).fetchall()
    return {r[0]: r[1] for r in rows}


def upgrade() -> None:
    import yaml

    conn = op.get_bind()

    # Add unique constraint so ON CONFLICT works idempotently
    conn.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'ow_unique'
            ) THEN
                ALTER TABLE originality_warnings
                ADD CONSTRAINT ow_unique UNIQUE (producer_id, warning_type);
            END IF;
        END $$
    """))

    id_map = _id_map(conn)

    with open(SEEDS_DIR / "originality_warnings.yaml") as f:
        data = yaml.safe_load(f)

    for w in data["warnings"]:
        pid = id_map.get(w["pdna_id"])
        if pid is None:
            continue
        conn.execute(
            sa.text(
                "INSERT INTO originality_warnings "
                "(producer_id, warning_type, description, severity) "
                "VALUES (:pid, :wtype, :desc, :sev) "
                "ON CONFLICT ON CONSTRAINT ow_unique DO NOTHING"
            ),
            {
                "pid": pid,
                "wtype": w["warning_type"],
                "desc": w["description"],
                "sev": w.get("severity", "moderate"),
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    subq = "SELECT id FROM producers WHERE pdna_id LIKE 'PDNA-0000%'"
    conn.execute(
        sa.text(f"DELETE FROM originality_warnings WHERE producer_id IN ({subq})")
    )
    conn.execute(sa.text(
        "ALTER TABLE originality_warnings DROP CONSTRAINT IF EXISTS ow_unique"
    ))
