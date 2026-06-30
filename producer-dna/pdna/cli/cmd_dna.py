import json
import math
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

# ── Similarity engine ──────────────────────────────────────────────────────────

_SONIC_COLS = [
    "atmosphere", "warmth", "grit", "polish", "darkness", "brightness",
    "density", "space", "distortion", "synthetic_organic_balance",
]
_RHYTHMIC_COLS = ["swing", "grid_precision", "drum_density"]
_MELODIC_COLS = ["dissonance_level", "motif_complexity"]
_MIXING_COLS = ["loudness_level", "stereo_width", "reverb_use", "delay_use", "compression", "saturation"]
_RUBRIC_COLS = [f for f, _ in RUBRIC_DIMS]

DIM_SETS: dict[str, list[str]] = {
    "rubric": _RUBRIC_COLS,
    "sonic": _SONIC_COLS,
    "rhythmic": _RHYTHMIC_COLS,
    "all": _RUBRIC_COLS + _SONIC_COLS + _RHYTHMIC_COLS + _MELODIC_COLS + _MIXING_COLS,
}

_DIM_LABELS: dict[str, str] = {
    **{f: l for f, l in RUBRIC_DIMS},
    "atmosphere": "Atmosphere", "warmth": "Warmth", "grit": "Grit",
    "polish": "Polish", "darkness": "Darkness", "brightness": "Brightness",
    "density": "Density", "space": "Space", "distortion": "Distortion",
    "synthetic_organic_balance": "Synthetic/Organic",
    "swing": "Swing", "grid_precision": "Grid Precision", "drum_density": "Drum Density",
    "dissonance_level": "Dissonance", "motif_complexity": "Motif Complexity",
    "loudness_level": "Loudness", "stereo_width": "Stereo Width",
    "reverb_use": "Reverb", "delay_use": "Delay",
    "compression": "Compression", "saturation": "Saturation",
}

_VECTOR_SQL = (
    "SELECT p.pdna_id, p.name, "
    "pp.score_innovation, pp.score_influence, pp.score_technical_craft, "
    "pp.score_sonic_identity, pp.score_arrangement_skill, pp.score_rhythm_design, "
    "pp.score_melodic_harmonic, pp.score_sound_design, pp.score_mixing_aesthetics, "
    "pp.score_cultural_importance, pp.score_commercial_impact, pp.score_underground_impact, "
    "pp.score_longevity, pp.score_adaptability, pp.score_originality, "
    "sd.atmosphere, sd.warmth, sd.grit, sd.polish, sd.darkness, sd.brightness, "
    "sd.density, sd.space, sd.distortion, sd.synthetic_organic_balance, "
    "rd.swing, rd.grid_precision, rd.drum_density, "
    "mhd.dissonance_level, mhd.motif_complexity, "
    "md.loudness_level, md.stereo_width, md.reverb_use, md.delay_use, md.compression, md.saturation "
    "FROM producers p "
    "LEFT JOIN producer_profiles pp ON pp.producer_id = p.id "
    "LEFT JOIN sonic_dna sd ON sd.producer_id = p.id "
    "LEFT JOIN rhythmic_dna rd ON rd.producer_id = p.id "
    "LEFT JOIN melodic_harmonic_dna mhd ON mhd.producer_id = p.id "
    "LEFT JOIN mixing_dna md ON md.producer_id = p.id "
    "ORDER BY p.pdna_id"
)


def load_dna_vectors(conn) -> dict[str, dict]:
    """Return {pdna_id: {"name": str, "dims": {col: value}}} for all producers."""
    from sqlalchemy import text
    rows = conn.execute(text(_VECTOR_SQL)).fetchall()
    result: dict[str, dict] = {}
    for row in rows:
        r = dict(row._mapping)
        pid = r.pop("pdna_id")
        name = r.pop("name")
        result[pid] = {"name": name, "dims": r}
    return result


def euclidean_distance(vec_a: dict, vec_b: dict, dims: list[str]) -> float:
    """Euclidean distance over the given dimension columns (skips None values)."""
    total = 0.0
    for d in dims:
        a, b = vec_a.get(d), vec_b.get(d)
        if a is not None and b is not None:
            total += (a - b) ** 2
    return math.sqrt(total)


