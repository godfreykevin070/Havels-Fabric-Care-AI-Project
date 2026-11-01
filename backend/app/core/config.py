"""Application configuration (env-driven)."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Fabric Care AI"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = "postgresql+psycopg2://fabric:fabric@localhost:5432/fabriccare"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:4173"]
    MODEL_DIR: str = "./artifacts"
    MIN_TRAINING_SAMPLES: int = 12
    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()