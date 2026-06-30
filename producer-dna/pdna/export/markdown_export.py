from pdna.export.json_export import export_producer_json


def export_producer_markdown(pdna_id: str, db_url: str) -> str:
    data = export_producer_json(pdna_id, db_url)
    if not data:
        return f"# Producer not found: {pdna_id}\n"

    lines = [
        f"# {data['pdna_id']}: {data['name']}",
        "",
    ]

    if data.get("real_name"):
        lines.append(f"**Real name:** {data['real_name']}  ")
    loc_parts = [x for x in [data.get("city"), data.get("region"), data.get("country")] if x]
    if loc_parts:
        lines.append(f"**Location:** {', '.join(loc_parts)}  ")
    active = f"{data.get('active_from', '?')}–{'now' if data.get('is_active') else data.get('active_to', '?')}"
    lines.append(f"**Active:** {active}  ")

    if data.get("aliases"):
        alias_str = ", ".join(a["alias"] for a in data["aliases"])
        lines.append(f"**Aliases:** {alias_str}  ")

    scenes = data.get("primary_scenes") or []
    if scenes:
        lines.append(f"**Scenes:** {', '.join(scenes)}  ")

    ext = []
    if data.get("musicbrainz_id"):
        ext.append(f"[MusicBrainz](https://musicbrainz.org/artist/{data['musicbrainz_id']})")
    if data.get("wikidata_id"):
        ext.append(f"[Wikidata](https://www.wikidata.org/wiki/{data['wikidata_id']})")
    if ext:
        lines.append(f"**External:** {' · '.join(ext)}  ")

    if data.get("notes"):
        lines.extend(["", "## Notes", "", data["notes"], ""])

    profile = data.get("profile")
    if profile and profile.get("dna_summary"):
        lines.extend(["## DNA Summary", "", profile["dna_summary"], ""])

    if data.get("credits"):
        lines.extend(["## Key Works", ""])
        for c in data["credits"][:20]:
            year = c.get("year") or "?"
            artist = c.get("artist") or "—"
            conf = c.get("confidence", "?")
            lines.append(f"- **{c['title']}** — {artist} ({year}) [{c['role']}, tier {conf}]")
        lines.append("")

    return "\n".join(lines)
