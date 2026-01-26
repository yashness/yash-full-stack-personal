"""Database connection and session management.

Supports both MySQL (development) and PostgreSQL/Neon (production).
The database type is auto-detected from DATABASE_URL.
"""

import ssl
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    """SQLAlchemy declarative base."""

    pass


def get_database_url() -> str:
    """Get database URL from settings."""
    settings = get_settings()
    return settings.database_url


def get_async_database_url() -> str:
    """Convert sync URL to async URL.

    Supports:
    - MySQL: mysql:// -> mysql+aiomysql://
    - PostgreSQL: postgresql:// -> postgresql+asyncpg://
    - SQLite: sqlite:// -> sqlite+aiosqlite:// (for testing)

    Also removes sslmode from PostgreSQL URLs as asyncpg handles SSL differently.
    """
    url = get_database_url()

    # PostgreSQL (including Neon) - remove sslmode from query params
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        # Parse URL and remove sslmode (handled via connect_args)
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        query_params.pop("sslmode", None)
        new_query = urlencode(query_params, doseq=True)
        parsed = parsed._replace(query=new_query)
        url = urlunparse(parsed)

        # Replace scheme with async driver
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://")
        return url.replace("postgres://", "postgresql+asyncpg://")

    # MySQL
    if url.startswith("mysql://"):
        return url.replace("mysql://", "mysql+aiomysql://")

    # SQLite (for testing)
    if url.startswith("sqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://")

    # Return as-is if already has async driver
    return url


def get_engine_options() -> dict:
    """Get engine options based on database type."""
    url = get_database_url()

    options: dict = {
        "echo": False,
        "pool_pre_ping": True,
    }

    # PostgreSQL/Neon specific options
    if "postgresql" in url or "postgres" in url:
        # Check if sslmode=require is in the URL
        if "sslmode=require" in url or "neon.tech" in url:
            # Create SSL context for asyncpg
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            options["connect_args"] = {"ssl": ssl_context}

    return options


# Async engine for FastAPI
async_engine = create_async_engine(
    get_async_database_url(),
    **get_engine_options(),
)

AsyncSessionLocal = sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """Dependency for getting database session."""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    """Initialize database tables."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
