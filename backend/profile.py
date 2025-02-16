from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
import logging

from models import User
from database import get_db
from auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

class ProfileUpdateRequest:
    def __init__(self, name: Optional[str] = None, email: Optional[str] = None):
        self.name = name
        self.email = email

@router.put("/profile/update")
async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile information."""
    try:
        # Prepare update data
        update_data = {}
        if profile_data.name is not None:
            update_data["name"] = profile_data.name
        if profile_data.email is not None:
            # Check if email is already taken
            query = select(User).where(User.email == profile_data.email, User.id != current_user.id)
            result = await db.execute(query)
            if result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already registered")
            update_data["email"] = profile_data.email

        if update_data:
            # Update user
            stmt = update(User).where(User.id == current_user.id).values(**update_data)
            await db.execute(stmt)
            await db.commit()

            # Fetch updated user
            query = select(User).where(User.id == current_user.id)
            result = await db.execute(query)
            updated_user = result.scalar_one()

            return {
                "message": "Profile updated successfully",
                "user": {
                    "id": updated_user.id,
                    "name": updated_user.name,
                    "email": updated_user.email,
                    "avatar_url": updated_user.avatar_url
                }
            }
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload user avatar."""
    try:
        # TODO: Implement file upload to cloud storage (e.g., S3)
        # For now, we'll just update the avatar_url with a placeholder
        avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={current_user.email}"
        
        # Update user's avatar_url
        stmt = update(User).where(User.id == current_user.id).values(avatar_url=avatar_url)
        await db.execute(stmt)
        await db.commit()

        return {
            "message": "Avatar updated successfully",
            "avatar_url": avatar_url
        }
    except Exception as e:
        logger.error(f"Error uploading avatar: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload avatar")
