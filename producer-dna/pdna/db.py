from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator

from pdna.config import settings


def get_engine(url: str | None = None):
    return create_engine(url or settings.database_url, pool_pre_ping=True)


def get_session_factory(url: str | None = None):
    engine = get_engine(url)
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@contextmanager
def get_session(url: str | None = None) -> Generator[Session, None, None]:
    factory = get_session_factory(url)
    session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def create_all_tables(url: str | None = None):
    from pdna.models.base import Base
    import pdna.models.producers  # noqa: F401
    import pdna.models.works  # noqa: F401
    import pdna.models.sources  # noqa: F401
    import pdna.models.gear  # noqa: F401
    import pdna.models.edges  # noqa: F401
    import pdna.models.taxonomy  # noqa: F401
    import pdna.models.dna.profiles  # noqa: F401
    import pdna.models.dna.sonic  # noqa: F401
    import pdna.models.dna.rhythmic  # noqa: F401
    import pdna.models.dna.melodic  # noqa: F401
    import pdna.models.dna.arrangement  # noqa: F401
    import pdna.models.dna.mixing  # noqa: F401
    import pdna.models.dna.sampling  # noqa: F401
    import pdna.models.dna.nuance  # noqa: F401
    import pdna.models.dna.creative  # noqa: F401
    import pdna.models.dna.warnings  # noqa: F401
    import pdna.models.dna.fusions  # noqa: F401
    import pdna.models.dna.prompts  # noqa: F401

    engine = get_engine(url)
    Base.metadata.create_all(engine)
