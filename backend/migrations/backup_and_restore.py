import asyncio
import os
import sys
import sqlite3
from datetime import datetime

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker
from models import Base

# This script is responsible for backing up the current progress data and restoring it to a new database schema.
# It ensures that the progress data is preserved while initializing the database with the correct tables.

async def backup_and_restore():
    # First, backup the progress table from the current database
    print("Backing up progress data...")
    conn = sqlite3.connect('backend/progress.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM progress")
        progress_data = cursor.fetchall()
        print(f"Backed up {len(progress_data)} progress records")
    except sqlite3.OperationalError as e:
        print(f"Error backing up progress: {e}")
        progress_data = []
    finally:
        conn.close()

    # Initialize the database with proper schema
    print("\nInitializing database with proper schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # Restore the data
    async with async_session_maker() as session:
        try:
            # Create default user
            await session.execute(
                text("""
                INSERT INTO users (id, email, name) 
                VALUES (0, 'default@example.com', 'Default User')
                """)
            )
            
            if progress_data:
                # Restore progress data
                for record in progress_data:
                    await session.execute(
                        text("""
                        INSERT INTO progress (id, date, habit, status, streak, user_id) 
                        VALUES (:id, :date, :habit, :status, :streak, :user_id)
                        """),
                        {
                            "id": record[0],
                            "date": record[1],
                            "habit": record[2],
                            "status": record[3],
                            "streak": record[4],
                            "user_id": record[5]
                        }
                    )
            
            await session.commit()
            print("Database restored successfully!")
            
            # Verify the restoration
            result = await session.execute(
                text("""
                SELECT habit, COUNT(*) as count, 
                       SUM(CASE WHEN streak > 0 THEN 1 ELSE 0 END) as active_streaks,
                       MAX(streak) as max_streak
                FROM progress 
                GROUP BY habit
                ORDER BY count DESC
                """)
            )
            progress = result.fetchall()
            
            print("\nRestored Progress Statistics:")
            print("=" * 80)
            print(f"{'Habit':<35} {'Records':<10} {'Active Streaks':<15} {'Max Streak':<10}")
            print("-" * 80)
            for p in progress:
                print(f"{p[0]:<35} {p[1]:<10} {p[2]:<15} {p[3]:<10}")
            
        except Exception as e:
            print(f"Error during restore: {e}")
            await session.rollback()
            raise

async def main():
    try:
        await backup_and_restore()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
