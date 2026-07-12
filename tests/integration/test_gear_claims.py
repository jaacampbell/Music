"""Integration tests for gear_claims seed and CLI."""
import pytest
from click.testing import CliRunner
from sqlalchemy import create_engine, text

from pdna.cli.main import cli


@pytest.fixture
def runner():
    return CliRunner()


class TestGearClaims:
    def test_gear_count_at_least_100(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM gear_claims")).scalar()
        assert count >= 100, f"Expected >= 100 gear claims, got {count}"

    def test_all_producers_have_gear(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            total = conn.execute(text("SELECT COUNT(*) FROM producers")).scalar()
            with_gear = conn.execute(
                text("SELECT COUNT(DISTINCT producer_id) FROM gear_claims")
            ).scalar()
        assert with_gear == total, (
            f"Only {with_gear}/{total} producers have gear claims"
        )

    def test_j_dilla_has_mpc(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(
                text(
                    "SELECT COUNT(*) FROM gear_claims gc "
                    "JOIN producers p ON p.id = gc.producer_id "
                    "WHERE p.pdna_id = 'PDNA-000013' AND gc.gear_name ILIKE '%MPC%'"
                )
            ).scalar()
        assert count >= 1, "J Dilla should have at least one MPC gear claim"

    def test_gear_cli(self, runner, db_url):
        result = runner.invoke(cli, ["--db-url", db_url, "dna", "gear", "PDNA-000013"])
        assert result.exit_code == 0, result.output
        assert "MPC" in result.output or "Dilla" in result.output or "sampler" in result.output.lower()
