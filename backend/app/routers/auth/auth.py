import jwt
from fastapi import APIRouter, Request, Response, Depends, HTTPException

from app.db import Repo
from app.routers.auth.types import LoginPayload
from app.utils.misc import get_repo

router = APIRouter(prefix='/api/auth')

@router.get("/user")
async def get_user(request: Request, response: Response, repo: Repo = Depends(get_repo)):
    try:
        payload = request.app.jwtmanager.decode_token(request.cookies.get("access_token"))

    except jwt.ExpiredSignatureError:
        return {"success": False, "message": "Token expired"}

    except jwt.PyJWTError:
        return {"success": False, "message": "Invalid token"}

    user = await repo.get_user(payload['id'])
    if not user or not user.is_active:
        response.delete_cookie(
            key="access_token",
            path="/"
        )
        return {"success": False, "message": "User not found"}

    return {"success": True, "user": user.json()}


@router.post("/login")
async def post_login(payload: LoginPayload, request: Request, response: Response, repo: Repo = Depends(get_repo)):
    user = await repo.get_user_by_login(payload.login)

    if not user or user.password != payload.password or not user.is_active:
        return {"success": False}

    response.set_cookie(
        key="access_token",
        value=request.app.jwtmanager.create_token({
            "id": user.id,
            "role": user.role.value
        }),
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=2_147_483_647,
        path="/"
    )

    return {"success": True, "user": user.json()}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/"
    )

    return {"success": True}
