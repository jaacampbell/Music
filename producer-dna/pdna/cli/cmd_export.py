import json
from pathlib import Path

import click
from rich.console import Console

console = Console()


@click.group(name="export")
def export_group():
    """Export producer data: json, markdown, prompt."""
    pass


@export_group.command("json")
@click.argument("pdna_id")
@click.option("--out", default=None, help="Output file path (default: stdout)")
@click.option("--all", "export_all", is_flag=True, help="Export all producers as JSONL")
@click.pass_context
def export_json(ctx, pdna_id, out, export_all):
    """Export producer(s) as JSON or JSONL."""
    from pdna.export.json_export import export_producer_json, export_all_json
    if export_all:
        export_all_json(ctx.obj["db_url"], out)
    else:
        data = export_producer_json(pdna_id, ctx.obj["db_url"])
        if out:
            Path(out).write_text(json.dumps(data, indent=2, default=str))
            console.print(f"[green]✓ Exported to {out}[/]")
        else:
            console.print_json(json.dumps(data, default=str))


@export_group.command("markdown")
@click.argument("pdna_id")
@click.option("--out", default=None, help="Output .md file path (default: stdout)")
@click.pass_context
def export_markdown(ctx, pdna_id, out):
    """Export a producer's DNA capsule as Markdown."""
    from pdna.export.markdown_export import export_producer_markdown
    text = export_producer_markdown(pdna_id, ctx.obj["db_url"])
    if out:
        Path(out).write_text(text)
        console.print(f"[green]✓ Exported to {out}[/]")
    else:
        console.print(text)


@export_group.command("prompt")
@click.argument("pdna_id")
@click.option("--type", "prompt_type", default="beat_making",
              type=click.Choice(["beat_making", "song_direction", "daw_session",
                                 "stem_generation", "artist_brief"]),
              show_default=True)
@click.option("--model", "model_target", default="generic",
              type=click.Choice(["generic", "suno", "udio", "claude", "gpt4"]),
              show_default=True)
@click.option("--out", default=None)
@click.pass_context
def export_prompt(ctx, pdna_id, prompt_type, model_target, out):
    """Generate or retrieve a creative prompt export for a producer."""
    from pdna.export.prompt_export import generate_prompt
    text = generate_prompt(pdna_id, prompt_type, model_target, ctx.obj["db_url"])
    if out:
        Path(out).write_text(text)
        console.print(f"[green]✓ Prompt saved to {out}[/]")
    else:
        console.print(text)
