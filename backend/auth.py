import logging
from typing import Dict
import datetime
from datetime import timedelta
from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
import httpx
from passlib.context import CryptContext
from config import Config
from schemas import GoogleLoginRequest, RegisterRequest, LoginRequest
from user_repository import get_or_create_user 
from models import User 
from database import get_db 
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

logger = logging.getLogger(__name__)

# JWT settings from Config
SECRET_KEY = Config.SECRET_KEY
ALGORITHM = Config.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = Config.ACCESS_TOKEN_EXPIRE_MINUTES

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, str | None]  # id as string, avatar_url nullable

async def verify_google_token(id_token: str) -> Dict[str, str]:
    """Verify a Google OAuth2 id_token."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token}
            )
            response.raise_for_status()
            token_info = response.json()

        if token_info.get("aud") != Config.GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=401, detail="Token audience mismatch")
        
        if "sub" not in token_info or "email" not in token_info:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        return token_info
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification error: {str(e)}")

def create_access_token(data: dict) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """Get the current user from a JWT token."""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

async def register_user(request: RegisterRequest, db: AsyncSession) -> Dict[str, str]:
    """Register a new user with email and password."""
    hashed_password = pwd_context.hash(request.password)
    new_user = User(email=request.email, password_hash=hashed_password, name=request.name)
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    access_token = create_access_token(data={"sub": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

async def login_user(request: LoginRequest, db: AsyncSession) -> Dict[str, str]:
    """Authenticate a user with email and password."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=LoginResponse)
async def google_login_user(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    if request.id_token == "demo":
        logger.info("Processing demo login")
        user = await get_or_create_user(
            db,
            google_sub=None,
            email="demo@betterme.website",
            name="Demo User",
            avatar_url="https://example.com/demo-avatar.png"
        )
    else:
        id_info = await verify_google_token(request.id_token)
        logger.info("Google token verified")
        user = await get_or_create_user(
            db,
            google_sub=id_info["sub"],
            email=id_info["email"],
            name=id_info.get("name"),
            avatar_url=id_info.get("picture")
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),  # Convert to string
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url
        }
    }