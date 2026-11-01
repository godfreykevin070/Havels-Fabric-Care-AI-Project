import logging

from app.db.base import Base
from app.db.session import engine
from app import models  # noqa: F401  (registers all models on Base.metadata)

logger = logging.getLogger(__name__)


def init_db() -> None:
    """Create tables if they do not exist (POC-grade migration strategy)."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema ensured.")