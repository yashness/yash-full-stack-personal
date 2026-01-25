"""API endpoint tests."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from src.main import app

client = TestClient(app)


def test_root_returns_welcome() -> None:
    """Root endpoint returns welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


@patch("src.main.async_engine")
def test_health_returns_status(mock_engine: AsyncMock) -> None:
    """Health endpoint returns status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert "database" in response.json()
