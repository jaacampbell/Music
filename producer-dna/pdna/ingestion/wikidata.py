from pathlib import Path
from rich.console import Console

from pdna.ingestion.base import BaseIngestor

console = Console()

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

PRODUCER_QUERY = """
SELECT DISTINCT ?work ?workLabel ?artist ?artistLabel ?year WHERE {{
  BIND(wd:{qid} AS ?producer)
  {{ ?work wdt:P162 ?producer . }}
  UNION
  {{ ?work wdt:P57 ?producer . }}
  OPTIONAL {{ ?work wdt:P175 ?artist . }}
  OPTIONAL {{ ?work wdt:P577 ?date . BIND(YEAR(?date) AS ?year) }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" }}
}}
LIMIT 200
"""


class WikidataIngestor(BaseIngestor):
    RATE_LIMIT_DELAY = 2.0

    def ingest(self, pdna_id: str, db_url: str, dry_run: bool = False) -> None:
        producer = self._get_producer_row(pdna_id, db_url)
        if not producer:
            console.print(f"[red]Producer {pdna_id} not found in DB.[/]")
            return

        wikidata_id = producer.get("wikidata_id")
        if not wikidata_id:
            console.print(f"[yellow]{pdna_id} has no Wikidata ID. Skipping.[/]")
            return

        qid = wikidata_id.lstrip("Q") if wikidata_id.startswith("Q") else wikidata_id
        sparql_query = PRODUCER_QUERY.format(qid=wikidata_id)

        console.print(f"[cyan]Querying Wikidata SPARQL for {producer['name']} ({wikidata_id})...[/]")
        try:
            data = self.fetch_json(
                SPARQL_ENDPOINT,
                params={"query": sparql_query, "format": "json"},
                headers={"User-Agent": "ProducerDNA/1.0 (pdna@example.com)"},
            )
        except Exception as e:
            console.print(f"[red]Wikidata SPARQL error: {e}[/]")
            return

        bindings = data.get("results", {}).get("bindings", [])
        console.print(f"  Found {len(bindings)} works from Wikidata.")

        if dry_run:
            for b in bindings[:5]:
                title = b.get("workLabel", {}).get("value", "?")
                artist = b.get("artistLabel", {}).get("value", "?")
                year = b.get("year", {}).get("value", "?")
                console.print(f"  [dry-run] {title} — {artist} ({year})")
            return

        self._save_bindings(producer["id"], bindings, db_url)
        console.print(f"[green]✓ Wikidata ingestion complete for {pdna_id}.[/]")

    def _save_bindings(self, producer_db_id: int, bindings: list, db_url: str) -> None:
        from sqlalchemy import create_engine, text
        engine = create_engine(db_url)
        with engine.connect() as conn:
            with conn.begin():
                count = 0
                for b in bindings:
                    title = b.get("workLabel", {}).get("value", "")
                    if not title or title.startswith("Q"):
                        continue
                    artist = b.get("artistLabel", {}).get("value")
                    year_str = b.get("year", {}).get("value")
                    year = int(year_str) if year_str and year_str.isdigit() else None

                    result = conn.execute(
                        text(
                            "INSERT INTO works (title, work_type, release_year, artist) "
                            "VALUES (:title, 'track', :year, :artist) "
                            "ON CONFLICT DO NOTHING RETURNING id"
                        ),
                        {"title": title, "year": year, "artist": artist},
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
                console.print(f"  Saved {count} works from Wikidata (confidence C).")
