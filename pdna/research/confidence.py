from sqlalchemy import create_engine, text

VALID_TIERS = {"A", "B", "C", "D", "E", "Unknown"}

TIER_RULES = {
    "A": lambda s: s.get("source_type") in (
        "liner_notes", "official_interview", "archive", "label_page"
    ) and s.get("citation_status") == "verified",
    "B": lambda s: s.get("source_type") in (
        "book", "academic_paper", "music_journalist", "interview"
    ),
    "C": lambda s: s.get("source_type") in (
        "musicbrainz", "discogs", "wikidata", "wikipedia"
    ),
    "D": lambda s: s.get("source_type") == "musicological_analysis",
    "E": lambda s: s.get("source_type") == "hypothesis",
}


def promote_source_tier(source_id: int, new_tier: str, db_url: str) -> None:
    if new_tier not in VALID_TIERS:
        raise ValueError(f"Invalid tier: {new_tier}")
    engine = create_engine(db_url)
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(
                text("UPDATE sources SET reliability = :tier WHERE id = :id"),
                {"tier": new_tier, "id": source_id},
            )


def infer_tier(source_type: str, citation_status: str = "unverified") -> str:
    mock = {"source_type": source_type, "citation_status": citation_status}
    for tier in ("A", "B", "C", "D", "E"):
        if TIER_RULES[tier](mock):
            return tier
    return "Unknown"
