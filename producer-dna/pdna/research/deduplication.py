from sqlalchemy import create_engine, text


def find_duplicates(db_url: str, threshold: float = 0.8) -> list[tuple]:
    """Find probable duplicate producer records using trigram similarity."""
    engine = create_engine(db_url)
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT a.pdna_id, b.pdna_id, "
                "similarity(a.name, b.name) AS sim "
                "FROM producers a JOIN producers b ON a.id < b.id "
                "WHERE similarity(a.name, b.name) >= :threshold "
                "ORDER BY sim DESC"
            ),
            {"threshold": threshold},
        ).fetchall()
    return [(r[0], r[1], r[2]) for r in rows]
