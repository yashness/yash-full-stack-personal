"""API endpoint tests."""

import pytest
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


def test_root_returns_welcome() -> None:
    """Root endpoint returns welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


def test_health_returns_healthy() -> None:
    """Health endpoint returns healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_hello_endpoint() -> None:
    """Hello endpoint returns message."""
    response = client.get("/api/v1/hello")
    assert response.status_code == 200
    assert "message" in response.json()
