import asyncio
import os
import sys
from datetime import datetime

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker
from models import Base

# This script initializes the database by creating necessary tables and inserting a default user.
# It ensures that the database schema is set up correctly for application use.

async def initialize_database():
    async with engine.begin() as conn:
        # Drop existing tables
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session_maker() as session:
        try:
            # Create a default user
            await session.execute(
                text("""
                INSERT INTO users (id, email, name) 
                VALUES (0, 'default@example.com', 'Default User')
                """)
            )
            
            # Commit the changes
            await session.commit()
            print("Database initialized successfully with default user!")
            
        except Exception as e:
            print(f"Error initializing database: {e}")
            await session.rollback()
            raise

async def main():
    try:
        await initialize_database()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
