"""Seed DNA Layer 2: rubric scores + 7 DNA tables for all 50 Batch 001 producers

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-29
"""
from pathlib import Path
import yaml
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

SEEDS_DIR = Path(__file__).resolve().parent.parent.parent / "seeds" / "batch001"


def _load(filename: str) -> dict:
    with open(SEEDS_DIR / filename) as f:
        return yaml.safe_load(f)


def _id_map(conn) -> dict[str, int]:
    rows = conn.execute(
        sa.text("SELECT id, pdna_id FROM producers WHERE pdna_id LIKE 'PDNA-0000%'")
    ).fetchall()
    return {r[1]: r[0] for r in rows}


def _pg_array(items) -> str | None:
    """Convert a Python list to a PostgreSQL TEXT[] literal string."""
    if not items:
        return None
    escaped = []
    for item in items:
        s = str(item).replace("\\", "\\\\").replace('"', '\\"')
        escaped.append(f'"{s}"')
    return "{" + ",".join(escaped) + "}"


def _seed_profiles(conn, id_map: dict) -> None:
    data = _load("dna_profiles.yaml")
    for p in data["profiles"]:
        pid = id_map.get(p["pdna_id"])
        if pid is None:
            continue
        conn.execute(
            sa.text(
                "INSERT INTO producer_profiles "
                "(producer_id, score_innovation, score_influence, score_technical_craft, "
                "score_sonic_identity, score_arrangement_skill, score_rhythm_design, "
                "score_melodic_harmonic, score_sound_design, score_mixing_aesthetics, "
                "score_cultural_importance, score_commercial_impact, score_underground_impact, "
                "score_longevity, score_adaptability, score_originality, "
                "score_confidence, dna_summary) "
                "VALUES (:producer_id, :score_innovation, :score_influence, :score_technical_craft, "
                ":score_sonic_identity, :score_arrangement_skill, :score_rhythm_design, "
                ":score_melodic_harmonic, :score_sound_design, :score_mixing_aesthetics, "
                ":score_cultural_importance, :score_commercial_impact, :score_underground_impact, "
                ":score_longevity, :score_adaptability, :score_originality, "
                ":score_confidence, :dna_summary) "
                "ON CONFLICT (producer_id) DO UPDATE SET "
                "score_innovation=EXCLUDED.score_innovation, "
                "score_influence=EXCLUDED.score_influence, "
                "score_technical_craft=EXCLUDED.score_technical_craft, "
                "score_sonic_identity=EXCLUDED.score_sonic_identity, "
                "score_arrangement_skill=EXCLUDED.score_arrangement_skill, "
                "score_rhythm_design=EXCLUDED.score_rhythm_design, "
                "score_melodic_harmonic=EXCLUDED.score_melodic_harmonic, "
                "score_sound_design=EXCLUDED.score_sound_design, "
                "score_mixing_aesthetics=EXCLUDED.score_mixing_aesthetics, "
                "score_cultural_importance=EXCLUDED.score_cultural_importance, "
                "score_commercial_impact=EXCLUDED.score_commercial_impact, "
                "score_underground_impact=EXCLUDED.score_underground_impact, "
                "score_longevity=EXCLUDED.score_longevity, "
                "score_adaptability=EXCLUDED.score_adaptability, "
                "score_originality=EXCLUDED.score_originality, "
                "score_confidence=EXCLUDED.score_confidence, "
                "dna_summary=EXCLUDED.dna_summary"
            ),
            {
                "producer_id": pid,
                "score_innovation": p.get("score_innovation"),
                "score_influence": p.get("score_influence"),
                "score_technical_craft": p.get("score_technical_craft"),
                "score_sonic_identity": p.get("score_sonic_identity"),
                "score_arrangement_skill": p.get("score_arrangement_skill"),
                "score_rhythm_design": p.get("score_rhythm_design"),
                "score_melodic_harmonic": p.get("score_melodic_harmonic"),
                "score_sound_design": p.get("score_sound_design"),
                "score_mixing_aesthetics": p.get("score_mixing_aesthetics"),
                "score_cultural_importance": p.get("score_cultural_importance"),
                "score_commercial_impact": p.get("score_commercial_impact"),
                "score_underground_impact": p.get("score_underground_impact"),
                "score_longevity": p.get("score_longevity"),
                "score_adaptability": p.get("score_adaptability"),
                "score_originality": p.get("score_originality"),
                "score_confidence": p.get("score_confidence", "D"),
                "dna_summary": p.get("dna_summary"),
            },
        )


