"""Structured logging — centralizado, com níveis e rotação."""

import logging
import sys
from pathlib import Path


def setup_logger(name: str = "ecommerce-agent") -> logging.Logger:
    """Configura e devolve um logger com output para stdout + ficheiro."""
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger  # já configurado

    logger.setLevel(logging.DEBUG)

    # Handler para stdout
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(logging.INFO)
    stdout_handler.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))
    logger.addHandler(stdout_handler)

    # Handler para ficheiro (com rotação implícita — 5MB, 3 backups)
    try:
        log_dir = Path.home() / ".hermes" / "ecommerce-agent" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / "app.log"

        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            log_file, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8",
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        ))
        logger.addHandler(file_handler)
    except Exception:
        pass  # logs para ficheiro são nice-to-have, falhar não quebra a app

    return logger
