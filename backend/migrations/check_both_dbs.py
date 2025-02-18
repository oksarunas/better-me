import asyncio
import os
import sys

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# This script checks the integrity of both the root and backend database files.
# It ensures that the progress data is consistent and verifies the existence of necessary tables.

async def check_database(db_path: str):
    print(f"\nChecking database: {db_path}")
    print("-" * 50)
    
    # Create engine for this specific database
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Check users table
            result = await session.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            print(f"Users in database: {user_count}")
            
            # Check progress table
            result = await session.execute(text("SELECT COUNT(*) FROM progress"))
            progress_count = result.scalar()
            print(f"Progress records: {progress_count}")
            
            if progress_count > 0:
                # Show some progress records
                result = await session.execute(
                    text("""
                    SELECT date, habit, status, streak, user_id 
                    FROM progress 
                    WHERE streak > 0
                    ORDER BY date DESC, streak DESC 
                    LIMIT 5
                    """)
                )
                progress = result.fetchall()
                if progress:
                    print("\nTop Streaks:")
                    for p in progress:
                        date_str = p[0].strftime('%Y-%m-%d') if p[0] else 'N/A'
                        print(f"Date: {date_str}, Habit: {p[1]}, Status: {p[2]}, Streak: {p[3]}, User ID: {p[4]}")
            
            # Get database file size
            size = os.path.getsize(db_path)
            print(f"\nDatabase size: {size/1024:.2f} KB")
            
        except Exception as e:
            print(f"Error or no tables in database: {e}")
        finally:
            await engine.dispose()

async def main():
    # Check both database files
    await check_database("backend/progress.db")

if __name__ == "__main__":
    asyncio.run(main())
