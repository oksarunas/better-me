import logging
import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel, EmailStr
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from config import Config
from database import get_db
from user_repository import get_or_create_user
from models import User

logger = logging.getLogger(__name__)
router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth & JWT Configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
GOOGLE_CLIENT_ID = Config.GOOGLE_CLIENT_ID
SECRET_KEY = Config.SECRET_KEY
ALGORITHM = Config.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = Config.ACCESS_TOKEN_EXPIRE_MINUTES

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class GoogleLoginRequest(BaseModel):
    id_token: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

@router.post("/auth/register")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with email and password."""
    # Check if email already exists
    query = select(User).where(User.email == request.email)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    new_user = User(
        email=request.email,
        password_hash=hashed_password,
        name=request.name
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "avatar_url": new_user.avatar_url,
        }
    }

@router.post("/auth/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user with email and password."""
    # Find user by email
    query = select(User).where(User.email == request.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
        }
    }

@router.post("/auth/google")
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """Handles Google OAuth2 login and returns JWT token."""
    logger.info("Received Google login request")
    try:
        decoded_token = id_token.verify_oauth2_token(
            request.id_token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )
        if decoded_token.get("aud") != GOOGLE_CLIENT_ID:
            raise ValueError("Token was not issued for this client.")
        logger.info("Google token successfully verified")
    except ValueError as e:
        logger.error(f"Google ID Token verification failed: {e}")
        raise HTTPException(status_code=401, detail=str(e))

    google_sub = decoded_token.get("sub")
    email = decoded_token.get("email")
    name = decoded_token.get("name", "")
    avatar_url = decoded_token.get("picture", "")

    if not email:
        logger.error("Email not provided in Google token")
        raise HTTPException(status_code=400, detail="Email not provided by Google.")

    logger.info(f"Google user verified: sub={google_sub}, email={email}")

    # Get or create user in DB
    user = await get_or_create_user(db, google_sub, email, name, avatar_url)
    logger.info(f"User login successful: user_id={user.id}")

    # Generate JWT token
    access_token = create_access_token(data={"sub": str(user.id)})
    logger.info(f"JWT issued for user_id: {user.id}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
        }
    }

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    """Extract user ID from JWT token and return the user object."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload.")
        
        # Get user from database
        from models import User
        from sqlalchemy import select
        
        query = select(User).where(User.id == int(user_id))
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
            
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

@router.get("/protected")
async def protected_route(current_user = Depends(get_current_user)):
    return {"message": f"Hello, {current_user.name or current_user.email}!"}
