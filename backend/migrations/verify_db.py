import asyncio
import os
import sys

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker

async def verify_database():
    async with async_session_maker() as session:
        try:
            # Check users table
            result = await session.execute(text("SELECT * FROM users"))
            users = result.fetchall()
            print("\nUsers in database:")
            print("=" * 80)
            for user in users:
                print(f"ID: {user[0]}, Email: {user[1]}, Name: {user[4]}")
            
            # Check progress table
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
            
            print("\nProgress Statistics:")
            print("=" * 80)
            print(f"{'Habit':<35} {'Records':<10} {'Active Streaks':<15} {'Max Streak':<10}")
            print("-" * 80)
            for p in progress:
                print(f"{p[0]:<35} {p[1]:<10} {p[2]:<15} {p[3]:<10}")
            
        except Exception as e:
            print(f"Error verifying database: {e}")
            raise

async def main():
    try:
        await verify_database()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
