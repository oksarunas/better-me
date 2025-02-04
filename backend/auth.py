import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt  # You can use PyJWT or python-jose

# Import database dependency and helper function
from database import get_db
from user_repository import get_or_create_user
import os

logger = logging.getLogger(__name__)
router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "fallback-client-id")

# JWT configuration - these values should ideally come from your config file
SECRET_KEY = "your-secret-key"  # Replace with your secure secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    logger.info(f"Created JWT token for user: {data.get('sub')}")
    return encoded_jwt

class GoogleLoginRequest(BaseModel):
    id_token: str

@router.post("/auth/google")
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    logger.info("Received Google login request")
    try:
        decoded_token = id_token.verify_oauth2_token(
            request.id_token,
            requests.Request(),
            GOOGLE_CLIENT_ID  
        )
        logger.info("Google token successfully verified")
    except ValueError as e:
        logger.error(f"Invalid Google ID Token: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    
    google_sub = decoded_token.get("sub")
    email = decoded_token.get("email")
    name = decoded_token.get("name", "")
    avatar_url = decoded_token.get("picture", "")

    if not email:
        logger.error("Email not provided in Google token")
        raise HTTPException(status_code=400, detail="Email not provided by Google.")

    logger.info(f"Google user decoded: sub={google_sub}, email={email}, name={name}")

    # Get or create the user in the database
    user = await get_or_create_user(db, google_sub, email, name, avatar_url)
    logger.info(f"User login successful: {user}")

    # Create a JWT token with the user ID as the subject
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
