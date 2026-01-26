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
    database_url: str = "mysql://user:password@db:3306/{{ cookiecutter.project_slug | replace('-', '_') }}"
    frontend_url: str = "https://{{ cookiecutter.project_slug }}.dev.test"

    # Clerk authentication (optional - run `bun run setup:clerk` in frontend first)
    clerk_secret_key: str = ""
    clerk_webhook_secret: str = ""

    # Claude Agent SDK settings (for Copilot UI)
    # These are read by claude-agent-sdk for Azure Foundry or direct API
    anthropic_api_key: str = ""  # For direct Anthropic API
    claude_code_use_foundry: str = ""  # Set to "1" for Azure Foundry
    anthropic_foundry_resource: str = ""  # Azure Foundry resource name
    anthropic_foundry_api_key: str = ""  # Azure Foundry API key

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra env vars not defined in the model


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
