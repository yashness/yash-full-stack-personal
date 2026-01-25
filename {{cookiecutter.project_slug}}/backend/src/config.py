"""Configuration management using config.toml and environment variables."""

from functools import lru_cache
from pathlib import Path

import tomli
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class AppConfig(BaseModel):
    """Application settings from config.toml."""

    name: str = "{{ cookiecutter.project_name }}"
    version: str = "0.1.0"
    debug: bool = False


class ApiConfig(BaseModel):
    """API server settings from config.toml."""

    host: str = "0.0.0.0"
    port: int = {{ cookiecutter.backend_port }}
    reload: bool = False
    workers: int = 4
    cors_origins: list[str] = []


class LoggingConfig(BaseModel):
    """Logging settings from config.toml."""

    level: str = "INFO"
    format: str = "{time} | {level} | {message}"
    rotation: str = "1 day"
    retention: str = "30 days"


class Settings(BaseSettings):
    """Environment variables (secrets)."""

    secret_key: str = "change-me-in-production"
    database_url: str | None = None
    frontend_url: str = "https://{{ cookiecutter.project_slug }}.local"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def load_toml_config() -> dict:
    """Load configuration from config.toml."""
    config_path = Path(__file__).parent.parent / "config.toml"
    if config_path.exists():
        with open(config_path, "rb") as f:
            return tomli.load(f)
    return {}


@lru_cache
def get_config() -> tuple[AppConfig, ApiConfig, LoggingConfig]:
    """Get parsed configuration objects."""
    data = load_toml_config()
    return (
        AppConfig(**data.get("app", {})),
        ApiConfig(**data.get("api", {})),
        LoggingConfig(**data.get("logging", {})),
    )


@lru_cache
def get_settings() -> Settings:
    """Get environment settings (cached)."""
    return Settings()
