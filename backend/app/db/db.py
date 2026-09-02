from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from config import DB


def make_connection_string(db: DB, async_fallback: bool = False) -> str:
    result = (
        f"postgresql+asyncpg://{db.user}:{db.password}@{db.host}:{db.port}/{db.name}"
    )
    if async_fallback:
        result += "?async_fallback=True"
    return result


def sa_sessionmaker(db: DB, echo: bool = False):
    engine = create_async_engine(make_connection_string(db), echo=echo)
    return async_sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)

