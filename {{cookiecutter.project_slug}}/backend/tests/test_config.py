"""Configuration tests."""

from src.config import get_config, get_settings, AppConfig, ApiConfig


def test_get_config_returns_tuple() -> None:
    """Config returns expected tuple structure."""
    result = get_config()
    assert len(result) == 3
    assert isinstance(result[0], AppConfig)
    assert isinstance(result[1], ApiConfig)


def test_settings_has_defaults() -> None:
    """Settings has sensible defaults."""
    settings = get_settings()
    assert settings.secret_key is not None
    assert settings.frontend_url is not None


def test_api_config_port() -> None:
    """API config has correct port."""
    _, api_config, _ = get_config()
    assert api_config.port == {{ cookiecutter.backend_port }}
