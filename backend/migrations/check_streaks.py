import asyncio
import os
import sys
from datetime import date, timedelta

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker

async def check_streaks():
    async with async_session_maker() as session:
        try:
            # Query to get all progress records with non-zero streaks
            result = await session.execute(
                text("""
                SELECT date, habit, streak, user_id 
                FROM progress 
                WHERE streak > 0
                ORDER BY date DESC, habit
                """)
            )
            
            rows = result.fetchall()
            
            if not rows:
                print("No active streaks found in the database.")
                return
                
            print("\nCurrent Active Streaks:")
            print("=" * 70)
            print(f"{'Date':<12} {'Habit':<35} {'Streak':<8} {'User ID':<8}")
            print("-" * 70)
            
            for row in rows:
                date_str = row[0].strftime('%Y-%m-%d') if row[0] else 'N/A'
                print(f"{date_str:<12} {row[1]:<35} {row[2]:<8} {row[3]:<8}")
            
            # Get total number of progress records
            result = await session.execute(text("SELECT COUNT(*) FROM progress"))
            total_records = result.scalar()
            
            print("\nDatabase Statistics:")
            print(f"Total progress records: {total_records}")
            print(f"Records with active streaks: {len(rows)}")
            
        except Exception as e:
            print(f"Error checking streaks: {e}")
            raise

async def main():
    try:
        await check_streaks()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
