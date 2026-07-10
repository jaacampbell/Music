"""Integration tests for enriched JSON, prompt, and markdown exports."""
import pytest

from pdna.export.json_export import export_producer_json
from pdna.export.markdown_export import export_producer_markdown
from pdna.export.prompt_export import generate_prompt


class TestExports:
    def test_json_export_includes_dna_key(self, db_url):
        data = export_producer_json("PDNA-000013", db_url)
        assert "dna" in data, "Export dict must have a 'dna' key"
        assert "sonic" in data["dna"], "dna dict must have 'sonic'"
        assert "rhythmic" in data["dna"], "dna dict must have 'rhythmic'"
        assert "melodic" in data["dna"], "dna dict must have 'melodic'"
        assert "arrangement" in data["dna"], "dna dict must have 'arrangement'"
        assert "mixing" in data["dna"], "dna dict must have 'mixing'"
        assert "sampling" in data["dna"], "dna dict must have 'sampling'"
        assert "nuance" in data["dna"], "dna dict must have 'nuance'"

    def test_json_export_dna_sonic_fields(self, db_url):
        data = export_producer_json("PDNA-000013", db_url)
        sonic = data["dna"]["sonic"]
        expected_fields = [
            "warmth", "grit", "atmosphere", "darkness", "brightness",
            "density", "space", "distortion",
        ]
        for field in expected_fields:
            assert field in sonic, f"sonic dict missing '{field}'"
            assert isinstance(sonic[field], int), f"sonic.{field} should be int"

    def test_prompt_export_uses_dna(self, db_url):
        prompt = generate_prompt("PDNA-000013", "beat_making", "claude", db_url)
        assert any(word in prompt.lower() for word in ["swing", "grid", "warmth", "sampling"]), (
            "beat_making prompt for J Dilla should reference DNA dimensions"
        )

    def test_markdown_export_includes_sonic(self, db_url):
        md = export_producer_markdown("PDNA-000013", db_url)
        assert "Sonic DNA" in md, "Markdown should contain a Sonic DNA section"
        assert any(dim in md for dim in ["Warmth", "Grit", "Atmosphere"]), (
            "Markdown Sonic DNA section should list sonic dimensions"
        )

    def test_json_export_includes_warnings(self, db_url):
        data = export_producer_json("PDNA-000013", db_url)
        assert "warnings" in data, "Export dict must have a 'warnings' key"
        assert len(data["warnings"]) >= 1, "J Dilla export should have at least one warning"

    def test_json_export_includes_directions(self, db_url):
        data = export_producer_json("PDNA-000013", db_url)
        assert "directions" in data, "Export dict must have a 'directions' key"
        assert len(data["directions"]) >= 1, "J Dilla export should have at least one direction"

    def test_prompt_includes_warning_guidance(self, db_url):
        prompt = generate_prompt("PDNA-000013", "beat_making", "claude", db_url)
        assert "Avoid" in prompt, "Prompt should include 'Avoid' guidance from major warning"

    def test_prompt_includes_direction_guidance(self, db_url):
        prompt = generate_prompt("PDNA-000013", "beat_making", "claude", db_url)
        assert "Channel" in prompt, "Prompt should include 'Channel' guidance from inspired directions"
