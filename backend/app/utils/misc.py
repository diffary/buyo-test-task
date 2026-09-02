from typing import AsyncGenerator

import jwt
from fastapi import Request, HTTPException, Response

from app.db import Repo
from app.db.models import User


async def get_repo(request: Request) -> AsyncGenerator[Repo, None]:
    async with request.app.session_factory() as session:
        repo: Repo = Repo(session=session)
        yield repo


async def auth_user(request: Request, response: Response) -> AsyncGenerator[tuple[User, Repo], None]:
    async with request.app.session_factory() as session:
        repo: Repo = Repo(session=session)

        try:
            payload = request.app.jwtmanager.decode_token(request.cookies.get("access_token"))

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=400, detail="Token expired")

        except jwt.PyJWTError:
            raise HTTPException(status_code=400, detail="Invalid token")

        user = await repo.get_user(payload['id'])

        if not user or not user.is_active:
            response.delete_cookie(
                key="access_token",
                path="/"
            )
            raise HTTPException(status_code=404, detail="User not found")

        yield user, repo

def get_insight_site_type(insight_type: str):
    return 'BUYO' if insight_type == 'buyo' else 'Лендинг'

def get_order_site_type(order_method: str):
    return 'BUYO' if order_method in ('shopping-cart', 'unfinished-checkout', 'bot-confirm', 'popup-callback-60s', 'consult') else 'Лендинг'

def normalize_offer_id(offer_id: str) -> str:
    if "-lf" in offer_id:
        return offer_id.split("-lf", 1)[0]
    else:
        return offer_id if offer_id.count("-") == 2 else offer_id.rsplit("-", 1)[0]

def get_offer_percentage_rate(offer_kpi_percentage: int, normalized_offer_id: str, is_old: bool) -> float:
    if is_old:
        if "ss-dm-0032" in normalized_offer_id:
            return 0.12

        else:
            return 0.175 if '$' in normalized_offer_id else 0.25

    else:
        return offer_kpi_percentage