def _seed_sonic(conn, id_map: dict) -> None:
    data = _load("dna_sonic.yaml")
    for p in data["sonic"]:
        pid = id_map.get(p["pdna_id"])
        if pid is None:
            continue
        conn.execute(
            sa.text(
                "INSERT INTO sonic_dna "
                "(producer_id, atmosphere, warmth, grit, polish, darkness, brightness, "
                "density, space, distortion, synthetic_organic_balance, notes, confidence) "
                "VALUES (:producer_id, :atmosphere, :warmth, :grit, :polish, :darkness, "
                ":brightness, :density, :space, :distortion, :synthetic_organic_balance, "
                ":notes, :confidence) "
                "ON CONFLICT (producer_id) DO UPDATE SET "
                "atmosphere=EXCLUDED.atmosphere, warmth=EXCLUDED.warmth, grit=EXCLUDED.grit, "
                "polish=EXCLUDED.polish, darkness=EXCLUDED.darkness, brightness=EXCLUDED.brightness, "
                "density=EXCLUDED.density, space=EXCLUDED.space, distortion=EXCLUDED.distortion, "
                "synthetic_organic_balance=EXCLUDED.synthetic_organic_balance, "
                "notes=EXCLUDED.notes, confidence=EXCLUDED.confidence"
            ),
            {
                "producer_id": pid,
                "atmosphere": p.get("atmosphere"),
                "warmth": p.get("warmth"),
                "grit": p.get("grit"),
                "polish": p.get("polish"),
                "darkness": p.get("darkness"),
                "brightness": p.get("brightness"),
                "density": p.get("density"),
                "space": p.get("space"),
                "distortion": p.get("distortion"),
                "synthetic_organic_balance": p.get("synthetic_organic_balance"),
                "notes": p.get("notes"),
                "confidence": p.get("confidence", "D"),
            },
        )


def _seed_rhythmic(conn, id_map: dict) -> None:
    data = _load("dna_rhythmic.yaml")
    for p in data["rhythmic"]:
        pid = id_map.get(p["pdna_id"])
        if pid is None:
            continue
        conn.execute(
            sa.text(
                "INSERT INTO rhythmic_dna "
                "(producer_id, swing, grid_precision, drum_density, groove_family, "
                "kick_language, snare_language, hat_language, percussion_behavior, "
                "tempo_min, tempo_max, tempo_signature, notes, confidence) "
                "VALUES (:producer_id, :swing, :grid_precision, :drum_density, :groove_family, "
                ":kick_language, :snare_language, :hat_language, :percussion_behavior, "
                ":tempo_min, :tempo_max, :tempo_signature, :notes, :confidence) "
                "ON CONFLICT (producer_id) DO UPDATE SET "
                "swing=EXCLUDED.swing, grid_precision=EXCLUDED.grid_precision, "
                "drum_density=EXCLUDED.drum_density, groove_family=EXCLUDED.groove_family, "
                "kick_language=EXCLUDED.kick_language, snare_language=EXCLUDED.snare_language, "
                "hat_language=EXCLUDED.hat_language, percussion_behavior=EXCLUDED.percussion_behavior, "
                "tempo_min=EXCLUDED.tempo_min, tempo_max=EXCLUDED.tempo_max, "
                "tempo_signature=EXCLUDED.tempo_signature, notes=EXCLUDED.notes, "
                "confidence=EXCLUDED.confidence"
            ),
            {
                "producer_id": pid,
                "swing": p.get("swing"),
                "grid_precision": p.get("grid_precision"),
                "drum_density": p.get("drum_density"),
                "groove_family": p.get("groove_family"),
                "kick_language": p.get("kick_language"),
                "snare_language": p.get("snare_language"),
                "hat_language": p.get("hat_language"),
                "percussion_behavior": p.get("percussion_behavior"),
                "tempo_min": p.get("tempo_min"),
                "tempo_max": p.get("tempo_max"),
                "tempo_signature": p.get("tempo_signature", "4/4"),
                "notes": p.get("notes"),
                "confidence": p.get("confidence", "D"),
            },
        )


def _seed_melodic(conn, id_map: dict) -> None:
    data = _load("dna_melodic.yaml")
    for p in data["melodic"]:
        pid = id_map.get(p["pdna_id"])
        if pid is None:
            continue
        influences_arr = _pg_array(p.get("influences_list"))
        conn.execute(
            sa.text(
                "INSERT INTO melodic_harmonic_dna "
                "(producer_id, chord_mood, modality, tonal_center, dissonance_level, "
                "motif_complexity, influences_list, notes, confidence) "
                "VALUES (:producer_id, :chord_mood, :modality, :tonal_center, :dissonance_level, "
                ":motif_complexity, CAST(:influences_list AS TEXT[]), :notes, :confidence) "
                "ON CONFLICT (producer_id) DO UPDATE SET "
                "chord_mood=EXCLUDED.chord_mood, modality=EXCLUDED.modality, "
                "tonal_center=EXCLUDED.tonal_center, dissonance_level=EXCLUDED.dissonance_level, "
                "motif_complexity=EXCLUDED.motif_complexity, "
                "influences_list=EXCLUDED.influences_list, "
                "notes=EXCLUDED.notes, confidence=EXCLUDED.confidence"
            ),
            {
                "producer_id": pid,
                "chord_mood": p.get("chord_mood"),
                "modality": p.get("modality"),
                "tonal_center": p.get("tonal_center"),
                "dissonance_level": p.get("dissonance_level"),
                "motif_complexity": p.get("motif_complexity"),
                "influences_list": influences_arr,
                "notes": p.get("notes"),
                "confidence": p.get("confidence", "D"),
            },
        )


