import asyncio
import os
import sys

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker

async def check_streaks():
    async with async_session_maker() as session:
        try:
            # Get recent records with non-zero streaks
            result = await session.execute(
                text("""
                SELECT date, habit, status, streak, user_id 
                FROM progress 
                WHERE streak > 0
                ORDER BY date DESC, streak DESC
                LIMIT 10
                """)
            )
            
            rows = result.fetchall()
            
            if not rows:
                print("\nNo active streaks found in recent records.")
            else:
                print("\nRecent Active Streaks:")
                print("=" * 80)
                print(f"{'Date':<12} {'Habit':<35} {'Status':<8} {'Streak':<8} {'User':<5}")
                print("-" * 80)
                
                for row in rows:
                    date_str = row[0]
                    print(f"{date_str:<12} {row[1]:<35} {row[2]:<8} {row[3]:<8} {row[4]:<5}")
            
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
