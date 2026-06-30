import click
from rich.console import Console

console = Console()


@click.group(name="ingest")
def ingest_group():
    """Ingest data from external sources: musicbrainz, discogs, wikidata."""
    pass


@ingest_group.command("musicbrainz")
@click.argument("pdna_id")
@click.option("--dry-run", is_flag=True, help="Show what would be ingested without writing")
@click.pass_context
def ingest_mb(ctx, pdna_id, dry_run):
    """Ingest works and credits from MusicBrainz for a producer."""
    from pdna.ingestion.musicbrainz import MusicBrainzIngestor
    from pdna.config import settings

    ingestor = MusicBrainzIngestor(settings.pdna_cache_dir)
    ingestor.ingest(pdna_id, ctx.obj["db_url"], dry_run=dry_run)


@ingest_group.command("discogs")
@click.argument("pdna_id")
@click.option("--dry-run", is_flag=True)
@click.pass_context
def ingest_discogs(ctx, pdna_id, dry_run):
    """Ingest release credits from Discogs for a producer."""
    from pdna.ingestion.discogs import DiscogsIngestor
    from pdna.config import settings

    ingestor = DiscogsIngestor(settings.pdna_cache_dir)
    ingestor.ingest(pdna_id, ctx.obj["db_url"], dry_run=dry_run)


@ingest_group.command("wikidata")
@click.argument("pdna_id")
@click.option("--dry-run", is_flag=True)
@click.pass_context
def ingest_wikidata(ctx, pdna_id, dry_run):
    """Ingest producer credits from Wikidata SPARQL for a producer."""
    from pdna.ingestion.wikidata import WikidataIngestor
    from pdna.config import settings

    ingestor = WikidataIngestor(settings.pdna_cache_dir)
    ingestor.ingest(pdna_id, ctx.obj["db_url"], dry_run=dry_run)


@ingest_group.command("all")
@click.argument("pdna_id")
@click.option("--dry-run", is_flag=True)
@click.pass_context
def ingest_all(ctx, pdna_id, dry_run):
    """Run all ingestors (MusicBrainz, Discogs, Wikidata) for a producer."""
    ctx.invoke(ingest_mb, pdna_id=pdna_id, dry_run=dry_run)
    ctx.invoke(ingest_discogs, pdna_id=pdna_id, dry_run=dry_run)
    ctx.invoke(ingest_wikidata, pdna_id=pdna_id, dry_run=dry_run)
