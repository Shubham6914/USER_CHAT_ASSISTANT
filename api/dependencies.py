from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database_service import DatabaseService
from services.user_service import UserService
from models.user_model import User
from services.logger_service import get_logger

logger = get_logger(__name__)

security = HTTPBearer()


def get_db():
    """
    Provides a database session.

    Yields:
        Session: SQLAlchemy database session.
    """
    db = DatabaseService.get_postgres_session()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user.

    Flow:
        - Extract token from Authorization header
        - Verify access token
        - Fetch user from DB

    Args:
        credentials: Bearer token
        db: Database session

    Returns:
        User: Authenticated user object

    Raises:
        HTTPException: If authentication fails
    """
    try:
        token = credentials.credentials

        user_id = UserService.verify_access_token(token)

        user = db.query(User).filter(User.user_id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return user

    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )