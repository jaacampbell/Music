import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from pdna.config import settings

TEST_DB_URL = settings.test_database_url


@pytest.fixture(scope="session")
def test_db_url():
    """Create test database and run migrations. Yields URL, drops DB after session."""
    import subprocess, os
    # Create test DB
    subprocess.run(
        ["psql", "-U", "root", "-h", "/var/run/postgresql", "-d", "postgres",
         "-c", f"DROP DATABASE IF EXISTS pdna_test"],
        capture_output=True,
    )
    subprocess.run(
        ["psql", "-U", "root", "-h", "/var/run/postgresql", "-d", "postgres",
         "-c", "CREATE DATABASE pdna_test"],
        capture_output=True,
        check=True,
    )
    env = {**os.environ, "DATABASE_URL": TEST_DB_URL}
    subprocess.run(["alembic", "upgrade", "head"], env=env, check=True, capture_output=True)
    yield TEST_DB_URL
    subprocess.run(
        ["psql", "-U", "root", "-h", "/var/run/postgresql", "-d", "postgres",
         "-c", "DROP DATABASE IF EXISTS pdna_test"],
        capture_output=True,
    )


@pytest.fixture
def session(test_db_url):
    """Provide a transactional session that rolls back after each test."""
    engine = create_engine(test_db_url)
    conn = engine.connect()
    trans = conn.begin()
    factory = sessionmaker(bind=conn)
    sess = factory()
    yield sess
    sess.close()
    trans.rollback()
    conn.close()


@pytest.fixture
def db_url(test_db_url):
    return test_db_url
