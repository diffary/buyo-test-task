import locale
import logging

import uvicorn

from app.routers.auth import auth
from app.routers.offers import offers

from fastapi import FastAPI

from app.db import sa_sessionmaker

from app.utils.jwt_manager import JWTManager

from config import load_config
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.DEBUG)

config = load_config()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        locale.setlocale(locale.LC_TIME, 'ru_RU.UTF-8')
    except locale.Error:
        logging.getLogger(__name__).warning(
            "Locale ru_RU.UTF-8 is unavailable; using the system locale"
        )

    jwtmanager = JWTManager(config.jwt.secret_key)
    session_factory = sa_sessionmaker(config.db)

    _app.jwtmanager = jwtmanager
    _app.config = config
    _app.session_factory = session_factory

    _app.include_router(auth.router)
    _app.include_router(offers.router)

    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    uvicorn.run(app, host='localhost', port=8000, forwarded_allow_ips='*')
