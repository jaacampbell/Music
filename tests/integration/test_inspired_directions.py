"""Integration tests for inspired directions seed and CLI."""
import pytest
from click.testing import CliRunner
from sqlalchemy import create_engine, text

from pdna.cli.main import cli


@pytest.fixture
def runner():
    return CliRunner()


class TestInspiredDirections:
    def test_direction_count_at_least_150(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM inspired_directions")).scalar()
        assert count >= 150, f"Expected >= 150 inspired directions, got {count}"

    def test_all_producers_have_directions(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            total_producers = conn.execute(
                text("SELECT COUNT(*) FROM producers")
            ).scalar()
            producers_with_directions = conn.execute(
                text(
                    "SELECT COUNT(DISTINCT producer_id) FROM inspired_directions"
                )
            ).scalar()
        assert producers_with_directions == total_producers, (
            f"Only {producers_with_directions}/{total_producers} producers have directions"
        )

    def test_j_dilla_has_technical_direction(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(
                text(
                    "SELECT COUNT(*) FROM inspired_directions id "
                    "JOIN producers p ON p.id = id.producer_id "
                    "WHERE p.pdna_id = 'PDNA-000013' AND id.direction_type = 'technical'"
                )
            ).scalar()
        assert count >= 1, "J Dilla should have at least one technical direction"

    def test_directions_cli(self, runner, db_url):
        result = runner.invoke(cli, ["--db-url", db_url, "dna", "directions", "PDNA-000013"])
        assert result.exit_code == 0, result.output
        assert "Program intention" in result.output or "PDNA-000013" in result.output
