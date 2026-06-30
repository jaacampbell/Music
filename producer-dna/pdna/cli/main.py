import click
from rich.console import Console

from pdna.config import settings

console = Console()


@click.group()
@click.option(
    "--db-url",
    envvar="DATABASE_URL",
    default=None,
    help="PostgreSQL connection URL (overrides .env)",
)
@click.pass_context
def cli(ctx, db_url):
    """Producer DNA Research OS — music producer knowledge database."""
    ctx.ensure_object(dict)
    ctx.obj["db_url"] = db_url or settings.database_url


from pdna.cli.cmd_db import db_group
from pdna.cli.cmd_producer import producer_group
from pdna.cli.cmd_ingest import ingest_group
from pdna.cli.cmd_research import research_group
from pdna.cli.cmd_dna import dna_group
from pdna.cli.cmd_export import export_group

cli.add_command(db_group)
cli.add_command(producer_group)
cli.add_command(ingest_group)
cli.add_command(research_group)
cli.add_command(dna_group)
cli.add_command(export_group)
