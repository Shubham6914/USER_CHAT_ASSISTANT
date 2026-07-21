from fastapi import APIRouter, Depends, HTTPException
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


# -------------------- Schemas --------------------

class SignupRequest(BaseModel):
    user_name: str
    user_email: EmailStr
    password: str


class LoginRequest(BaseModel):
    user_email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class VerifyAccessTokenRequest(BaseModel):
    access_token: str



# -------------------- Routes --------------------


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
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return tokens.
    """

    try:

        return await UserService.login_user(
            db,
            request.user_email,
            request.password
        )


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
    request: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate new access token using refresh token.
    """

    try:

        res = await UserService.refresh_access_token(
            db,
            request.refresh_token
        )

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
    request: LogoutRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Logout user by invalidating refresh token.
    """

    try:

        await UserService.logout_user(
            db,
            request.refresh_token
        )

        return {
            "message": "Logged out successfully"
        }


    except Exception as e:

        logger.error(
            f"Logout failed: {str(e)}"
        )

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )



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
        "user_email": current_user.user_email
    }