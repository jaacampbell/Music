import json
from pathlib import Path
from typing import Optional

import click
import yaml
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

RUBRIC_DIMS = [
    ("score_innovation", "Innovation"),
    ("score_influence", "Influence"),
    ("score_technical_craft", "Technical Craft"),
    ("score_sonic_identity", "Sonic Identity"),
    ("score_arrangement_skill", "Arrangement Skill"),
    ("score_rhythm_design", "Rhythm Design"),
    ("score_melodic_harmonic", "Melodic/Harmonic Identity"),
    ("score_sound_design", "Sound Design"),
    ("score_mixing_aesthetics", "Mixing Aesthetics"),
    ("score_cultural_importance", "Cultural Importance"),
    ("score_commercial_impact", "Commercial Impact"),
    ("score_underground_impact", "Underground Impact"),
    ("score_longevity", "Longevity"),
    ("score_adaptability", "Adaptability"),
    ("score_originality", "Originality"),
]


@click.group(name="dna")
def dna_group():
    """DNA analysis: score, profile, missing."""
    pass


@dna_group.command("score")
@click.argument("pdna_id")
@click.option("--yaml", "yaml_file", default=None, type=click.Path(exists=True),
              help="Load scores from YAML file instead of interactive mode")
@click.option("--rubric", is_flag=True, help="Score the 15-dim rubric (requires profile row)")
@click.pass_context
def dna_score(ctx, pdna_id, yaml_file, rubric):
    """Score DNA dimensions for a producer (interactive or from YAML)."""
    from sqlalchemy import create_engine, text
    engine = create_engine(ctx.obj["db_url"])

    with engine.connect() as conn:
        p = conn.execute(
            text("SELECT id, name FROM producers WHERE pdna_id = :id"), {"id": pdna_id}
        ).fetchone()
        if not p:
            console.print(f"[red]Producer {pdna_id} not found.[/]")
            return
        producer_db_id, producer_name = p[0], p[1]

    if yaml_file:
        with open(yaml_file) as f:
            scores = yaml.safe_load(f)
    elif rubric:
        console.print(f"\n[bold]Scoring rubric for [cyan]{producer_name}[/] (1–10 per dimension)[/]")
        console.print("[dim]These are analytical scores. Not a popularity ranking.[/]\n")
        scores = {}
        for field, label in RUBRIC_DIMS:
            val = click.prompt(f"  {label}", type=click.IntRange(1, 10))
            scores[field] = val
    else:
        console.print("[yellow]Use --rubric for interactive scoring or --yaml for file-based scoring.[/]")
        return

    with engine.connect() as conn:
        with conn.begin():
            # Upsert producer_profiles row
            existing = conn.execute(
                text("SELECT id FROM producer_profiles WHERE producer_id = :pid"),
                {"pid": producer_db_id},
            ).fetchone()

            if existing:
                set_parts = ", ".join(f"{k} = :{k}" for k in scores)
                scores["pid"] = producer_db_id
                conn.execute(
                    text(f"UPDATE producer_profiles SET {set_parts} WHERE producer_id = :pid"),
                    scores,
                )
            else:
                scores["pid"] = producer_db_id
                cols = ", ".join(scores.keys())
                vals = ", ".join(f":{k}" for k in scores)
                conn.execute(
                    text(f"INSERT INTO producer_profiles (producer_id, {cols}) VALUES (:pid, {vals})"),
                    scores,
                )

    console.print(f"[green]✓ DNA scores saved for {pdna_id}: {producer_name}.[/]")


@dna_group.command("profile")
@click.argument("pdna_id")
@click.pass_context
def dna_profile(ctx, pdna_id):
    """Display the full DNA profile for a producer."""
    from sqlalchemy import create_engine, text
    engine = create_engine(ctx.obj["db_url"])

    with engine.connect() as conn:
        p = conn.execute(
            text("SELECT id, name FROM producers WHERE pdna_id = :id"), {"id": pdna_id}
        ).fetchone()
        if not p:
            console.print(f"[red]Producer {pdna_id} not found.[/]")
            return

        profile = conn.execute(
            text("SELECT * FROM producer_profiles WHERE producer_id = :pid"), {"pid": p[0]}
        ).fetchone()
        sonic = conn.execute(
            text("SELECT * FROM sonic_dna WHERE producer_id = :pid"), {"pid": p[0]}
        ).fetchone()
        rhythmic = conn.execute(
            text("SELECT * FROM rhythmic_dna WHERE producer_id = :pid"), {"pid": p[0]}
        ).fetchone()

    console.print(f"\n[bold cyan]{pdna_id}[/]  [bold]{p[1]}[/]")

    if profile:
        prof = dict(profile._mapping)
        if prof.get("dna_summary"):
            console.print(Panel(prof["dna_summary"], title="DNA Summary"))

        table = Table(title="Rubric Scores (1–10)")
        table.add_column("Dimension")
        table.add_column("Score", justify="right")
        for field, label in RUBRIC_DIMS:
            val = prof.get(field)
            score_str = str(val) if val is not None else "[dim]—[/]"
            table.add_row(label, score_str)
        console.print(table)
    else:
        console.print("[yellow]No profile yet. Run: pdna dna score --rubric[/]")

    if sonic:
        s = dict(sonic._mapping)
        dims = ["atmosphere", "warmth", "grit", "polish", "darkness", "brightness",
                "density", "space", "distortion", "synthetic_organic_balance"]
        table2 = Table(title="Sonic DNA")
        table2.add_column("Dimension")
        table2.add_column("Score", justify="right")
        for d in dims:
            val = s.get(d)
            table2.add_row(d.replace("_", " ").title(), str(val) if val else "[dim]—[/]")
        console.print(table2)


@dna_group.command("missing")
@click.pass_context
def dna_missing(ctx):
    """List producers with incomplete DNA profiles."""
    from sqlalchemy import create_engine, text
    engine = create_engine(ctx.obj["db_url"])
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT p.pdna_id, p.name, "
            "(SELECT COUNT(*) FROM producer_profiles pp WHERE pp.producer_id = p.id) as has_profile, "
            "(SELECT COUNT(*) FROM sonic_dna sd WHERE sd.producer_id = p.id) as has_sonic "
            "FROM producers p ORDER BY p.pdna_id"
        )).fetchall()

    table = Table(title="DNA Coverage")
    table.add_column("PDNA ID", style="cyan")
    table.add_column("Name")
    table.add_column("Profile", justify="center")
    table.add_column("Sonic DNA", justify="center")

    for row in rows:
        table.add_row(
            row[0], row[1],
            "[green]✓[/]" if row[2] else "[red]✗[/]",
            "[green]✓[/]" if row[3] else "[red]✗[/]",
        )
    console.print(table)