def _seed_arrangement(conn, id_map: dict) -> None:
    data = _load("dna_arrangement.yaml")
    for p in data["arrangement"]:
        pid = id_map.get(p["pdna_id"])
        if pid is None:
            continue
        conn.execute(
            sa.text(
                "INSERT INTO arrangement_dna "
                "(producer_id, intro_style, drop_behavior, chorus_behavior, loop_evolution, "
                "transition_style, tension_release, structural_complexity, notes, confidence) "
                "VALUES (:producer_id, :intro_style, :drop_behavior, :chorus_behavior, "
                ":loop_evolution, :transition_style, :tension_release, :structural_complexity, "
                ":notes, :confidence) "
                "ON CONFLICT (producer_id) DO UPDATE SET "
                "intro_style=EXCLUDED.intro_style, drop_behavior=EXCLUDED.drop_behavior, "
                "chorus_behavior=EXCLUDED.chorus_behavior, loop_evolution=EXCLUDED.loop_evolution, "
                "transition_style=EXCLUDED.transition_style, tension_release=EXCLUDED.tension_release, "
                "structural_complexity=EXCLUDED.structural_complexity, "
                "notes=EXCLUDED.notes, confidence=EXCLUDED.confidence"
            ),
            {
                "producer_id": pid,
                "intro_style": p.get("intro_style"),
                "drop_behavior": p.get("drop_behavior"),
                "chorus_behavior": p.get("chorus_behavior"),
                "loop_evolution": p.get("loop_evolution"),
                "transition_style": p.get("transition_style"),
                "tension_release": p.get("tension_release"),
                "structural_complexity": p.get("structural_complexity"),
                "notes": p.get("notes"),
                "confidence": p.get("confidence", "D"),
            },
        )


def _seed_mixing(conn, id_map: dict) -> None:
    data = _load("dna_mixing.yaml")
    for p in data["mixing"]:
        pid = id_map.get(p["pdna_id"])
        if pid is None:
            continue
        conn.execute(
            sa.text(
                "INSERT INTO mixing_dna "
                "(producer_id, low_end_approach, midrange_approach, high_end_approach, "
                "loudness_level, stereo_width, vocal_placement, reverb_use, delay_use, "
                "compression, saturation, notes, confidence) "
                "VALUES (:producer_id, :low_end_approach, :midrange_approach, :high_end_approach, "
                ":loudness_level, :stereo_width, :vocal_placement, :reverb_use, :delay_use, "
                ":compression, :saturation, :notes, :confidence) "
                "ON CONFLICT (producer_id) DO UPDATE SET "
                "low_end_approach=EXCLUDED.low_end_approach, "
                "midrange_approach=EXCLUDED.midrange_approach, "
                "high_end_approach=EXCLUDED.high_end_approach, "
                "loudness_level=EXCLUDED.loudness_level, stereo_width=EXCLUDED.stereo_width, "
                "vocal_placement=EXCLUDED.vocal_placement, reverb_use=EXCLUDED.reverb_use, "
                "delay_use=EXCLUDED.delay_use, compression=EXCLUDED.compression, "
                "saturation=EXCLUDED.saturation, notes=EXCLUDED.notes, confidence=EXCLUDED.confidence"
            ),
            {
                "producer_id": pid,
                "low_end_approach": p.get("low_end_approach"),
                "midrange_approach": p.get("midrange_approach"),
                "high_end_approach": p.get("high_end_approach"),
                "loudness_level": p.get("loudness_level"),
                "stereo_width": p.get("stereo_width"),
                "vocal_placement": p.get("vocal_placement"),
                "reverb_use": p.get("reverb_use"),
                "delay_use": p.get("delay_use"),
                "compression": p.get("compression"),
                "saturation": p.get("saturation"),
                "notes": p.get("notes"),
                "confidence": p.get("confidence", "D"),
            },
        )


