"""Integration tests for creative iterations seed and CLI."""
import pytest
from click.testing import CliRunner
from sqlalchemy import create_engine, text

from pdna.cli.main import cli


@pytest.fixture
def runner():
    return CliRunner()


class TestCreativeIterations:
    def test_iteration_count_at_least_100(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM creative_iterations")).scalar()
        assert count >= 100, f"Expected >= 100 creative iterations, got {count}"

    def test_all_producers_have_iterations(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            total_producers = conn.execute(
                text("SELECT COUNT(*) FROM producers")
            ).scalar()
            producers_with_iterations = conn.execute(
                text("SELECT COUNT(DISTINCT producer_id) FROM creative_iterations")
            ).scalar()
        assert producers_with_iterations == total_producers, (
            f"Only {producers_with_iterations}/{total_producers} producers have iterations"
        )

    def test_all_contexts_covered(self, db_url):
        expected_contexts = {
            "beat_production", "mix_reference", "sound_design",
            "artist_session", "collaboration",
        }
        engine = create_engine(db_url)
        with engine.connect() as conn:
            rows = conn.execute(
                text("SELECT DISTINCT target_context FROM creative_iterations WHERE target_context IS NOT NULL")
            ).fetchall()
        actual_contexts = {r[0] for r in rows}
        missing = expected_contexts - actual_contexts
        assert not missing, f"Missing target_context values: {missing}"

    def test_iterate_cli(self, runner, db_url):
        result = runner.invoke(cli, ["--db-url", db_url, "dna", "iterate", "PDNA-000013"])
        assert result.exit_code == 0, result.output
        assert "PDNA-000013" in result.output or "Dilla" in result.output or "session" in result.output.lower()

    def test_iterate_cli_context_filter(self, runner, db_url):
        result = runner.invoke(
            cli, ["--db-url", db_url, "dna", "iterate", "PDNA-000013", "--context", "beat_production"]
        )
        assert result.exit_code == 0, result.output
        assert "mix_reference" not in result.output
