"""Integration tests for originality warnings seed and CLI."""
import pytest
from click.testing import CliRunner
from sqlalchemy import create_engine, text

from pdna.cli.main import cli


@pytest.fixture
def runner():
    return CliRunner()


class TestOriginalityWarnings:
    def test_warning_count_at_least_100(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM originality_warnings")).scalar()
        assert count >= 100, f"Expected >= 100 warnings, got {count}"

    def test_j_dilla_has_major_warning(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(
                text(
                    "SELECT COUNT(*) FROM originality_warnings ow "
                    "JOIN producers p ON p.id = ow.producer_id "
                    "WHERE p.pdna_id = 'PDNA-000013' AND ow.severity = 'major'"
                )
            ).scalar()
        assert count >= 1, "J Dilla should have at least one major originality warning"

    def test_all_producers_have_warnings(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            producers_with_warnings = conn.execute(
                text(
                    "SELECT COUNT(DISTINCT p.id) FROM producers p "
                    "JOIN originality_warnings ow ON ow.producer_id = p.id"
                )
            ).scalar()
            total_producers = conn.execute(
                text("SELECT COUNT(*) FROM producers")
            ).scalar()
        assert producers_with_warnings == total_producers, (
            f"{total_producers - producers_with_warnings} producer(s) have no originality warnings"
        )

    def test_warnings_cli_j_dilla(self, runner, db_url):
        result = runner.invoke(cli, ["--db-url", db_url, "dna", "warnings", "PDNA-000013"])
        assert result.exit_code == 0, result.output
        assert "Originality Warnings" in result.output
        assert "major" in result.output.lower() or "moderate" in result.output.lower()
