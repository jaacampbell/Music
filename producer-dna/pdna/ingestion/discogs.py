from pathlib import Path
from rich.console import Console

from pdna.ingestion.base import BaseIngestor
from pdna.config import settings

console = Console()

PRODUCER_ROLES = {"producer", "mixed by", "arranged by", "co-producer", "executive producer"}


class DiscogsIngestor(BaseIngestor):
    RATE_LIMIT_DELAY = 1.0

    def ingest(self, pdna_id: str, db_url: str, dry_run: bool = False) -> None:
        if not settings.discogs_token:
            console.print("[yellow]DISCOGS_TOKEN not set in .env — skipping Discogs ingestion.[/]")
            return

        producer = self._get_producer_row(pdna_id, db_url)
        if not producer:
            console.print(f"[red]Producer {pdna_id} not found in DB.[/]")
            return

        discogs_id = producer.get("discogs_id")
        if not discogs_id:
            console.print(f"[yellow]{pdna_id} has no Discogs ID. Skipping.[/]")
            return

        import discogs_client
        client = discogs_client.Client(
            "ProducerDNA/1.0",
            user_token=settings.discogs_token,
        )

        try:
            artist = client.artist(discogs_id)
            releases = list(artist.releases.page(1))
        except Exception as e:
            console.print(f"[red]Discogs error: {e}[/]")
            return

        console.print(f"  Found {len(releases)} releases on page 1.")

        if dry_run:
            for r in releases[:5]:
                console.print(f"  [dry-run] {r.title} ({getattr(r, 'year', '?')})")
            return

        self._save_releases(producer["id"], releases, db_url)
        console.print(f"[green]✓ Discogs ingestion complete for {pdna_id}.[/]")

    def _save_releases(self, producer_db_id: int, releases: list, db_url: str) -> None:
        from sqlalchemy import create_engine, text
        engine = create_engine(db_url)
        with engine.connect() as conn:
            with conn.begin():
                count = 0
                for r in releases:
                    title = getattr(r, "title", "")
                    year = getattr(r, "year", None)
                    discogs_id = getattr(r, "id", None)
                    result = conn.execute(
                        text(
                            "INSERT INTO works (title, work_type, release_year, discogs_id) "
                            "VALUES (:title, 'album', :year, :did) "
                            "ON CONFLICT DO NOTHING RETURNING id"
                        ),
                        {"title": title, "year": year, "did": discogs_id},
                    )
                    work_row = result.fetchone()
                    if work_row:
                        conn.execute(
                            text(
                                "INSERT INTO credits (producer_id, work_id, role, confidence) "
                                "VALUES (:pid, :wid, 'producer', 'C') "
                                "ON CONFLICT (producer_id, work_id, role) DO NOTHING"
                            ),
                            {"pid": producer_db_id, "wid": work_row[0]},
                        )
                        count += 1
                console.print(f"  Saved {count} releases from Discogs (confidence C).")
