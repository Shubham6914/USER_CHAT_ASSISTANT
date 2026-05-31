from passlib.context import CryptContext
from services.logger_service import get_logger

from jose import JWTError, jwt
from datetime import datetime, timedelta

from app.core.config import settings
from sqlalchemy.orm import Session

from datetime import datetime
from models.user_model import User

from models.refresh_token_model import RefreshToken
logger = get_logger(__name__)

# bcrypt config
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    """
    Service responsible for user authentication and management.
    """

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hashes a plain text password using bcrypt.

        Args:
            password (str): Plain text password.

        Returns:
            str: Hashed password.
        """
        try:
            hashed_password = pwd_context.hash(password)
            logger.debug("Password hashed successfully.")
            return hashed_password
        except Exception as e:
            logger.error(f"Error hashing password: {str(e)}")
            raise

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verifies a plain text password against a hashed password.

        Args:
            plain_password (str): User provided password.
            hashed_password (str): Stored hashed password.

        Returns:
            bool: True if password matches, else False.
        """
        try:
            is_valid = pwd_context.verify(plain_password, hashed_password)
            logger.debug("Password verification completed.")
            return is_valid
        except Exception as e:
            logger.error(f"Error verifying password: {str(e)}")
            return False
    
    @staticmethod
    def generate_access_token(user_id: int) -> str:
        """
        Generates a JWT access token.

        Args:
            user_id (int): ID of the user.

        Returns:
            str: Encoded JWT access token.
        """
        try:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

            payload = {
                "sub": str(user_id),
                "type": "access",
                "exp": expire
            }

            token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

            logger.debug(f"Access token generated for user_id={user_id}")
            return token

        except Exception as e:
            logger.error(f"Error generating access token: {str(e)}")
            raise

    @staticmethod
    def generate_refresh_token(user_id: int) -> tuple[str, datetime]:
        """
        Generates a refresh token.

        Args:
            user_id (int): ID of the user.

        Returns:
            tuple[str, datetime]: Refresh token and expiry datetime.
        """
        try:
            expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

            payload = {
                "sub": str(user_id),
                "type": "refresh",
                "exp": expire
            }

            token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

            logger.debug(f"Refresh token generated for user_id={user_id}")
            return token, expire

        except Exception as e:
            logger.error(f"Error generating refresh token: {str(e)}")
            raise
    
    @staticmethod
    def verify_access_token(token: str) -> int:
        """
        Verifies an access token and extracts user_id.

        Args:
            token (str): JWT access token.

        Returns:
            int: User ID from token.

        Raises:
            Exception: If token is invalid or expired.
        """
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )

            if payload.get("type") != "access":
                raise Exception("Invalid token type")

            user_id = int(payload.get("sub"))

            logger.debug(f"Access token verified for user_id={user_id}")
            return user_id

        except JWTError as e:
            logger.error(f"Access token verification failed: {str(e)}")
            raise Exception("Invalid or expired access token")
        
        
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> str:
        """
        Generates a new access token using a valid refresh token.

        Args:
            db (Session): Database session.
            refresh_token (str): JWT refresh token.

        Returns:
            str: New access token.

        Raises:
            Exception: If refresh token is invalid, expired, or not found in DB.
        """
        try:
            # decode token
            payload = jwt.decode(
                refresh_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )

            if payload.get("type") != "refresh":
                raise Exception("Invalid token type")

            user_id = int(payload.get("sub"))

            # check token exists in DB
            token_entry = db.query(RefreshToken).filter(
                RefreshToken.refresh_token == refresh_token,
                RefreshToken.user_id == user_id
            ).first()

            if not token_entry:
                raise Exception("Refresh token not found")

            # check expiry (extra safety)
            if token_entry.expires_at < datetime.utcnow():
                raise Exception("Refresh token expired")

            # generate new access token
            new_access_token = UserService.generate_access_token(user_id)

            logger.info(f"Access token refreshed for user_id={user_id}")

            return new_access_token

        except JWTError as e:
            logger.error(f"Refresh token verification failed: {str(e)}")
            raise Exception("Invalid or expired refresh token")

        except Exception as e:
            logger.error(f"Refresh flow failed: {str(e)}")
            raise
        
    @staticmethod
    def create_user(db: Session, user_name: str, user_email: str, password: str) -> User:
        """
        Creates a new user in the database.

        Args:
            db (Session): Database session.
            user_name (str): Name of the user.
            user_email (str): Email of the user.
            password (str): Plain text password.

        Returns:
            User: Created user object.

        Raises:
            Exception: If user already exists or DB error occurs.
        """
        try:
            # check if user already exists
            existing_user = db.query(User).filter(User.user_email == user_email).first()
            if existing_user:
                raise Exception("User already exists")

            # hash password
            hashed_password = UserService.hash_password(password)

            # create user
            new_user = User(
                user_name=user_name,
                user_email=user_email,
                password_hash=hashed_password
            )

            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            logger.info(f"User created with email={user_email}")
            return new_user

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating user: {str(e)}")
            raise
    
    @staticmethod
    def login_user(db: Session, user_email: str, password: str) -> dict:
        """
        Authenticates user and generates access + refresh tokens.

        Args:
            db (Session): Database session.
            user_email (str): User email.
            password (str): Plain text password.

        Returns:
            dict: Access token and refresh token.

        Raises:
            Exception: If authentication fails.
        """
        try:
            # get user
            user = db.query(User).filter(User.user_email == user_email).first()

            if not user:
                raise Exception("Invalid email or password")

            # verify password
            if not UserService.verify_password(password, user.password_hash):
                raise Exception("Invalid email or password")

            # generate tokens
            access_token = UserService.generate_access_token(user.user_id)
            refresh_token, expires_at = UserService.generate_refresh_token(user.user_id)

            # store refresh token in DB
            token_entry = RefreshToken(
                user_id=user.user_id,
                refresh_token=refresh_token,
                expires_at=expires_at
            )

            db.add(token_entry)
            db.commit()

            logger.info(f"User logged in successfully user_id={user.user_id}")

            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Login failed: {str(e)}")
            raise
    
    @staticmethod
    def logout_user(db: Session, refresh_token: str) -> None:
        """
        Logs out a user by removing the refresh token from the database.

        Args:
            db (Session): Database session.
            refresh_token (str): Refresh token to invalidate.

        Raises:
            Exception: If token not found or DB error occurs.
        """
        try:
            token_entry = db.query(RefreshToken).filter(
                RefreshToken.refresh_token == refresh_token
            ).first()

            if not token_entry:
                raise Exception("Invalid refresh token")

            db.delete(token_entry)
            db.commit()

            logger.info(f"User logged out successfully user_id={token_entry.user_id}")

        except Exception as e:
            db.rollback()
            logger.error(f"Logout failed: {str(e)}")
            raise
    
    