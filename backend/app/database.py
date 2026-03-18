from contextlib import contextmanager
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings

settings = get_settings()

database_url = settings.sql_database_url
connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(database_url, echo=False, connect_args=connect_args)


def init_db() -> None:
    """Create database tables."""
    db_path = None
    if database_url.startswith("sqlite:///"):
        db_relative = database_url.replace("sqlite:///", "")
        db_path = Path(db_relative).parent
    if db_path:
        db_path.mkdir(parents=True, exist_ok=True)
    SQLModel.metadata.create_all(engine)


@contextmanager
def get_session() -> Session:
    """Provide a transactional scope for database operations."""
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


