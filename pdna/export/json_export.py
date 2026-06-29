import json
from pathlib import Path
from sqlalchemy import create_engine, text


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
