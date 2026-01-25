"""Logging configuration using loguru."""

import sys
from pathlib import Path

from loguru import logger

from .config import get_config


def setup_logging() -> None:
    """Configure loguru with file and console handlers."""
    _, _, log_config = get_config()

    # Remove default handler
    logger.remove()

    # Console handler
    logger.add(
        sys.stderr,
        level=log_config.level,
        format=log_config.format,
    )

    # File handler
    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(exist_ok=True)

    logger.add(
        logs_dir / "{time:YYYY-MM-DD}.log",
        level=log_config.level,
        format=log_config.format,
        rotation=log_config.rotation,
        retention=log_config.retention,
    )
