from pdna.scoring.rubric import DNAScoreCard, DIMENSIONS


class TestDNAScoreCard:
    def test_empty_card_not_complete(self):
        card = DNAScoreCard()
        assert not card.is_complete()

    def test_complete_card(self):
        kwargs = {d: 5 for d in DIMENSIONS}
        card = DNAScoreCard(**kwargs)
        assert card.is_complete()

    def test_validate_in_range(self):
        card = DNAScoreCard(innovation=10, influence=1)
        errors = card.validate()
        assert errors == []

    def test_validate_out_of_range(self):
        card = DNAScoreCard(innovation=11)
        errors = card.validate()
        assert any("innovation" in e for e in errors)

    def test_to_db_dict(self):
        card = DNAScoreCard(innovation=7, influence=9)
        d = card.to_db_dict()
        assert d["score_innovation"] == 7
        assert d["score_influence"] == 9
        assert "score_originality" in d

    def test_summary_incomplete(self):
        card = DNAScoreCard(innovation=8)
        assert "Incomplete" in card.summary()

    def test_summary_complete(self):
        kwargs = {d: 7 for d in DIMENSIONS}
        card = DNAScoreCard(**kwargs)
        assert "Complete" in card.summary()
        assert "7.0/10" in card.summary()
