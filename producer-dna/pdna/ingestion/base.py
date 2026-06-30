import time
from abc import ABC, abstractmethod
from pathlib import Path

import requests
import requests_cache
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from rich.console import Console

console = Console()


class BaseIngestor(ABC):
    RATE_LIMIT_DELAY: float = 1.0
    CACHE_EXPIRY: int = 86400 * 7  # 7 days

    def __init__(self, cache_dir: Path):
        self.cache_dir = Path(cache_dir).expanduser()
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._last_call: float = 0.0

        cache_name = str(self.cache_dir / self.__class__.__name__.lower())
        requests_cache.install_cache(
            cache_name,
            expire_after=self.CACHE_EXPIRY,
            allowable_codes=(200,),
        )

    def _throttle(self):
        elapsed = time.monotonic() - self._last_call
        if elapsed < self.RATE_LIMIT_DELAY:
            time.sleep(self.RATE_LIMIT_DELAY - elapsed)
        self._last_call = time.monotonic()

    @retry(
        retry=retry_if_exception_type(requests.HTTPError),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(4),
    )
    def fetch_json(self, url: str, **kwargs) -> dict:
        self._throttle()
        resp = requests.get(url, timeout=30, **kwargs)
        resp.raise_for_status()
        return resp.json()

    def _get_producer_row(self, pdna_id: str, db_url: str) -> dict | None:
        from sqlalchemy import create_engine, text
        engine = create_engine(db_url)
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT * FROM producers WHERE pdna_id = :id"), {"id": pdna_id}
            ).fetchone()
        return dict(row._mapping) if row else None

    @abstractmethod
    def ingest(self, pdna_id: str, db_url: str, dry_run: bool = False) -> None:
        """Ingest data for the given producer from the external source."""
