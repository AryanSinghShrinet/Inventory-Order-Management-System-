"""SQLAlchemy engine, session, and Base declarative class."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()
engine_url = make_url(settings.database_url)
engine_kwargs = {
    "pool_pre_ping": True,
    "future": True,
}

if not engine_url.drivername.startswith("sqlite"):
    engine_kwargs.update(
        pool_size=5,
        max_overflow=10,
    )

engine = create_engine(settings.database_url, **engine_kwargs)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    future=True,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
