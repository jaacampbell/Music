"""Integration tests against the test database (seeded via migration 0003)."""
import pytest
from sqlalchemy import create_engine, text


@pytest.mark.usefixtures("test_db_url")
class TestProducerQueries:
    def test_batch001_count(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM producers")).scalar()
        assert count == 50, f"Expected 50 producers, got {count}"

    def test_j_dilla_exists(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT name, country FROM producers WHERE pdna_id = 'PDNA-000013'")
            ).fetchone()
        assert row is not None
        assert row[0] == "J Dilla"
        assert row[1] == "US"

    def test_j_dilla_aliases(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            aliases = conn.execute(
                text(
                    "SELECT alias FROM producer_aliases pa "
                    "JOIN producers p ON pa.producer_id = p.id "
                    "WHERE p.pdna_id = 'PDNA-000013' ORDER BY alias"
                )
            ).fetchall()
        alias_names = [a[0] for a in aliases]
        assert "Jay Dee" in alias_names
        assert "Dilla" in alias_names

    def test_fts_search_aphex_twin(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT pdna_id FROM producers "
                    "WHERE search_vector @@ plainto_tsquery('english', 'Aphex Twin')"
                )
            ).fetchone()
        assert row is not None
        assert row[0] == "PDNA-000031"

    def test_country_filter_jamaica(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            rows = conn.execute(
                text("SELECT pdna_id FROM producers WHERE country = 'JM' ORDER BY pdna_id")
            ).fetchall()
        pdna_ids = [r[0] for r in rows]
        assert "PDNA-000005" in pdna_ids  # Lee "Scratch" Perry
        assert "PDNA-000006" in pdna_ids  # King Tubby

    def test_scene_filter_amapiano(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            rows = conn.execute(
                text("SELECT pdna_id FROM producers WHERE primary_scenes ? 'amapiano'")
            ).fetchall()
        assert len(rows) == 1
        assert rows[0][0] == "PDNA-000049"

    def test_era_taxonomy_seeded(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM eras")).scalar()
        assert count >= 8

    def test_genre_taxonomy_seeded(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM genres")).scalar()
        assert count >= 50

    def test_roles_taxonomy_seeded(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM producer_roles")).scalar()
        assert count >= 10

    def test_works_seeded(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM works")).scalar()
        assert count >= 5

    def test_credits_link_to_producers(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT p.name, w.title FROM credits c "
                    "JOIN producers p ON c.producer_id = p.id "
                    "JOIN works w ON c.work_id = w.id "
                    "WHERE p.pdna_id = 'PDNA-000001' LIMIT 1"
                )
            ).fetchone()
        assert row is not None
        assert row[0] == "George Martin"

    def test_sources_confidence_tiers(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            tiers = conn.execute(
                text("SELECT DISTINCT reliability FROM sources ORDER BY reliability")
            ).fetchall()
        tier_vals = {r[0] for r in tiers}
        assert "A" in tier_vals
        assert "C" in tier_vals
