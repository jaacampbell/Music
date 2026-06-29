import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# ensure pdna package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pdna.models.base import Base  # noqa: E402
# import all models so Base.metadata is populated
import pdna.models.producers  # noqa: F401, E402
import pdna.models.works  # noqa: F401, E402
import pdna.models.sources  # noqa: F401, E402
import pdna.models.gear  # noqa: F401, E402
import pdna.models.edges  # noqa: F401, E402
import pdna.models.taxonomy  # noqa: F401, E402
import pdna.models.dna.profiles  # noqa: F401, E402
import pdna.models.dna.sonic  # noqa: F401, E402
import pdna.models.dna.rhythmic  # noqa: F401, E402
import pdna.models.dna.melodic  # noqa: F401, E402
import pdna.models.dna.arrangement  # noqa: F401, E402
import pdna.models.dna.mixing  # noqa: F401, E402
import pdna.models.dna.sampling  # noqa: F401, E402
import pdna.models.dna.nuance  # noqa: F401, E402
import pdna.models.dna.creative  # noqa: F401, E402
import pdna.models.dna.warnings  # noqa: F401, E402
import pdna.models.dna.fusions  # noqa: F401, E402
import pdna.models.dna.prompts  # noqa: F401, E402

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# allow DATABASE_URL env var to override alembic.ini
database_url = os.environ.get("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=target_metadata,
        literal_binds=True, dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
