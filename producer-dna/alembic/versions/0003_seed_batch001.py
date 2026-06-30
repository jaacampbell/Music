"""Seed Batch 001: 50 founding producers and their stub works/sources

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-29
"""
from pathlib import Path
import yaml
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

SEEDS_DIR = Path(__file__).resolve().parent.parent.parent / "seeds" / "batch001"


def _load(filename: str) -> dict:
    with open(SEEDS_DIR / filename) as f:
        return yaml.safe_load(f)


def upgrade() -> None:
    conn = op.get_bind()
    data = _load("metadata.yaml")
    producers = data["producers"]

    # Build ID lookup after inserts
    pdna_to_db_id: dict[str, int] = {}

    for i, p in enumerate(producers, start=1):
        official_links = p.get("official_links", [])
        primary_scenes = p.get("primary_scenes", [])
        import json

        result = conn.execute(
            sa.text(
                "INSERT INTO producers (pdna_id, name, real_name, country, city, region, "
                "active_from, active_to, is_active, official_links, primary_scenes, "
                "musicbrainz_id, wikidata_id, discogs_id, notes) "
                "VALUES (:pdna_id, :name, :real_name, :country, :city, :region, "
                ":active_from, :active_to, :is_active, CAST(:official_links AS JSONB), "
                "CAST(:primary_scenes AS JSONB), "
                ":musicbrainz_id, :wikidata_id, :discogs_id, :notes) "
                "ON CONFLICT (pdna_id) DO UPDATE SET name=EXCLUDED.name "
                "RETURNING id"
            ),
            {
                "pdna_id": p["pdna_id"],
                "name": p["name"],
                "real_name": p.get("real_name"),
                "country": p.get("country"),
                "city": p.get("city"),
                "region": p.get("region"),
                "active_from": p.get("active_from"),
                "active_to": p.get("active_to"),
                "is_active": p.get("is_active", True),
                "official_links": json.dumps(official_links),
                "primary_scenes": json.dumps(primary_scenes),
                "musicbrainz_id": p.get("musicbrainz_id"),
                "wikidata_id": p.get("wikidata_id"),
                "discogs_id": p.get("discogs_id"),
                "notes": p.get("notes"),
            },
        )
        row = result.fetchone()
        db_id = row[0]
        pdna_to_db_id[p["pdna_id"]] = db_id

        # Insert aliases
        for alias in p.get("aliases", []):
            conn.execute(
                sa.text(
                    "INSERT INTO producer_aliases (producer_id, alias, alias_type, notes) "
                    "VALUES (:producer_id, :alias, :alias_type, :notes) "
                    "ON CONFLICT (producer_id, alias) DO NOTHING"
                ),
                {
                    "producer_id": db_id,
                    "alias": alias["alias"],
                    "alias_type": alias.get("alias_type"),
                    "notes": alias.get("notes"),
                },
            )

    # Seed stub works
    works_data = _load("works_stub.yaml")
    for entry in works_data["works"]:
        pdna_id = entry["pdna_id"]
        producer_db_id = pdna_to_db_id.get(pdna_id)
        if not producer_db_id:
            continue
        for w in entry["works"]:
            result = conn.execute(
                sa.text(
                    "INSERT INTO works (title, work_type, release_year, artist, label) "
                    "VALUES (:title, :work_type, :release_year, :artist, :label) "
                    "RETURNING id"
                ),
                {
                    "title": w["title"],
                    "work_type": w["work_type"],
                    "release_year": w.get("release_year"),
                    "artist": w.get("artist"),
                    "label": w.get("label"),
                },
            )
            work_db_id = result.fetchone()[0]
            conn.execute(
                sa.text(
                    "INSERT INTO credits (producer_id, work_id, role, confidence) "
                    "VALUES (:producer_id, :work_id, :role, :confidence) "
                    "ON CONFLICT (producer_id, work_id, role) DO NOTHING"
                ),
                {
                    "producer_id": producer_db_id,
                    "work_id": work_db_id,
                    "role": w.get("role", "producer"),
                    "confidence": w.get("confidence", "Unknown"),
                },
            )

    # Seed stub sources
    sources_data = _load("sources_stub.yaml")
    for entry in sources_data["sources"]:
        pdna_id = entry["pdna_id"]
        producer_db_id = pdna_to_db_id.get(pdna_id)
        if not producer_db_id:
            continue
        for s in entry["sources"]:
            conn.execute(
                sa.text(
                    "INSERT INTO sources (producer_id, source_url, source_type, reliability, "
                    "claim_supported, quote_summary, citation_status) "
                    "VALUES (:producer_id, :source_url, :source_type, :reliability, "
                    ":claim_supported, :quote_summary, :citation_status)"
                ),
                {
                    "producer_id": producer_db_id,
                    "source_url": s.get("source_url"),
                    "source_type": s.get("source_type"),
                    "reliability": s.get("reliability", "Unknown"),
                    "claim_supported": s["claim_supported"],
                    "quote_summary": s.get("quote_summary"),
                    "citation_status": s.get("citation_status", "unverified"),
                },
            )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "DELETE FROM producers WHERE pdna_id LIKE 'PDNA-0000%'"
    ))
