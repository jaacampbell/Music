from rich.console import Console
from sqlalchemy import create_engine, text

console = Console()


class ResearchPipeline:
    def __init__(self, db_url: str):
        self.db_url = db_url

    def run(self, pdna_id: str, stage: str = "all") -> None:
        engine = create_engine(self.db_url)
        with engine.connect() as conn:
            producer = conn.execute(
                text("SELECT id, name, musicbrainz_id, wikidata_id FROM producers WHERE pdna_id = :id"),
                {"id": pdna_id},
            ).fetchone()

        if not producer:
            console.print(f"[red]Producer {pdna_id} not found.[/]")
            return

        console.print(f"\n[bold]Research pipeline for [cyan]{pdna_id}[/]: {producer[1]}[/]")

        if stage in ("identity", "all"):
            self._stage_identity(producer, pdna_id)
        if stage in ("works", "all"):
            self._stage_works(producer, pdna_id)
        if stage in ("sources", "all"):
            self._stage_sources(producer, pdna_id)

    def _stage_identity(self, producer, pdna_id: str) -> None:
        console.print("  [1] Identity resolution: checking external IDs...")
        if producer[2]:
            console.print(f"      MusicBrainz: [green]{producer[2]}[/]")
        else:
            console.print("      MusicBrainz: [yellow]not linked[/]")
        if producer[3]:
            console.print(f"      Wikidata: [green]{producer[3]}[/]")
        else:
            console.print("      Wikidata: [yellow]not linked[/]")
        console.print("      → Run [bold]pdna producer link[/] to add missing IDs.")

    def _stage_works(self, producer, pdna_id: str) -> None:
        from sqlalchemy import create_engine, text
        engine = create_engine(self.db_url)
        with engine.connect() as conn:
            credit_count = conn.execute(
                text("SELECT COUNT(*) FROM credits WHERE producer_id = :pid"), {"pid": producer[0]}
            ).scalar()
        console.print(f"  [2] Works & Credits: {credit_count} credits on record.")
        if credit_count < 5:
            console.print("      → Run [bold]pdna ingest all[/] to populate from external sources.")

    def _stage_sources(self, producer, pdna_id: str) -> None:
        from sqlalchemy import create_engine, text
        engine = create_engine(self.db_url)
        with engine.connect() as conn:
            source_counts = conn.execute(
                text(
                    "SELECT reliability, COUNT(*) FROM sources WHERE producer_id = :pid "
                    "GROUP BY reliability ORDER BY reliability"
                ),
                {"pid": producer[0]},
            ).fetchall()
        if source_counts:
            breakdown = "  ".join(f"[bold]{r}[/]:{c}" for r, c in source_counts)
            console.print(f"  [3] Sources: {breakdown}")
        else:
            console.print("  [3] Sources: [yellow]none on record[/]")
        console.print("      → Use [bold]pdna research confidence promote[/] to upgrade tiers.")
