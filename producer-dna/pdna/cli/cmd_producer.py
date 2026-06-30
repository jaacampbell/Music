import json
from pathlib import Path
from typing import Optional

import click
import yaml
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()


@click.group(name="producer")
def producer_group():
    """Producer management: add, get, search, list, link."""
    pass


@producer_group.command("search")
@click.argument("query", required=False)
@click.option("--country", default=None, help="Filter by ISO 3166-1 alpha-2 country code")
@click.option("--scene", default=None, help="Filter by primary scene/genre code")
@click.option("--era", default=None, help="Filter by era code (e.g. daw_early)")
@click.option("--active-from", "active_from", type=int, default=None)
@click.option("--active-to", "active_to", type=int, default=None)
@click.option("--limit", default=20, show_default=True)
@click.option("--offset", default=0, show_default=True)
@click.pass_context
def producer_search(ctx, query, country, scene, era, active_from, active_to, limit, offset):
    """Search producers by name (full-text) and/or filter by attributes."""
    from sqlalchemy import create_engine, text
    engine = create_engine(ctx.obj["db_url"])
    with engine.connect() as conn:
        conditions = []
        params: dict = {"limit": limit, "offset": offset}

        if query:
            conditions.append(
                "(search_vector @@ plainto_tsquery('english', :query) OR "
                "name ILIKE :name_like)"
            )
            params["query"] = query
            params["name_like"] = f"%{query}%"
        if country:
            conditions.append("country = :country")
            params["country"] = country.upper()
        if scene:
            conditions.append("primary_scenes ? :scene")
            params["scene"] = scene
        if active_from:
            conditions.append("active_from >= :active_from")
            params["active_from"] = active_from
        if active_to:
            conditions.append("(active_to <= :active_to OR active_to IS NULL)")
            params["active_to"] = active_to

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = text(
            f"SELECT pdna_id, name, country, active_from, active_to, primary_scenes "
            f"FROM producers {where} ORDER BY pdna_id LIMIT :limit OFFSET :offset"
        )
        rows = conn.execute(sql, params).fetchall()

    if not rows:
        console.print("[yellow]No producers found.[/]")
        return

    table = Table(title=f"Producers ({len(rows)} results)")
    table.add_column("PDNA ID", style="cyan")
    table.add_column("Name", style="bold")
    table.add_column("Country")
    table.add_column("Active")
    table.add_column("Scenes")

    for row in rows:
        pdna_id, name, country_code, a_from, a_to, scenes = row
        active_str = f"{a_from or '?'}–{a_to or 'now'}"
        scenes_str = ", ".join(scenes[:3]) if scenes else ""
        table.add_row(pdna_id, name, country_code or "", active_str, scenes_str)

    console.print(table)


@producer_group.command("get")
@click.argument("pdna_id")
@click.pass_context
def producer_get(ctx, pdna_id):
    """Show full profile for a producer by PDNA ID."""
    from sqlalchemy import create_engine, text
    engine = create_engine(ctx.obj["db_url"])
    with engine.connect() as conn:
        p = conn.execute(
            text("SELECT * FROM producers WHERE pdna_id = :id"), {"id": pdna_id}
        ).fetchone()
        if not p:
            console.print(f"[red]Producer {pdna_id} not found.[/]")
            return

        p = dict(p._mapping)
        aliases = conn.execute(
            text("SELECT alias, alias_type FROM producer_aliases WHERE producer_id = :id ORDER BY alias"),
            {"id": p["id"]},
        ).fetchall()
        credits = conn.execute(
            text(
                "SELECT w.title, w.artist, w.release_year, c.role, c.confidence "
                "FROM credits c JOIN works w ON c.work_id = w.id "
                "WHERE c.producer_id = :id ORDER BY w.release_year DESC LIMIT 20"
            ),
            {"id": p["id"]},
        ).fetchall()
        profile = conn.execute(
            text("SELECT * FROM producer_profiles WHERE producer_id = :id"), {"id": p["id"]}
        ).fetchone()

    lines = [
        f"[bold cyan]{p['pdna_id']}[/]  [bold]{p['name']}[/]",
        f"Real name: {p['real_name'] or '—'}",
        f"Country: {p['country'] or '—'}  City: {p['city'] or '—'}",
        f"Active: {p['active_from'] or '?'}–{p['active_to'] or 'now'}",
        f"MusicBrainz: {p['musicbrainz_id'] or '—'}",
        f"Wikidata: {p['wikidata_id'] or '—'}",
        f"Discogs: {p['discogs_id'] or '—'}",
    ]

    if aliases:
        lines.append("\n[bold]Aliases:[/]  " + " · ".join(f"{a[0]} ({a[1]})" for a in aliases))

    if p.get("notes"):
        lines.append(f"\n[bold]Notes:[/] {p['notes']}")

    if credits:
        lines.append("\n[bold]Key works:[/]")
        for c in credits[:10]:
            conf = f"[{c[3]}/{c[4]}]"
            lines.append(f"  {c[2] or '?'} — {c[1] or '?'} — {c[0]}  {conf}")

    if profile:
        prof = dict(profile._mapping)
        if prof.get("dna_summary"):
            lines.append(f"\n[bold]DNA Summary:[/]\n{prof['dna_summary']}")

    console.print(Panel("\n".join(lines), title="Producer Profile", expand=False))


