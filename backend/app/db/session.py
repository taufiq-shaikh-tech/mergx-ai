import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings
from app.db.models import Base

logger = logging.getLogger(__name__)

# Derive database URL with async driver
raw_db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""

if raw_db_url:
    if raw_db_url.startswith("postgresql://"):
        db_url = raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif raw_db_url.startswith("postgres://"):
        db_url = raw_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    else:
        db_url = raw_db_url
else:
    # Reliable local async SQLite fallback
    db_url = "sqlite+aiosqlite:///./mergex.db"

# Engine configuration
engine_kwargs = {"echo": False}
if "sqlite" in db_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_async_engine(db_url, **engine_kwargs)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def init_db() -> None:
    """Initializes database schema and ensures all tables exist."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully with URL: %s", db_url.split("@")[-1] if "@" in db_url else db_url)
    except Exception as e:
        logger.exception("Failed to initialize database: %s", str(e))
        raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for obtaining an active database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
