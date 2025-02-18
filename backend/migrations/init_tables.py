import asyncio
import os
import sys

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker

# This script initializes the users and progress tables in the database.
# It ensures that the necessary tables are created and a default user is added if it doesn't exist.

async def init_tables():
    async with engine.begin() as conn:
        # Create users table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                google_sub VARCHAR,
                email VARCHAR,
                password_hash VARCHAR,
                name VARCHAR,
                avatar_url VARCHAR
            )
        """))
        
        # Create progress table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL,
                habit VARCHAR NOT NULL,
                status BOOLEAN NOT NULL DEFAULT FALSE,
                streak INTEGER NOT NULL DEFAULT 0,
                user_id INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY(user_id) REFERENCES users(id),
                UNIQUE(date, habit, user_id)
            )
        """))
    
    # Create default user if not exists
    async with async_session_maker() as session:
        try:
            result = await session.execute(text("SELECT COUNT(*) FROM users WHERE id = 0"))
            count = result.scalar()
            
            if count == 0:
                await session.execute(
                    text("""
                    INSERT INTO users (id, email, name) 
                    VALUES (0, 'default@example.com', 'Default User')
                    """)
                )
                await session.commit()
                print("Default user created!")
            else:
                print("Default user already exists")
            
            print("Database tables initialized successfully!")
            
        except Exception as e:
            print(f"Error initializing tables: {e}")
            await session.rollback()
            raise

async def main():
    try:
        await init_tables()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
