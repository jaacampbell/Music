"""Integration tests for influence graph seed (migration 0005)."""
import pytest
from sqlalchemy import create_engine, text


class TestInfluenceGraph:
    def test_influence_edge_count_at_least_50(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM influence_edges")).scalar()
        assert count >= 50, f"Expected at least 50 influence edges, got {count}"

    def test_kraftwerk_influenced_moroder(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT ie.strength FROM influence_edges ie "
                    "JOIN producers fp ON ie.from_producer_id = fp.id "
                    "JOIN producers tp ON ie.to_producer_id = tp.id "
                    "WHERE fp.pdna_id = 'PDNA-000033' AND tp.pdna_id = 'PDNA-000007' "
                    "AND ie.direction = 'influenced'"
                )
            ).fetchone()
        assert row is not None, "Expected Kraftwerk → Moroder influenced edge"
        assert row[0] >= 7, f"Strength should be >= 7, got {row[0]}"

    def test_j_dilla_madlib_edge(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            dilla_to_madlib = conn.execute(
                text(
                    "SELECT ie.strength FROM influence_edges ie "
                    "JOIN producers fp ON ie.from_producer_id = fp.id "
                    "JOIN producers tp ON ie.to_producer_id = tp.id "
                    "WHERE fp.pdna_id = 'PDNA-000013' AND tp.pdna_id = 'PDNA-000024' "
                    "AND ie.direction = 'influenced'"
                )
            ).fetchone()
            madlib_to_dilla = conn.execute(
                text(
                    "SELECT ie.strength FROM influence_edges ie "
                    "JOIN producers fp ON ie.from_producer_id = fp.id "
                    "JOIN producers tp ON ie.to_producer_id = tp.id "
                    "WHERE fp.pdna_id = 'PDNA-000024' AND tp.pdna_id = 'PDNA-000013' "
                    "AND ie.direction = 'influenced'"
                )
            ).fetchone()
        assert dilla_to_madlib is not None, "Missing J Dilla → Madlib influenced edge"
        assert dilla_to_madlib[0] >= 9, f"Dilla→Madlib strength should be >= 9, got {dilla_to_madlib[0]}"
        assert madlib_to_dilla is not None, "Missing Madlib → J Dilla influenced edge (mutual)"

    def test_no_self_loops(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(
                text(
                    "SELECT COUNT(*) FROM influence_edges "
                    "WHERE from_producer_id = to_producer_id"
                )
            ).scalar()
        assert count == 0, f"Found {count} self-loop edges"
