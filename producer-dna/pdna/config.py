from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://localhost/pdna_dev"
    test_database_url: str = "postgresql://localhost/pdna_test"
    mb_rate_limit: float = 1.0
    discogs_consumer_key: str = ""
    discogs_consumer_secret: str = ""
    discogs_token: str = ""
    pdna_cache_dir: Path = Path.home() / ".cache" / "pdna"
    log_level: str = "INFO"


settings = Settings()
