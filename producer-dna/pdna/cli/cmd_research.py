import click
from rich.console import Console

console = Console()


@click.group(name="research")
def research_group():
    """Research pipeline: run stages, promote confidence tiers."""
    pass


@research_group.command("pipeline")
@click.argument("pdna_id")
@click.option("--stage", default="all",
              type=click.Choice(["identity", "works", "sources", "all"]),
              help="Which research stage to run")
@click.pass_context
def research_pipeline(ctx, pdna_id, stage):
    """Run the research pipeline for a producer."""
    from pdna.research.pipeline import ResearchPipeline
    pipeline = ResearchPipeline(ctx.obj["db_url"])
    pipeline.run(pdna_id, stage=stage)


@research_group.command("confidence")
@click.argument("pdna_id")
@click.option("--source-id", type=int, required=True, help="Source DB row ID to promote")
@click.option("--tier", required=True,
              type=click.Choice(["A", "B", "C", "D", "E", "Unknown"]),
              help="New confidence tier")
@click.pass_context
def confidence_promote(ctx, pdna_id, source_id, tier):
    """Promote a source's confidence tier."""
    from pdna.research.confidence import promote_source_tier
    promote_source_tier(source_id, tier, ctx.obj["db_url"])
    console.print(f"[green]✓ Source {source_id} promoted to tier {tier}.[/]")


@research_group.command("deduplicate")
@click.option("--dry-run", is_flag=True)
@click.pass_context
def deduplicate(ctx, dry_run):
    """Find and merge probable duplicate producer records."""
    from pdna.research.deduplication import find_duplicates
    dupes = find_duplicates(ctx.obj["db_url"])
    if not dupes:
        console.print("[green]No duplicates found.[/]")
        return
    for d in dupes:
        console.print(f"  Probable duplicate: [cyan]{d[0]}[/] ↔ [cyan]{d[1]}[/] (similarity: {d[2]:.2f})")
    if dry_run:
        console.print("[yellow]Dry run — no changes made.[/]")
