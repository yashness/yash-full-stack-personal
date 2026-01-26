"""Database migration utilities.

This module provides functions to run Alembic migrations programmatically,
useful for running migrations on application startup.
"""

import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from loguru import logger


def get_alembic_config() -> Config:
    """Get Alembic configuration."""
    # Find the alembic.ini file
    backend_dir = Path(__file__).parent.parent
    alembic_ini = backend_dir / "alembic.ini"

    if not alembic_ini.exists():
        raise FileNotFoundError(f"alembic.ini not found at {alembic_ini}")

    config = Config(str(alembic_ini))

    # Set the script location relative to backend dir
    config.set_main_option("script_location", str(backend_dir / "alembic"))

    return config


def run_migrations() -> None:
    """Run all pending migrations synchronously.

    This function runs `alembic upgrade head` to apply all pending migrations.
    It's designed to be called OUTSIDE of async context (e.g., in CLI or startup scripts).

    For async context, use run_migrations_async() instead.
    """
    try:
        logger.info("Checking for pending database migrations...")
        config = get_alembic_config()
        command.upgrade(config, "head")
        logger.info("Database migrations completed successfully")
    except Exception as e:
        logger.error(f"Failed to run database migrations: {e}")
        raise


def run_migrations_sync_in_thread() -> None:
    """Run migrations in a separate thread to avoid async event loop conflicts.

    This is the safe way to run migrations from an async context like FastAPI startup.
    """
    import concurrent.futures
    import threading

    def _run():
        try:
            logger.info("Checking for pending database migrations...")
            config = get_alembic_config()
            command.upgrade(config, "head")
            logger.info("Database migrations completed successfully")
        except Exception as e:
            logger.error(f"Failed to run database migrations: {e}")
            raise

    try:
        # Run in a thread pool to avoid blocking and async loop conflicts
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_run)
            future.result(timeout=60)  # Wait up to 60 seconds
    except Exception as e:
        logger.error(f"Failed to run database migrations in thread: {e}")
        raise


def get_current_revision() -> str | None:
    """Get the current database revision.

    Returns:
        The current revision ID, or None if no migrations have been applied.
    """
    try:
        from alembic.runtime.migration import MigrationContext
        from sqlalchemy import create_engine

        from .database import get_database_url

        engine = create_engine(get_database_url())
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            return context.get_current_revision()
    except Exception as e:
        logger.warning(f"Could not get current migration revision: {e}")
        return None


def create_migration(message: str, autogenerate: bool = True) -> str:
    """Create a new migration.

    Args:
        message: Description for the migration
        autogenerate: Whether to auto-generate migration based on model changes

    Returns:
        The path to the created migration file
    """
    config = get_alembic_config()
    if autogenerate:
        return command.revision(config, message=message, autogenerate=True)
    else:
        return command.revision(config, message=message)


def downgrade_to(revision: str = "-1") -> None:
    """Downgrade to a specific revision.

    Args:
        revision: The target revision (default: one step back)
    """
    config = get_alembic_config()
    command.downgrade(config, revision)
    logger.info(f"Downgraded to revision: {revision}")


def show_current() -> None:
    """Show the current migration revision."""
    config = get_alembic_config()
    command.current(config)


def show_history() -> None:
    """Show the migration history."""
    config = get_alembic_config()
    command.history(config)