@producer_group.command("list")
@click.option("--limit", default=50, show_default=True)
@click.option("--offset", default=0, show_default=True)
@click.pass_context
def producer_list(ctx, limit, offset):
    """List producers."""
    ctx.invoke(producer_search, query=None, country=None, scene=None, era=None,
               active_from=None, active_to=None, limit=limit, offset=offset)


@producer_group.command("add")
@click.option("--yaml", "yaml_file", required=True, type=click.Path(exists=True),
              help="YAML file containing producer data")
@click.pass_context
def producer_add(ctx, yaml_file):
    """Add a producer from a YAML file."""
    from pdna.schemas.producer import ProducerSchema
    from sqlalchemy import create_engine, text
    import json

    with open(yaml_file) as f:
        raw = yaml.safe_load(f)

    schema = ProducerSchema(**raw)
    engine = create_engine(ctx.obj["db_url"])
    with engine.connect() as conn:
        with conn.begin():
            result = conn.execute(
                text(
                    "INSERT INTO producers (pdna_id, name, real_name, country, city, region, "
                    "active_from, active_to, is_active, official_links, primary_scenes, "
                    "musicbrainz_id, wikidata_id, discogs_id, notes) "
                    "VALUES (:pdna_id, :name, :real_name, :country, :city, :region, "
                    ":active_from, :active_to, :is_active, "
                    "CAST(:official_links AS JSONB), CAST(:primary_scenes AS JSONB), "
                    ":musicbrainz_id, :wikidata_id, :discogs_id, :notes) "
                    "ON CONFLICT (pdna_id) DO NOTHING RETURNING id"
                ),
                {
                    "pdna_id": schema.pdna_id,
                    "name": schema.name,
                    "real_name": schema.real_name,
                    "country": schema.country,
                    "city": schema.city,
                    "region": schema.region,
                    "active_from": schema.active_from,
                    "active_to": schema.active_to,
                    "is_active": schema.is_active,
                    "official_links": json.dumps([l.model_dump() for l in schema.official_links]),
                    "primary_scenes": json.dumps(schema.primary_scenes),
                    "musicbrainz_id": schema.musicbrainz_id,
                    "wikidata_id": schema.wikidata_id,
                    "discogs_id": schema.discogs_id,
                    "notes": schema.notes,
                },
            )
            row = result.fetchone()
            if not row:
                console.print(f"[yellow]Producer {schema.pdna_id} already exists.[/]")
                return
            db_id = row[0]
            for alias in schema.aliases:
                conn.execute(
                    text(
                        "INSERT INTO producer_aliases (producer_id, alias, alias_type) "
                        "VALUES (:pid, :alias, :alias_type) ON CONFLICT DO NOTHING"
                    ),
                    {"pid": db_id, "alias": alias.alias, "alias_type": alias.alias_type},
                )
    console.print(f"[green]✓ Added {schema.pdna_id}: {schema.name}[/]")


@producer_group.command("graph")
@click.argument("pdna_id")
@click.option(
    "--depth",
    default=1,
    show_default=True,
    help="How many hops to traverse (1 = direct connections only)",
)
@click.option(
    "--dir",
    "direction",
    default="both",
    type=click.Choice(["influences", "influenced-by", "both"]),
    show_default=True,
    help="Edge direction to display",
)
@click.pass_context
def producer_graph(ctx, pdna_id, depth, direction):
    """Display influence graph for a producer."""
    from sqlalchemy import create_engine, text

    engine = create_engine(ctx.obj["db_url"])
    with engine.connect() as conn:
        root = conn.execute(
            text("SELECT id, name FROM producers WHERE pdna_id = :id"), {"id": pdna_id}
        ).fetchone()
        if not root:
            console.print(f"[red]Producer {pdna_id} not found.[/]")
            return
        root_db_id, root_name = root[0], root[1]

        def _fetch_outgoing(prod_id):
            return conn.execute(
                text(
                    "SELECT p.pdna_id, p.name, ie.strength, ie.confidence "
                    "FROM influence_edges ie "
                    "JOIN producers p ON ie.to_producer_id = p.id "
                    "WHERE ie.from_producer_id = :pid AND ie.direction = 'influenced' "
                    "ORDER BY ie.strength DESC NULLS LAST"
                ),
                {"pid": prod_id},
            ).fetchall()

        def _fetch_incoming(prod_id):
            return conn.execute(
                text(
                    "SELECT p.pdna_id, p.name, ie.strength, ie.confidence "
                    "FROM influence_edges ie "
                    "JOIN producers p ON ie.from_producer_id = p.id "
                    "WHERE ie.to_producer_id = :pid AND ie.direction = 'influenced' "
                    "ORDER BY ie.strength DESC NULLS LAST"
                ),
                {"pid": prod_id},
            ).fetchall()

        console.print(f"\n[bold cyan]{pdna_id}[/]  [bold]{root_name}[/]\n")

        if direction in ("influenced-by", "both"):
            incoming = _fetch_incoming(root_db_id)
            if incoming:
                console.print(f"[bold]{root_name}[/] ← [dim]influenced by:[/]")
                for row in incoming:
                    strength_str = f"  strength {row[2]}" if row[2] else ""
                    console.print(f"  └─ [cyan]{row[0]}[/] {row[1]}{strength_str}  [dim][{row[3]}][/]")
            else:
                console.print("[dim]  (no incoming influences in database)[/]")

        if direction in ("influences", "both"):
            outgoing = _fetch_outgoing(root_db_id)
            if outgoing:
                console.print(f"\n[bold]{root_name}[/] → [dim]influenced:[/]")
                for row in outgoing:
                    strength_str = f"  strength {row[2]}" if row[2] else ""
                    console.print(f"  └─ [cyan]{row[0]}[/] {row[1]}{strength_str}  [dim][{row[3]}][/]")
            else:
                console.print("[dim]  (no outgoing influences in database)[/]")

        console.print()


@producer_group.command("link")
@click.argument("pdna_id")
@click.option("--mb-id", default=None, help="MusicBrainz artist ID (UUID)")
@click.option("--discogs-id", type=int, default=None, help="Discogs artist ID")
@click.option("--wd-id", default=None, help="Wikidata entity ID (e.g. Q7504)")
@click.pass_context
def producer_link(ctx, pdna_id, mb_id, discogs_id, wd_id):
    """Link a producer to external database IDs."""
    from sqlalchemy import create_engine, text
    updates = {}
    if mb_id:
        updates["musicbrainz_id"] = mb_id
    if discogs_id:
        updates["discogs_id"] = discogs_id
    if wd_id:
        updates["wikidata_id"] = wd_id
    if not updates:
        console.print("[yellow]No IDs specified.[/]")
        return

    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["pdna_id"] = pdna_id
    engine = create_engine(ctx.obj["db_url"])
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(
                text(f"UPDATE producers SET {set_clause} WHERE pdna_id = :pdna_id"),
                updates,
            )
    console.print(f"[green]✓ Updated external IDs for {pdna_id}.[/]")
