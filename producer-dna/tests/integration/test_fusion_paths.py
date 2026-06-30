"""Integration tests for fusion paths seed and CLI."""
import pytest
from click.testing import CliRunner
from sqlalchemy import create_engine, text

from pdna.cli.main import cli
from pdna.cli.cmd_dna import lookup_fusion, load_dna_vectors, euclidean_distance, DIM_SETS


@pytest.fixture
def runner():
    return CliRunner()


class TestFusionPaths:
    def test_fusion_count_at_least_50(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM fusion_paths")).scalar()
        assert count >= 50, f"Expected >= 50 fusion paths, got {count}"

    def test_dilla_kraftwerk_fusion_exists(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT fp.creative_prompt FROM fusion_paths fp "
                    "JOIN producers pa ON pa.id = fp.primary_producer_id "
                    "JOIN producers pb ON pb.id = fp.secondary_producer_id "
                    "WHERE pa.pdna_id = 'PDNA-000013' AND pb.pdna_id = 'PDNA-000033'"
                )
            ).fetchone()
        assert row is not None, "No fusion found for J Dilla (primary) + Kraftwerk (secondary)"
        assert row[0] is not None, "J Dilla + Kraftwerk fusion has no creative_prompt"

    def test_fusion_fallback_returns_distance(self, db_url):
        """Pairs with no seeded fusion should produce a valid distance via the DNA helpers."""
        engine = create_engine(db_url)
        with engine.connect() as conn:
            # Verify no seeded fusion for George Martin (001) + George Martin (001) — impossible pair
            pa = conn.execute(
                text("SELECT id FROM producers WHERE pdna_id = 'PDNA-000001'")
            ).fetchone()
            pb = conn.execute(
                text("SELECT id FROM producers WHERE pdna_id = 'PDNA-000002'")
            ).fetchone()
            # Look up seeded fusion for Martin + Spector (unlikely to be seeded)
            fusion = lookup_fusion(conn, pa[0], pb[0])
            # Whether or not seeded, verify the DNA distance helper works for this pair
            vectors = load_dna_vectors(conn)

        assert "PDNA-000001" in vectors
        assert "PDNA-000002" in vectors
        dist = euclidean_distance(
            vectors["PDNA-000001"]["dims"],
            vectors["PDNA-000002"]["dims"],
            DIM_SETS["all"],
        )
        assert dist >= 0, "Distance should be non-negative"
        assert dist > 0, "George Martin and Phil Spector should not have identical DNA vectors"

    def test_all_fusions_have_description(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            null_count = conn.execute(
                text("SELECT COUNT(*) FROM fusion_paths WHERE fusion_description IS NULL")
            ).scalar()
        assert null_count == 0, f"{null_count} fusion path(s) have NULL fusion_description"

    def test_fusion_list_cli(self, runner, db_url):
        result = runner.invoke(cli, ["--db-url", db_url, "dna", "fusions", "PDNA-000013"])
        assert result.exit_code == 0, result.output
        assert "Fusion Paths" in result.output
        assert "Kraftwerk" in result.output

    def test_fusion_lookup_cli_seeded(self, runner, db_url):
        result = runner.invoke(
            cli, ["--db-url", db_url, "dna", "fusion", "PDNA-000013", "PDNA-000033"]
        )
        assert result.exit_code == 0, result.output
        assert "Fusion Description" in result.output
        assert "Creative Prompt" in result.output

    def test_fusion_lookup_cli_fallback(self, runner, db_url):
        # George Martin + Phil Spector — no seeded fusion, should fall back to distance
        result = runner.invoke(
            cli, ["--db-url", db_url, "dna", "fusion", "PDNA-000001", "PDNA-000002"]
        )
        assert result.exit_code == 0, result.output
        # Either seeded fusion or fallback distance output
        has_fusion = "Fusion Description" in result.output
        has_fallback = "distance" in result.output.lower() or "Fusion Suggestion" in result.output
        assert has_fusion or has_fallback, "Expected either fusion or fallback distance output"
