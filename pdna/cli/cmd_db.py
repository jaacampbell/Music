import subprocess
import sys
import click
from rich.console import Console
from rich.table import Table

console = Console()


@click.group(name="db")
def db_group():
    """Database management: init, migrate, status, seed."""
    pass


@db_group.command("init")
@click.pass_context
def db_init(ctx):
    """Create the database and run all migrations."""
    db_url = ctx.obj["db_url"]
    console.print("[bold green]Running migrations...[/]")
    env = {"DATABASE_URL": db_url}
    import os
    full_env = {**os.environ, **env}
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        env=full_env,
        capture_output=False,
    )
    if result.returncode == 0:
        console.print("[bold green]✓ Database initialized successfully.[/]")
    else:
        console.print("[bold red]✗ Migration failed.[/]", style="red")
        sys.exit(1)


@db_group.command("migrate")
@click.pass_context
def db_migrate(ctx):
    """Run any pending Alembic migrations."""
    ctx.invoke(db_init)


@db_group.command("status")
@click.pass_context
def db_status(ctx):
    """Show current migration revision and pending migrations."""
    import os
    db_url = ctx.obj["db_url"]
    env = {**os.environ, "DATABASE_URL": db_url}
    console.print("[bold]Current revision:[/]")
    subprocess.run(["alembic", "current"], env=env)
    console.print("\n[bold]History:[/]")
    subprocess.run(["alembic", "history", "--verbose"], env=env)


@db_group.command("seed")
@click.option("--batch", required=True, help="Path to seed directory")
@click.pass_context
def db_seed(ctx, batch):
    """Load a batch seed directory into the database."""
    console.print(f"[yellow]Batch seeding from [bold]{batch}[/] is handled via migrations.[/]")
    console.print("Run [bold]pdna db init[/] to apply all seeds via migration 0003.")
