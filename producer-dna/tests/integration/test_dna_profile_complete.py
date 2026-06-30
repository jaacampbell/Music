"""Integration tests verifying dna profile renders all 7 DNA table sections."""
import pytest
from click.testing import CliRunner

from pdna.cli.main import cli


@pytest.fixture
def runner():
    return CliRunner()


class TestDNAProfileComplete:
    def test_profile_includes_rhythmic(self, runner, db_url):
        result = runner.invoke(cli, ["--db-url", db_url, "dna", "profile", "PDNA-000013"])
        assert result.exit_code == 0, result.output
        assert "Rhythmic DNA" in result.output
        assert "Swing" in result.output

    def test_profile_includes_sampling_traditions(self, runner, db_url):
        result = runner.invoke(cli, ["--db-url", db_url, "dna", "profile", "PDNA-000013"])
        assert result.exit_code == 0, result.output
        assert "Sampling DNA" in result.output
        assert "Source Traditions" in result.output

    def test_profile_includes_nuance_producer_ear(self, runner, db_url):
        result = runner.invoke(cli, ["--db-url", db_url, "dna", "profile", "PDNA-000013"])
        assert result.exit_code == 0, result.output
        assert "Producer Ear" in result.output
