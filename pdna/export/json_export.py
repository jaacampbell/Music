import json
from pathlib import Path
from sqlalchemy import create_engine, text

_DNA_TABLES = {
    "sonic": (
        "SELECT atmosphere, warmth, grit, polish, darkness, brightness, "
        "density, space, distortion, synthetic_organic_balance, notes "
        "FROM sonic_dna WHERE producer_id = :pid"
    ),
    "rhythmic": (
        "SELECT swing, grid_precision, drum_density, groove_family, "
        "kick_language, snare_language, hat_language, percussion_behavior, "
        "tempo_min, tempo_max, tempo_signature, notes "
        "FROM rhythmic_dna WHERE producer_id = :pid"
    ),
    "melodic": (
        "SELECT dissonance_level, motif_complexity, chord_mood, modality, "
        "tonal_center, influences_list, notes "
        "FROM melodic_harmonic_dna WHERE producer_id = :pid"
    ),
    "arrangement": (
        "SELECT intro_style, drop_behavior, chorus_behavior, loop_evolution, "
        "transition_style, tension_release, structural_complexity, notes "
        "FROM arrangement_dna WHERE producer_id = :pid"
    ),
    "mixing": (
        "SELECT low_end_approach, midrange_approach, high_end_approach, "
        "loudness_level, stereo_width, vocal_placement, reverb_use, delay_use, "
        "compression, saturation, notes "
        "FROM mixing_dna WHERE producer_id = :pid"
    ),
    "sampling": (
        "SELECT source_traditions, chopping_style, pitch_shifting, filtering, "
        "looping_style, ethics_approach, clearance_rate, notes "
        "FROM sampling_dna WHERE producer_id = :pid"
    ),
    "nuance": (
        "SELECT casual_listener, producer_ear, engineer_ear, artist_ear, "
        "dj_ear, beginner_ear "
        "FROM style_nuance_map WHERE producer_id = :pid"
    ),
}


def _fetch_dna(conn, producer_id: int) -> dict:
    dna = {}
    for key, sql in _DNA_TABLES.items():
        row = conn.execute(text(sql), {"pid": producer_id}).fetchone()
        if row:
            dna[key] = {k: v for k, v in dict(row._mapping).items() if v is not None}
        else:
            dna[key] = {}
    return dna


def _fetch_warnings(conn, producer_id: int) -> list[dict]:
    rows = conn.execute(text(
        "SELECT warning_type, severity, description FROM originality_warnings "
        "WHERE producer_id = :pid "
        "ORDER BY CASE severity WHEN 'major' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END"
    ), {"pid": producer_id}).fetchall()
    return [dict(r._mapping) for r in rows]


def _fetch_directions(conn, producer_id: int) -> list[dict]:
    rows = conn.execute(text(
        "SELECT title, direction_text, direction_type, sort_order "
        "FROM inspired_directions WHERE producer_id = :pid "
        "ORDER BY sort_order NULLS LAST, id"
    ), {"pid": producer_id}).fetchall()
    return [dict(r._mapping) for r in rows]


def _fetch_fusions(conn, producer_id: int) -> list[dict]:
    rows = conn.execute(text(
        "SELECT secondary_element, fusion_description, creative_prompt "
        "FROM fusion_paths WHERE primary_producer_id = :pid "
        "ORDER BY secondary_element"
    ), {"pid": producer_id}).fetchall()
    return [dict(r._mapping) for r in rows]


def _fetch_iterations(conn, producer_id: int) -> list[dict]:
    rows = conn.execute(text(
        "SELECT iteration_number, title, prompt_text, target_context "
        "FROM creative_iterations WHERE producer_id = :pid "
        "ORDER BY iteration_number"
    ), {"pid": producer_id}).fetchall()
    return [dict(r._mapping) for r in rows]


def export_producer_json(pdna_id: str, db_url: str) -> dict:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        p = conn.execute(
            text("SELECT * FROM producers WHERE pdna_id = :id"), {"id": pdna_id}
        ).fetchone()
        if not p:
            return {}

        p = dict(p._mapping)
        aliases = [
            dict(r._mapping) for r in conn.execute(
                text("SELECT alias, alias_type FROM producer_aliases WHERE producer_id = :id"),
                {"id": p["id"]},
            ).fetchall()
        ]
        credits_raw = conn.execute(
            text(
                "SELECT w.title, w.artist, w.release_year, w.label, c.role, c.confidence "
                "FROM credits c JOIN works w ON c.work_id = w.id "
                "WHERE c.producer_id = :id ORDER BY w.release_year DESC"
            ),
            {"id": p["id"]},
        ).fetchall()
        profile = conn.execute(
            text("SELECT * FROM producer_profiles WHERE producer_id = :id"), {"id": p["id"]}
        ).fetchone()
        dna = _fetch_dna(conn, p["id"])
        warnings = _fetch_warnings(conn, p["id"])
        directions = _fetch_directions(conn, p["id"])
        fusions = _fetch_fusions(conn, p["id"])
        iterations = _fetch_iterations(conn, p["id"])

    out = {
        "pdna_id": p["pdna_id"],
        "name": p["name"],
        "real_name": p["real_name"],
        "country": p["country"],
        "city": p["city"],
        "region": p["region"],
        "active_from": p["active_from"],
        "active_to": p["active_to"],
        "is_active": p["is_active"],
        "primary_scenes": p["primary_scenes"],
        "musicbrainz_id": p["musicbrainz_id"],
        "wikidata_id": p["wikidata_id"],
        "discogs_id": p["discogs_id"],
        "notes": p["notes"],
        "aliases": aliases,
        "credits": [
            {"title": c[0], "artist": c[1], "year": c[2],
             "label": c[3], "role": c[4], "confidence": c[5]}
            for c in credits_raw
        ],
        "profile": dict(profile._mapping) if profile else None,
        "dna": dna,
        "warnings": warnings,
        "directions": directions,
        "fusions": fusions,
        "iterations": iterations,
    }
    return out


def export_all_json(db_url: str, out_path: str | None) -> None:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        pdna_ids = [r[0] for r in conn.execute(
            text("SELECT pdna_id FROM producers ORDER BY pdna_id")
        ).fetchall()]

    lines = []
    for pdna_id in pdna_ids:
        data = export_producer_json(pdna_id, db_url)
        lines.append(json.dumps(data, default=str))

    content = "\n".join(lines)
    if out_path:
        Path(out_path).write_text(content)
    else:
        print(content)
