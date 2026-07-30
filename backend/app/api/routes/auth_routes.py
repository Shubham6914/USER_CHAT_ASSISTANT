from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    get_db,
    get_current_user
)

from app.models.user_model import User
from app.services.user_service import UserService
from app.services.logger_service import get_logger


logger = get_logger(__name__)


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Auth"]
)


def set_refresh_cookie(response: Response, refresh_token_val: str):
    """
    Sets HttpOnly, SameSite cookie for refresh token.
    """
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_val,
        httponly=True,
        max_age=7 * 24 * 3600,
        samesite="lax",
        secure=False,
        path="/"
    )


# -------------------- Schemas --------------------

class SignupRequest(BaseModel):
    user_name: str
    user_email: EmailStr
    password: str


class LoginRequest(BaseModel):
    user_email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class VerifyAccessTokenRequest(BaseModel):
    access_token: str


class GoogleAuthRequest(BaseModel):
    id_token: str



# -------------------- Routes --------------------


@router.post("/google")
async def google_auth(
    request: GoogleAuthRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user using Google OAuth 2.0 ID token.
    Sets HttpOnly refresh token cookie.
    """

    try:
        res = await UserService.google_auth_user(
            db,
            request.id_token
        )
        set_refresh_cookie(response, res["refresh_token"])
        return res

    except Exception as e:
        logger.error(
            f"Google auth endpoint failed: {str(e)}"
        )
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.post("/signup")
async def signup(
    request: SignupRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    """

    try:

        user = await UserService.create_user(
            db,
            request.user_name,
            request.user_email,
            request.password
        )

        return {
            "message": "User created successfully",
            "user_id": user.user_id
        }


    except Exception as e:

        logger.error(
            f"Signup failed: {str(e)}"
        )

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )



@router.post("/login")
async def login(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return tokens.
    Sets HttpOnly refresh token cookie.
    """

    try:

        res = await UserService.login_user(
            db,
            request.user_email,
            request.password
        )
        set_refresh_cookie(response, res["refresh_token"])
        return res


    except Exception as e:

        logger.error(
            f"Login failed: {str(e)}"
        )

        raise HTTPException(
            status_code=401,
            detail=str(e)
        )



@router.post("/refresh")
async def refresh_token(
    response: Response,
    raw_request: Request,
    request: Optional[RefreshRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate new access token using refresh token from cookie or payload.
    """

    try:
        token_val = None
        if request and request.refresh_token:
            token_val = request.refresh_token
        else:
            token_val = raw_request.cookies.get("refresh_token")

        if not token_val:
            return {
                "access_token": None,
                "refresh_token": None,
                "authenticated": False
            }

        res = await UserService.refresh_access_token(
            db,
            token_val
        )

        set_refresh_cookie(response, res["refresh_token"])

        return {
            "access_token": res["access_token"],
            "refresh_token": res["refresh_token"],
            "token_type": "bearer"
        }


    except Exception as e:

        logger.error(
            f"Refresh failed: {str(e)}"
        )

        raise HTTPException(
            status_code=401,
            detail=str(e)
        )



@router.post("/verify-token")
async def verify_access_token(
    request: VerifyAccessTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify access token validity.
    """

    try:

        is_valid = UserService.verify_access_token(
            request.access_token
        )

        return {
            "is_valid": is_valid
        }


    except Exception as e:

        logger.error(
            f"Token verification failed: {str(e)}"
        )

        raise HTTPException(
            status_code=401,
            detail=str(e)
        )



@router.post("/logout")
async def logout(
    response: Response,
    raw_request: Request,
    request: Optional[LogoutRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Logout user by invalidating refresh token and clearing cookie.
    """

    try:
        token_val = None
        if request and request.refresh_token:
            token_val = request.refresh_token
        else:
            token_val = raw_request.cookies.get("refresh_token")

        if token_val:
            await UserService.logout_user(
                db,
                token_val
            )

        response.delete_cookie(key="refresh_token", path="/")

        return {
            "message": "Logged out successfully"
        }


    except Exception as e:

        logger.error(
            f"Logout failed: {str(e)}"
        )
        response.delete_cookie(key="refresh_token", path="/")

        return {
            "message": "Logged out successfully"
        }



@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Get currently authenticated user.
    """

    return {
        "user_id": current_user.user_id,
        "user_name": current_user.user_name,
        "user_email": current_user.user_email,
        "auth_provider": current_user.auth_provider,
        "profile_picture": current_user.profile_picture
    }