"""Integration tests for collaborator edges seed and CLI."""
import pytest
from click.testing import CliRunner
from sqlalchemy import create_engine, text

from pdna.cli.main import cli


@pytest.fixture
def runner():
    return CliRunner()


class TestCollaboratorEdges:
    def test_collab_count_at_least_100(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM collaborator_edges")).scalar()
        assert count >= 100, f"Expected >= 100 collaborator edges, got {count}"

    def test_all_producers_have_collabs(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            total_producers = conn.execute(
                text("SELECT COUNT(*) FROM producers")
            ).scalar()
            producers_with_collabs = conn.execute(
                text("SELECT COUNT(DISTINCT from_producer_id) FROM collaborator_edges")
            ).scalar()
        assert producers_with_collabs == total_producers, (
            f"Only {producers_with_collabs}/{total_producers} producers have collaborator edges"
        )

    def test_j_dilla_has_beat_sale(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(
                text(
                    "SELECT COUNT(*) FROM collaborator_edges ce "
                    "JOIN producers p ON p.id = ce.from_producer_id "
                    "WHERE p.pdna_id = 'PDNA-000013' AND ce.edge_type = 'beat-sale'"
                )
            ).scalar()
        assert count >= 1, "J Dilla should have at least one beat-sale edge"

    def test_collabs_cli(self, runner, db_url):
        result = runner.invoke(cli, ["--db-url", db_url, "dna", "collabs", "PDNA-000013"])
        assert result.exit_code == 0, result.output
        assert "PDNA-000013" in result.output or "Dilla" in result.output or "Common" in result.output
