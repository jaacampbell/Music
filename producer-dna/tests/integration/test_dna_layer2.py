"""Integration tests for DNA Layer 2 seed (migration 0004)."""
import pytest
from sqlalchemy import create_engine, text


@pytest.mark.usefixtures("test_db_url")
class TestDNALayer2:
    def test_all_producers_have_profile(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM producer_profiles")).scalar()
        assert count == 50, f"Expected 50 profile rows, got {count}"

    def test_sonic_dna_count(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM sonic_dna")).scalar()
        assert count == 50

    def test_rhythmic_dna_count(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM rhythmic_dna")).scalar()
        assert count == 50

    def test_melodic_dna_count(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM melodic_harmonic_dna")).scalar()
        assert count == 50

    def test_arrangement_dna_count(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM arrangement_dna")).scalar()
        assert count == 50

    def test_mixing_dna_count(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM mixing_dna")).scalar()
        assert count == 50

    def test_sampling_dna_count(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM sampling_dna")).scalar()
        assert count == 50

    def test_style_nuance_count(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM style_nuance_map")).scalar()
        assert count == 50

    def test_j_dilla_rubric_scores(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT pp.score_innovation, pp.score_influence, pp.score_originality, "
                    "pp.score_rhythm_design, pp.score_confidence "
                    "FROM producer_profiles pp "
                    "JOIN producers p ON pp.producer_id = p.id "
                    "WHERE p.pdna_id = 'PDNA-000013'"
                )
            ).fetchone()
        assert row is not None
        score_innovation, score_influence, score_originality, score_rhythm_design, confidence = row
        assert score_innovation == 10
        assert score_influence == 10
        assert score_originality == 10
        assert score_rhythm_design == 10
        assert confidence == "D"

    def test_j_dilla_rubric_all_in_range(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT score_innovation, score_influence, score_technical_craft, "
                    "score_sonic_identity, score_arrangement_skill, score_rhythm_design, "
                    "score_melodic_harmonic, score_sound_design, score_mixing_aesthetics, "
                    "score_cultural_importance, score_commercial_impact, score_underground_impact, "
                    "score_longevity, score_adaptability, score_originality "
                    "FROM producer_profiles pp "
                    "JOIN producers p ON pp.producer_id = p.id "
                    "WHERE p.pdna_id = 'PDNA-000013'"
                )
            ).fetchone()
        assert row is not None
        for score in row:
            assert score is not None
            assert 1 <= score <= 10, f"Score {score} out of 1-10 range"

    def test_j_dilla_sonic_dna(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT sd.warmth, sd.grit, sd.atmosphere "
                    "FROM sonic_dna sd "
                    "JOIN producers p ON sd.producer_id = p.id "
                    "WHERE p.pdna_id = 'PDNA-000013'"
                )
            ).fetchone()
        assert row is not None
        warmth, grit, atmosphere = row
        assert warmth >= 7, "J Dilla warmth should be >= 7"
        assert grit >= 5, "J Dilla grit should be >= 5"

    def test_george_martin_dna_summary(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            summary = conn.execute(
                text(
                    "SELECT pp.dna_summary "
                    "FROM producer_profiles pp "
                    "JOIN producers p ON pp.producer_id = p.id "
                    "WHERE p.pdna_id = 'PDNA-000001'"
                )
            ).scalar()
        assert summary is not None
        assert len(summary) > 50, "dna_summary should be a substantive description"

    def test_j_dilla_sampling_traditions(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT sd.source_traditions, sd.clearance_rate "
                    "FROM sampling_dna sd "
                    "JOIN producers p ON sd.producer_id = p.id "
                    "WHERE p.pdna_id = 'PDNA-000013'"
                )
            ).fetchone()
        assert row is not None
        traditions, clearance = row
        assert traditions is not None
        assert len(traditions) >= 3, "J Dilla should have multiple sampling traditions"
        assert clearance == "low"

    def test_style_nuance_producer_ear(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            producer_ear = conn.execute(
                text(
                    "SELECT snm.producer_ear "
                    "FROM style_nuance_map snm "
                    "JOIN producers p ON snm.producer_id = p.id "
                    "WHERE p.pdna_id = 'PDNA-000013'"
                )
            ).scalar()
        assert producer_ear is not None
        assert len(producer_ear) > 20, "producer_ear should be a substantive description"

    def test_all_nuance_perspectives_non_empty(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT casual_listener, producer_ear, engineer_ear, "
                    "artist_ear, dj_ear, beginner_ear "
                    "FROM style_nuance_map WHERE casual_listener IS NULL "
                    "OR producer_ear IS NULL OR engineer_ear IS NULL "
                    "OR artist_ear IS NULL OR dj_ear IS NULL OR beginner_ear IS NULL"
                )
            ).fetchall()
        assert len(rows) == 0, f"{len(rows)} producers have NULL nuance fields"

    def test_melodic_influences_array(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            influences = conn.execute(
                text(
                    "SELECT mhd.influences_list "
                    "FROM melodic_harmonic_dna mhd "
                    "JOIN producers p ON mhd.producer_id = p.id "
                    "WHERE p.pdna_id = 'PDNA-000013'"
                )
            ).scalar()
        assert influences is not None
        assert isinstance(influences, list)
        assert len(influences) >= 2

    def test_all_scores_non_null(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            count = conn.execute(
                text(
                    "SELECT COUNT(*) FROM producer_profiles WHERE "
                    "score_innovation IS NULL OR score_influence IS NULL OR "
                    "score_technical_craft IS NULL OR score_sonic_identity IS NULL OR "
                    "score_arrangement_skill IS NULL OR score_rhythm_design IS NULL OR "
                    "score_melodic_harmonic IS NULL OR score_sound_design IS NULL OR "
                    "score_mixing_aesthetics IS NULL OR score_cultural_importance IS NULL OR "
                    "score_commercial_impact IS NULL OR score_underground_impact IS NULL OR "
                    "score_longevity IS NULL OR score_adaptability IS NULL OR "
                    "score_originality IS NULL"
                )
            ).scalar()
        assert count == 0, f"{count} producers have NULL rubric scores"

    def test_kraftwerk_sampling_is_minimal(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT sd.clearance_rate, sd.pitch_shifting "
                    "FROM sampling_dna sd "
                    "JOIN producers p ON sd.producer_id = p.id "
                    "WHERE p.pdna_id = 'PDNA-000033'"
                )
            ).fetchone()
        assert row is not None
        clearance, pitch = row
        assert clearance == "none"
        assert pitch == 1
