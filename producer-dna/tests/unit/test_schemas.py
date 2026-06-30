import pytest
from pydantic import ValidationError

from pdna.schemas.producer import ProducerSchema, AliasSchema
from pdna.schemas.dna import RubricScoreSchema, SonicDNASchema


class TestProducerSchema:
    def test_valid_producer(self):
        p = ProducerSchema(pdna_id="PDNA-000013", name="J Dilla")
        assert p.pdna_id == "PDNA-000013"
        assert p.name == "J Dilla"

    def test_invalid_pdna_id_format(self):
        with pytest.raises(ValidationError):
            ProducerSchema(pdna_id="PDNA-13", name="J Dilla")

    def test_invalid_pdna_id_no_prefix(self):
        with pytest.raises(ValidationError):
            ProducerSchema(pdna_id="000013", name="J Dilla")

    def test_country_uppercase(self):
        p = ProducerSchema(pdna_id="PDNA-000001", name="Test", country="gb")
        assert p.country == "GB"

    def test_invalid_country_length(self):
        with pytest.raises(ValidationError):
            ProducerSchema(pdna_id="PDNA-000001", name="Test", country="GBR")

    def test_alias_type_validation(self):
        with pytest.raises(ValidationError):
            AliasSchema(alias="Bobby D", alias_type="invalid_type")

    def test_valid_alias(self):
        a = AliasSchema(alias="Jay Dee", alias_type="solo_alias")
        assert a.alias == "Jay Dee"


class TestRubricScoreSchema:
    def test_valid_scores(self):
        s = RubricScoreSchema(score_innovation=8, score_influence=9, score_originality=7)
        assert s.score_innovation == 8

    def test_score_out_of_range(self):
        with pytest.raises(ValidationError):
            RubricScoreSchema(score_innovation=11)

    def test_score_zero_invalid(self):
        with pytest.raises(ValidationError):
            RubricScoreSchema(score_influence=0)

    def test_invalid_confidence_tier(self):
        with pytest.raises(ValidationError):
            RubricScoreSchema(score_confidence="Z")

    def test_valid_confidence_tier(self):
        s = RubricScoreSchema(score_confidence="A")
        assert s.score_confidence == "A"


class TestSonicDNASchema:
    def test_valid_sonic(self):
        s = SonicDNASchema(atmosphere=8, warmth=9, grit=3)
        assert s.atmosphere == 8

    def test_score_out_of_range(self):
        with pytest.raises(ValidationError):
            SonicDNASchema(darkness=15)
