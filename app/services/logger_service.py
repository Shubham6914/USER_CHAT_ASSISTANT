# app/services/logger_service.py

import logging
import sys
from functools import lru_cache


LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


@lru_cache()
def get_logger(name: str = "app_logger") -> logging.Logger:
    """
    Returns a configured logger instance.
    Uses LRU cache to avoid duplicate handlers.
    """
    logger = logging.getLogger(name)

    if logger.hasHandlers():
        return logger

    logger.setLevel(logging.DEBUG)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)

    formatter = logging.Formatter(LOG_FORMAT)
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    logger.propagate = False

    return logger



# from app.services.logger_service import get_logger

# logger = get_logger(__name__)

# logger.info("Service started")
# logger.debug("Debugging info")
# logger.error("Something failed")