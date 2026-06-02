"""Application configuration loaded from environment variables."""

from functools import lru_cache
from typing import List, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the API.

    All values are read from environment variables. Sensible defaults are
    provided so a developer can run the app locally with `uvicorn app.main:app`
    against a SQLite database for quick iteration, but in production the
    `DATABASE_URL` env var is mandatory.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = Field(
        default="postgresql+psycopg://inventory:inventory@localhost:5432/inventory",
        description="SQLAlchemy database URL.",
    )
    # Read as a raw string from the env, then split to a list in the validator.
    # Pydantic-settings tries to JSON-decode List[...] values, which would fail
    # on a plain comma-separated env var.
    cors_origins: Union[str, List[str]] = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Comma-separated allowed CORS origins for the API.",
    )
    seed_on_start: bool = Field(
        default=False,
        description="If true, run a database seed when the API starts.",
    )
    log_level: str = Field(default="info")
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    api_title: str = Field(default="Inventory & Order Management API")
    api_version: str = Field(default="1.0.0")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, value):
        if isinstance(value, str):
            if not value:
                return []
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        return [o.strip() for o in (self.cors_origins or "").split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
