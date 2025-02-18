import asyncio
import os
import sys
import sqlite3

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker
from models import Base, User

# This script initializes the users table in the database.
# It drops the existing users table and creates a new one, ensuring that a default user is present.

async def init_users():
    # Drop and recreate only the users table
    async with engine.begin() as conn:
        # Drop users table if it exists
        await conn.execute(text("DROP TABLE IF EXISTS users"))
        
        # Create users table
        await conn.execute(text("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                google_sub VARCHAR,
                email VARCHAR,
                password_hash VARCHAR,
                name VARCHAR,
                avatar_url VARCHAR
            )
        """))
    
    # Create default user
    async with async_session_maker() as session:
        try:
            await session.execute(
                text("""
                INSERT INTO users (id, email, name) 
                VALUES (0, 'default@example.com', 'Default User')
                """)
            )
            await session.commit()
            print("Users table initialized with default user!")
            
        except Exception as e:
            print(f"Error initializing users: {e}")
            await session.rollback()
            raise

async def main():
    try:
        await init_users()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
