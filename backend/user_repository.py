from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def find_user_by_google_sub(db: AsyncSession, google_sub: str):
    query = text("SELECT * FROM users WHERE google_sub = :google_sub")
    result = await db.execute(query, {"google_sub": google_sub})
    return result.fetchone()

async def create_user(db: AsyncSession, google_sub: str, email: str, name: str, avatar_url: str):
    insert_query = text("""
        INSERT INTO users (google_sub, email, name, avatar_url)
        VALUES (:google_sub, :email, :name, :avatar_url)
    """)
    await db.execute(insert_query, {
        "google_sub": google_sub,
        "email": email,
        "name": name,
        "avatar_url": avatar_url
    })
    await db.commit()
