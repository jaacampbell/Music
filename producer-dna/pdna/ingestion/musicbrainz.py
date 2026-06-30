from pathlib import Path
from rich.console import Console
import musicbrainzngs

from pdna.ingestion.base import BaseIngestor

console = Console()

musicbrainzngs.set_useragent("ProducerDNA", "1.0", contact="pdna@example.com")
musicbrainzngs.set_rate_limit(limit_or_interval=1, new_requests=1)


class MusicBrainzIngestor(BaseIngestor):
    RATE_LIMIT_DELAY = 1.1

    def ingest(self, pdna_id: str, db_url: str, dry_run: bool = False) -> None:
        producer = self._get_producer_row(pdna_id, db_url)
        if not producer:
            console.print(f"[red]Producer {pdna_id} not found in DB.[/]")
            return

        mbid = producer.get("musicbrainz_id")
        if not mbid:
            console.print(f"[yellow]{pdna_id} has no MusicBrainz ID. Attempting name search...[/]")
            mbid = self._search_by_name(producer["name"])
            if not mbid:
                console.print(f"[red]No MusicBrainz match found for {producer['name']}.[/]")
                return

        console.print(f"[cyan]Fetching MusicBrainz data for {producer['name']} ({mbid})...[/]")
        try:
            artist_data = musicbrainzngs.get_artist_by_id(
                mbid, includes=["releases", "tags", "url-rels"]
            )
        except (musicbrainzngs.ResponseError, musicbrainzngs.NetworkError) as e:
            console.print(f"[red]MusicBrainz error: {e}[/]")
            console.print("[dim]Tip: MusicBrainz requires outbound HTTPS. Check network/proxy.[/]")
            return

        artist = artist_data.get("artist", {})
        releases = artist.get("release-list", [])

        console.print(f"  Found {len(releases)} releases.")

        if dry_run:
            for r in releases[:5]:
                console.print(f"  [dry-run] Would ingest: {r.get('title')} ({r.get('date', '?')[:4]})")
            return

        self._save_works(producer["id"], releases, db_url)
        console.print(f"[green]✓ MusicBrainz ingestion complete for {pdna_id}.[/]")

    def _search_by_name(self, name: str) -> str | None:
        try:
            result = musicbrainzngs.search_artists(artist=name, type="person", limit=3)
            artists = result.get("artist-list", [])
            if artists:
                return artists[0]["id"]
        except musicbrainzngs.ResponseError:
            pass
        return None

    def _save_works(self, producer_db_id: int, releases: list, db_url: str) -> None:
        from sqlalchemy import create_engine, text
        engine = create_engine(db_url)
        with engine.connect() as conn:
            with conn.begin():
                count = 0
                for r in releases:
                    title = r.get("title", "")
                    year_str = r.get("date", "")[:4]
                    year = int(year_str) if year_str.isdigit() else None
                    mb_id = r.get("id")
                    label_info = r.get("label-info-list", [])
                    label = label_info[0].get("label", {}).get("name") if label_info else None

                    result = conn.execute(
                        text(
                            "INSERT INTO works (title, work_type, release_year, label, musicbrainz_id) "
                            "VALUES (:title, :wtype, :year, :label, :mbid) "
                            "ON CONFLICT (musicbrainz_id) WHERE musicbrainz_id IS NOT NULL "
                            "DO UPDATE SET title=EXCLUDED.title RETURNING id"
                        ),
                        {"title": title, "wtype": "album", "year": year,
                         "label": label, "mbid": mb_id},
                    )
                    work_row = result.fetchone()
                    if not work_row:
                        work_row = conn.execute(
                            text("SELECT id FROM works WHERE musicbrainz_id = :mbid"),
                            {"mbid": mb_id},
                        ).fetchone()
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
                console.print(f"  Saved {count} works from MusicBrainz (confidence C).")