def top_diverging(vec_a: dict, vec_b: dict, dims: list[str], n: int = 3) -> list[tuple]:
    """Return the n dimensions with the largest absolute score difference."""
    diffs = []
    for d in dims:
        a, b = vec_a.get(d), vec_b.get(d)
        if a is not None and b is not None and a != b:
            diffs.append((abs(a - b), d, int(a), int(b)))
    diffs.sort(reverse=True)
    return [(d, a, b) for _, d, a, b in diffs[:n]]


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
        pid = p[0]

        profile = conn.execute(
            text("SELECT * FROM producer_profiles WHERE producer_id = :pid"), {"pid": pid}
        ).fetchone()
        sonic = conn.execute(
            text("SELECT * FROM sonic_dna WHERE producer_id = :pid"), {"pid": pid}
        ).fetchone()
        rhythmic = conn.execute(
            text("SELECT * FROM rhythmic_dna WHERE producer_id = :pid"), {"pid": pid}
        ).fetchone()
        melodic = conn.execute(
            text("SELECT * FROM melodic_harmonic_dna WHERE producer_id = :pid"), {"pid": pid}
        ).fetchone()
        arrangement = conn.execute(
            text("SELECT * FROM arrangement_dna WHERE producer_id = :pid"), {"pid": pid}
        ).fetchone()
        mixing = conn.execute(
            text("SELECT * FROM mixing_dna WHERE producer_id = :pid"), {"pid": pid}
        ).fetchone()
        sampling = conn.execute(
            text("SELECT * FROM sampling_dna WHERE producer_id = :pid"), {"pid": pid}
        ).fetchone()
        nuance = conn.execute(
            text("SELECT * FROM style_nuance_map WHERE producer_id = :pid"), {"pid": pid}
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
        t = Table(title="Sonic DNA")
        t.add_column("Dimension")
        t.add_column("Score", justify="right")
        for d in ["atmosphere", "warmth", "grit", "polish", "darkness", "brightness",
                  "density", "space", "distortion", "synthetic_organic_balance"]:
            val = s.get(d)
            t.add_row(d.replace("_", " ").title(), str(val) if val is not None else "[dim]—[/]")
        if s.get("notes"):
            t.add_row("[dim]Notes[/]", f"[dim]{s['notes']}[/]")
        console.print(t)

    if rhythmic:
        r = dict(rhythmic._mapping)
        t = Table(title="Rhythmic DNA")
        t.add_column("Dimension")
        t.add_column("Value", justify="right")
        for d, label in [("swing", "Swing"), ("grid_precision", "Grid Precision"),
                         ("drum_density", "Drum Density")]:
            val = r.get(d)
            t.add_row(label, str(val) if val is not None else "[dim]—[/]")
        for d, label in [("groove_family", "Groove Family"), ("kick_language", "Kick"),
                         ("snare_language", "Snare"), ("hat_language", "Hi-Hat")]:
            val = r.get(d)
            if val:
                t.add_row(label, val)
        if r.get("tempo_min") or r.get("tempo_max"):
            t.add_row("Tempo", f"{r.get('tempo_min', '?')}–{r.get('tempo_max', '?')} BPM")
        console.print(t)

    if melodic:
        m = dict(melodic._mapping)
        t = Table(title="Melodic/Harmonic DNA")
        t.add_column("Dimension")
        t.add_column("Value", justify="right")
        for d, label in [("dissonance_level", "Dissonance"), ("motif_complexity", "Motif Complexity")]:
            val = m.get(d)
            t.add_row(label, str(val) if val is not None else "[dim]—[/]")
        for d, label in [("chord_mood", "Chord Mood"), ("modality", "Modality"), ("tonal_center", "Tonal Center")]:
            val = m.get(d)
            if val:
                t.add_row(label, val)
        infl = m.get("influences_list")
        if infl:
            t.add_row("Influences", ", ".join(infl))
        console.print(t)

    if arrangement:
        a = dict(arrangement._mapping)
        t = Table(title="Arrangement DNA")
        t.add_column("Dimension")
        t.add_column("Value", justify="right")
        for d, label in [("loop_evolution", "Loop Evolution"), ("tension_release", "Tension/Release"),
                         ("structural_complexity", "Structural Complexity")]:
            val = a.get(d)
            t.add_row(label, str(val) if val is not None else "[dim]—[/]")
        for d, label in [("intro_style", "Intro Style"), ("drop_behavior", "Drop Behavior"),
                         ("transition_style", "Transitions")]:
            val = a.get(d)
            if val:
                t.add_row(label, val)
        console.print(t)

    if mixing:
        mx = dict(mixing._mapping)
        t = Table(title="Mixing DNA")
        t.add_column("Dimension")
        t.add_column("Value", justify="right")
        for d, label in [("loudness_level", "Loudness"), ("stereo_width", "Stereo Width"),
                         ("reverb_use", "Reverb"), ("delay_use", "Delay"),
                         ("compression", "Compression"), ("saturation", "Saturation")]:
            val = mx.get(d)
            t.add_row(label, str(val) if val is not None else "[dim]—[/]")
        for d, label in [("low_end_approach", "Low End"), ("vocal_placement", "Vocal Placement")]:
            val = mx.get(d)
            if val:
                t.add_row(label, val)
        console.print(t)

    if sampling:
        sa = dict(sampling._mapping)
        t = Table(title="Sampling DNA")
        t.add_column("Dimension")
        t.add_column("Value", justify="right")
        for d, label in [("pitch_shifting", "Pitch Shifting"), ("filtering", "Filtering")]:
            val = sa.get(d)
            t.add_row(label, str(val) if val is not None else "[dim]—[/]")
        trad = sa.get("source_traditions")
        if trad:
            t.add_row("Source Traditions", ", ".join(trad))
        for d, label in [("clearance_rate", "Clearance Rate"), ("chopping_style", "Chopping Style"),
                         ("looping_style", "Looping Style")]:
            val = sa.get(d)
            if val:
                t.add_row(label, val)
        console.print(t)

    if nuance:
        n = dict(nuance._mapping)
        if n.get("producer_ear"):
            console.print(Panel(n["producer_ear"], title="Producer Ear"))
        if n.get("casual_listener"):
            console.print(Panel(n["casual_listener"], title="Casual Listener"))


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


@dna_group.command("similar")
@click.argument("pdna_id")
@click.option("--n", default=5, show_default=True, help="Number of results")
@click.option(
    "--dims",
    default="all",
    type=click.Choice(list(DIM_SETS.keys())),
    show_default=True,
    help="Dimension set used for distance calculation",
)
@click.pass_context
def dna_similar(ctx, pdna_id, n, dims):
    """Rank all producers by DNA distance to PDNA_ID."""
    from sqlalchemy import create_engine
    engine = create_engine(ctx.obj["db_url"])

    with engine.connect() as conn:
        vectors = load_dna_vectors(conn)

    if pdna_id not in vectors:
        console.print(f"[red]Producer {pdna_id} not found.[/]")
        return

    target = vectors[pdna_id]
    dim_cols = DIM_SETS[dims]

    ranked = []
    for other_id, other in vectors.items():
        if other_id == pdna_id:
            continue
        dist = euclidean_distance(target["dims"], other["dims"], dim_cols)
        diverge = top_diverging(target["dims"], other["dims"], dim_cols, n=3)
        ranked.append((dist, other_id, other["name"], diverge))
    ranked.sort(key=lambda x: x[0])

    table = Table(
        title=f"Most similar to [cyan]{pdna_id}[/] — {target['name']}  (dims: {dims})"
    )
    table.add_column("Rank", justify="right", style="dim")
    table.add_column("PDNA ID", style="cyan")
    table.add_column("Name")
    table.add_column("Distance", justify="right")
    table.add_column("Top differences")

    for rank, (dist, other_id, name, diverge) in enumerate(ranked[:n], 1):
        diff_str = "  ".join(
            f"{_DIM_LABELS.get(d, d)} {a}→{b}" for d, a, b in diverge
        )
        table.add_row(str(rank), other_id, name, f"{dist:.2f}", diff_str or "—")

    console.print(table)


@dna_group.command("warnings")
@click.argument("pdna_id")
@click.pass_context
def dna_warnings(ctx, pdna_id):
    """Display originality warnings for a producer (what NOT to copy)."""
    from sqlalchemy import create_engine, text
    engine = create_engine(ctx.obj["db_url"])

    with engine.connect() as conn:
        p = conn.execute(
            text("SELECT id, name FROM producers WHERE pdna_id = :id"), {"id": pdna_id}
        ).fetchone()
        if not p:
            console.print(f"[red]Producer {pdna_id} not found.[/]")
            return
        pid = p[0]

        rows = conn.execute(
            text(
                "SELECT warning_type, severity, description "
                "FROM originality_warnings WHERE producer_id = :pid "
                "ORDER BY CASE severity WHEN 'major' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END"
            ),
            {"pid": pid},
        ).fetchall()

    if not rows:
        console.print(f"[yellow]No originality warnings for {pdna_id}.[/]")
        return

    _SEV_COLOR = {"major": "red", "moderate": "yellow", "minor": "dim"}

    table = Table(title=f"Originality Warnings — {pdna_id}  {p[1]}")
    table.add_column("Warning Type")
    table.add_column("Severity", justify="center")
    table.add_column("Description")

    for row in rows:
        wtype, severity, desc = row[0], row[1], row[2]
        color = _SEV_COLOR.get(severity, "white")
        table.add_row(
            wtype.replace("_", " ").title(),
            f"[{color}]{severity}[/]",
            desc,
        )
    console.print(table)


def lookup_fusion(conn, primary_id: int, secondary_id: int):
    """Return a seeded fusion row for (primary, secondary) or None."""
    from sqlalchemy import text
    return conn.execute(
        text(
            "SELECT fusion_description, creative_prompt, secondary_element "
            "FROM fusion_paths "
            "WHERE primary_producer_id = :pid AND secondary_producer_id = :sid"
        ),
        {"pid": primary_id, "sid": secondary_id},
    ).fetchone()


@dna_group.command("fusion")
@click.argument("pdna_id_a")
@click.argument("pdna_id_b")
@click.pass_context
def dna_fusion(ctx, pdna_id_a, pdna_id_b):
    """Show pre-seeded fusion for two producers, or fall back to distance analysis."""
    from sqlalchemy import create_engine, text
    engine = create_engine(ctx.obj["db_url"])

    with engine.connect() as conn:
        pa = conn.execute(
            text("SELECT id, name FROM producers WHERE pdna_id = :id"), {"id": pdna_id_a}
        ).fetchone()
        pb = conn.execute(
            text("SELECT id, name FROM producers WHERE pdna_id = :id"), {"id": pdna_id_b}
        ).fetchone()
        if not pa:
            console.print(f"[red]Producer {pdna_id_a} not found.[/]")
            return
        if not pb:
            console.print(f"[red]Producer {pdna_id_b} not found.[/]")
            return

        fusion = lookup_fusion(conn, pa[0], pb[0])

        if fusion:
            console.print(f"\n[bold cyan]{pdna_id_a} {pa[1]}[/]  ×  [bold cyan]{pdna_id_b} {pb[1]}[/]")
            console.print(Panel(fusion[0], title="Fusion Description"))
            if fusion[1]:
                console.print(Panel(fusion[1], title="Creative Prompt"))
            return

        # Fallback: distance-based output
        vectors = load_dna_vectors(conn)

    if pdna_id_a not in vectors or pdna_id_b not in vectors:
        console.print("[yellow]DNA vectors not available for one or both producers.[/]")
        return

    dim_cols = DIM_SETS["all"]
    a, b = vectors[pdna_id_a], vectors[pdna_id_b]
    dist = euclidean_distance(a["dims"], b["dims"], dim_cols)
    diverge = top_diverging(a["dims"], b["dims"], dim_cols, n=3)

    console.print(f"\n[bold cyan]{pdna_id_a} {pa[1]}[/]  ×  [bold cyan]{pdna_id_b} {pb[1]}[/]")
    console.print(f"[yellow]No pre-seeded fusion — distance-based analysis:[/]")
    console.print(f"DNA distance (all dims): [bold]{dist:.2f}[/]")

    if diverge:
        t = Table(title="Top diverging dimensions")
        t.add_column("Dimension")
        t.add_column(pa[1], justify="right")
        t.add_column(pb[1], justify="right")
        t.add_column("Δ", justify="right")
        for dim, va, vb in diverge:
            label = _DIM_LABELS.get(dim, dim.replace("_", " ").title())
            delta = vb - va
            delta_str = f"[green]+{delta}[/]" if delta > 0 else f"[red]{delta}[/]"
            t.add_row(label, str(va), str(vb), delta_str)
        console.print(t)

    console.print(Panel(
        f"Try combining {pa[1]}'s approach with {pb[1]}'s approach.\n"
        f"Focus on the {diverge[0][0].replace('_', ' ')} dimension gap ({diverge[0][1]} vs {diverge[0][2]}) "
        f"as the productive creative tension." if diverge else
        f"Try combining {pa[1]}'s approach with {pb[1]}'s approach.",
        title="Fusion Suggestion",
    ))


@dna_group.command("fusions")
@click.argument("pdna_id")
@click.pass_context
def dna_fusions_list(ctx, pdna_id):
    """List all pre-seeded fusions where PDNA_ID is the primary producer."""
    from sqlalchemy import create_engine, text
    engine = create_engine(ctx.obj["db_url"])

    with engine.connect() as conn:
        p = conn.execute(
            text("SELECT id, name FROM producers WHERE pdna_id = :id"), {"id": pdna_id}
        ).fetchone()
        if not p:
            console.print(f"[red]Producer {pdna_id} not found.[/]")
            return

        rows = conn.execute(
            text(
                "SELECT fp.secondary_element, fp.fusion_description, "
                "fp.creative_prompt IS NOT NULL as has_prompt, "
                "p2.pdna_id as secondary_pdna_id "
                "FROM fusion_paths fp "
                "LEFT JOIN producers p2 ON p2.id = fp.secondary_producer_id "
                "WHERE fp.primary_producer_id = :pid "
                "ORDER BY fp.secondary_element"
            ),
            {"pid": p[0]},
        ).fetchall()

    if not rows:
        console.print(f"[yellow]No fusion paths seeded for {pdna_id}.[/]")
        return

    table = Table(title=f"Fusion Paths — {pdna_id}  {p[1]}")
    table.add_column("Secondary Element")
    table.add_column("PDNA ID", style="cyan")
    table.add_column("Description (preview)")
    table.add_column("Prompt?", justify="center")

    for row in rows:
        desc_preview = (row[1][:80] + "…") if row[1] and len(row[1]) > 80 else (row[1] or "")
        table.add_row(
            row[0],
            row[3] or "[dim]—[/]",
            desc_preview,
            "[green]✓[/]" if row[2] else "[dim]—[/]",
        )
    console.print(table)


@dna_group.command("compare")
@click.argument("pdna_id_a")
@click.argument("pdna_id_b")
@click.option(
    "--dims",
    default="all",
    type=click.Choice(list(DIM_SETS.keys())),
    show_default=True,
)
@click.pass_context
def dna_compare(ctx, pdna_id_a, pdna_id_b, dims):
    """Side-by-side DNA comparison of two producers."""
    from sqlalchemy import create_engine
    engine = create_engine(ctx.obj["db_url"])

    with engine.connect() as conn:
        vectors = load_dna_vectors(conn)

    for pid in (pdna_id_a, pdna_id_b):
        if pid not in vectors:
            console.print(f"[red]Producer {pid} not found.[/]")
            return

    a, b = vectors[pdna_id_a], vectors[pdna_id_b]
    dim_cols = DIM_SETS[dims]
    dist = euclidean_distance(a["dims"], b["dims"], dim_cols)

    table = Table(
        title=f"[cyan]{a['name']}[/] vs [cyan]{b['name']}[/]  distance: {dist:.2f} (dims: {dims})"
    )
    table.add_column("Dimension")
    table.add_column(f"{pdna_id_a} {a['name']}", justify="right")
    table.add_column(f"{pdna_id_b} {b['name']}", justify="right")
    table.add_column("Δ", justify="right")

    for d in dim_cols:
        va, vb = a["dims"].get(d), b["dims"].get(d)
        if va is None and vb is None:
            continue
        label = _DIM_LABELS.get(d, d.replace("_", " ").title())
        va_str = str(va) if va is not None else "[dim]—[/]"
        vb_str = str(vb) if vb is not None else "[dim]—[/]"
        if va is not None and vb is not None:
            delta = vb - va
            if delta > 0:
                delta_str = f"[green]+{delta}[/]"
            elif delta < 0:
                delta_str = f"[red]{delta}[/]"
            else:
                delta_str = "[dim]0[/]"
        else:
            delta_str = "[dim]—[/]"
        table.add_row(label, va_str, vb_str, delta_str)

    console.print(table)
