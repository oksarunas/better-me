import asyncio
import os
import sys

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker

async def update_habits():
    async with async_session_maker() as session:
        try:
            # Update old habit names to new ones
            await session.execute(
                text("""
                UPDATE progress 
                SET habit = CASE habit
                    WHEN 'Workout' THEN 'Workout for 30 minutes'
                    WHEN 'Read' THEN 'Read for 20 minutes'
                    WHEN 'Breakfast' THEN 'Healthy Breakfast'
                    WHEN 'Creatine' THEN '5 g of creatine'
                    WHEN 'No drink' THEN 'No alcohol'
                    WHEN 'Code' THEN 'Work on personal project for an hour'
                    WHEN 'Vitamins' THEN 'Multivitamins'
                    ELSE habit
                END
                WHERE habit IN (
                    'Workout',
                    'Read',
                    'Breakfast',
                    'Creatine',
                    'No drink',
                    'Code',
                    'Vitamins'
                )
                """)
            )
            
            # Commit the changes
            await session.commit()
            print("Successfully updated old habit names to new ones!")
            
            # Show updated unique habits
            result = await session.execute(text("SELECT DISTINCT habit FROM progress"))
            habits = result.fetchall()
            
            print("\nCurrent Habits in Database:")
            print("=" * 40)
            for habit in habits:
                print(habit[0])
            
        except Exception as e:
            print(f"Error updating habits: {e}")
            await session.rollback()
            raise

async def main():
    try:
        await update_habits()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
