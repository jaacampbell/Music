from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Stem Extraction API"
    debug: bool = False

    # Storage
    data_dir: Path = Path("/workspace/data")
    projects_dir: Path = Path("/workspace/data/projects")
    max_upload_mb: int = 500

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # Audio processing
    target_sample_rate: int = 44100
    target_bit_depth: int = 24
    default_separation_model: str = "htdemucs"
    default_separation_mode: str = "4stem"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

# Ensure data directories exist on import
settings.projects_dir.mkdir(parents=True, exist_ok=True)
