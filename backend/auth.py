import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy.ext.asyncio import AsyncSession

from config import GOOGLE_CLIENT_ID
from database import get_db
from user_repository import find_user_by_google_sub, create_user

logger = logging.getLogger(__name__)

class GoogleLoginRequest(BaseModel):
    id_token: str

auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.post("/google")
async def google_login(
    request: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Receives an ID token from the frontend, verifies it with Google's public keys,
    and finds or creates a user in the DB.
    """
    try:
        decoded_token = id_token.verify_oauth2_token(
            request.id_token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        logger.error(f"Invalid Google ID Token: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    # Extract user info from the token
    google_sub = decoded_token["sub"]
    email = decoded_token.get("email")
    name = decoded_token.get("name", "")
    avatar_url = decoded_token.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google.")

    logger.info(f"Google user decoded: sub={google_sub}, email={email}, name={name}")

    user_row = await find_user_by_google_sub(db, google_sub)
    if user_row:
        logger.info(f"User found in DB: {user_row}")
    else:
        await create_user(db, google_sub, email, name, avatar_url)
        user_row = await find_user_by_google_sub(db, google_sub)

    user_dict = dict(user_row._mapping)
    
    # Optionally generate your own token/session here

    return {
        "user_id": user_dict["id"],
        "google_sub": user_dict["google_sub"],
        "email": user_dict["email"],
        "name": user_dict["name"],
        "avatar_url": user_dict["avatar_url"],
    }