def _seed_sampling(conn, id_map: dict) -> None:
    data = _load("dna_sampling.yaml")
    for p in data["sampling"]:
        pid = id_map.get(p["pdna_id"])
        if pid is None:
            continue
        traditions_arr = _pg_array(p.get("source_traditions"))
        conn.execute(
            sa.text(
                "INSERT INTO sampling_dna "
                "(producer_id, source_traditions, chopping_style, pitch_shifting, filtering, "
                "looping_style, ethics_approach, clearance_rate, notes, confidence) "
                "VALUES (:producer_id, CAST(:source_traditions AS TEXT[]), :chopping_style, "
                ":pitch_shifting, :filtering, :looping_style, :ethics_approach, "
                ":clearance_rate, :notes, :confidence) "
                "ON CONFLICT (producer_id) DO UPDATE SET "
                "source_traditions=EXCLUDED.source_traditions, "
                "chopping_style=EXCLUDED.chopping_style, pitch_shifting=EXCLUDED.pitch_shifting, "
                "filtering=EXCLUDED.filtering, looping_style=EXCLUDED.looping_style, "
                "ethics_approach=EXCLUDED.ethics_approach, clearance_rate=EXCLUDED.clearance_rate, "
                "notes=EXCLUDED.notes, confidence=EXCLUDED.confidence"
            ),
            {
                "producer_id": pid,
                "source_traditions": traditions_arr,
                "chopping_style": p.get("chopping_style"),
                "pitch_shifting": p.get("pitch_shifting"),
                "filtering": p.get("filtering"),
                "looping_style": p.get("looping_style"),
                "ethics_approach": p.get("ethics_approach"),
                "clearance_rate": p.get("clearance_rate"),
                "notes": p.get("notes"),
                "confidence": p.get("confidence", "D"),
            },
        )


def _seed_nuance(conn, id_map: dict) -> None:
    data = _load("dna_nuance.yaml")
    for p in data["nuance"]:
        pid = id_map.get(p["pdna_id"])
        if pid is None:
            continue
        conn.execute(
            sa.text(
                "INSERT INTO style_nuance_map "
                "(producer_id, casual_listener, producer_ear, engineer_ear, artist_ear, "
                "dj_ear, beginner_ear, confidence) "
                "VALUES (:producer_id, :casual_listener, :producer_ear, :engineer_ear, "
                ":artist_ear, :dj_ear, :beginner_ear, :confidence) "
                "ON CONFLICT (producer_id) DO UPDATE SET "
                "casual_listener=EXCLUDED.casual_listener, producer_ear=EXCLUDED.producer_ear, "
                "engineer_ear=EXCLUDED.engineer_ear, artist_ear=EXCLUDED.artist_ear, "
                "dj_ear=EXCLUDED.dj_ear, beginner_ear=EXCLUDED.beginner_ear, "
                "confidence=EXCLUDED.confidence"
            ),
            {
                "producer_id": pid,
                "casual_listener": p.get("casual_listener"),
                "producer_ear": p.get("producer_ear"),
                "engineer_ear": p.get("engineer_ear"),
                "artist_ear": p.get("artist_ear"),
                "dj_ear": p.get("dj_ear"),
                "beginner_ear": p.get("beginner_ear"),
                "confidence": p.get("confidence", "D"),
            },
        )


def upgrade() -> None:
    conn = op.get_bind()
    # Widen constrained varchar columns that are too short for real-world data
    conn.execute(sa.text("ALTER TABLE melodic_harmonic_dna ALTER COLUMN chord_mood TYPE TEXT"))
    conn.execute(sa.text("ALTER TABLE melodic_harmonic_dna ALTER COLUMN modality TYPE TEXT"))
    conn.execute(sa.text("ALTER TABLE melodic_harmonic_dna ALTER COLUMN tonal_center TYPE TEXT"))
    conn.execute(sa.text("ALTER TABLE rhythmic_dna ALTER COLUMN groove_family TYPE TEXT"))

    id_map = _id_map(conn)
    _seed_profiles(conn, id_map)
    _seed_sonic(conn, id_map)
    _seed_rhythmic(conn, id_map)
    _seed_melodic(conn, id_map)
    _seed_arrangement(conn, id_map)
    _seed_mixing(conn, id_map)
    _seed_sampling(conn, id_map)
    _seed_nuance(conn, id_map)


def downgrade() -> None:
    conn = op.get_bind()
    subq = "SELECT id FROM producers WHERE pdna_id LIKE 'PDNA-0000%'"
    for table in [
        "producer_profiles",
        "sonic_dna",
        "rhythmic_dna",
        "melodic_harmonic_dna",
        "arrangement_dna",
        "mixing_dna",
        "sampling_dna",
        "style_nuance_map",
    ]:
        conn.execute(sa.text(f"DELETE FROM {table} WHERE producer_id IN ({subq})"))
