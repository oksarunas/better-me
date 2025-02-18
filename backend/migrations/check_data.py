import asyncio
import os
import sys
from datetime import datetime

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker

async def check_data():
    async with async_session_maker() as session:
        try:
            # Get a sample of progress records
            result = await session.execute(
                text("""
                SELECT date, habit, status, streak, user_id 
                FROM progress 
                ORDER BY date DESC 
                LIMIT 5
                """)
            )
            
            rows = result.fetchall()
            
            print("\nSample Progress Records:")
            print("=" * 80)
            for row in rows:
                print(f"Date (raw): {row[0]}, Type: {type(row[0])}")
                print(f"Habit: {row[1]}")
                print(f"Status: {row[2]}")
                print(f"Streak: {row[3]}")
                print(f"User ID: {row[4]}")
                print("-" * 80)
            
            # Get unique habits
            result = await session.execute(
                text("SELECT DISTINCT habit FROM progress")
            )
            habits = result.fetchall()
            
            print("\nUnique Habits in Database:")
            print("=" * 40)
            for habit in habits:
                print(habit[0])
            
        except Exception as e:
            print(f"Error checking data: {e}")
            raise

async def main():
    try:
        await check_data()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
