import asyncio
import os
import sys

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker

HABIT_MAPPINGS = {
    'Workout': 'Workout for 30 minutes',
    'Read': 'Read for 20 minutes',
    'Breakfast': 'Healthy Breakfast',
    'Creatine': '5 g of creatine',
    'No drink': 'No alcohol',
    'Code': 'Work on personal project for an hour',
    'Vitamins': 'Multivitamins'
}

# This script merges old habit records with new ones, ensuring that streaks are preserved and no duplicates exist.
# It updates the database with the correct habit names and maintains data integrity.
async def merge_habits():
    async with async_session_maker() as session:
        try:
            for old_habit, new_habit in HABIT_MAPPINGS.items():
                # For each old habit, find records that have both old and new habit names on the same date
                await session.execute(
                    text("""
                    UPDATE progress AS p1
                    SET status = (
                        SELECT CASE 
                            WHEN p1.status = 1 OR p2.status = 1 THEN 1 
                            ELSE 0 
                        END
                        FROM progress p2 
                        WHERE p2.date = p1.date 
                        AND p2.habit = :old_habit
                        AND p2.user_id = p1.user_id
                    ),
                    streak = (
                        SELECT CASE 
                            WHEN p1.streak >= COALESCE(p2.streak, 0) THEN p1.streak 
                            ELSE p2.streak 
                        END
                        FROM progress p2 
                        WHERE p2.date = p1.date 
                        AND p2.habit = :old_habit
                        AND p2.user_id = p1.user_id
                    )
                    WHERE p1.habit = :new_habit
                    AND EXISTS (
                        SELECT 1 
                        FROM progress p2 
                        WHERE p2.date = p1.date 
                        AND p2.habit = :old_habit
                        AND p2.user_id = p1.user_id
                    )
                    """),
                    {"old_habit": old_habit, "new_habit": new_habit}
                )
                
                # Delete the old habit records where we merged them
                await session.execute(
                    text("""
                    DELETE FROM progress 
                    WHERE habit = :old_habit
                    AND EXISTS (
                        SELECT 1 
                        FROM progress p2 
                        WHERE p2.date = progress.date 
                        AND p2.habit = :new_habit
                        AND p2.user_id = progress.user_id
                    )
                    """),
                    {"old_habit": old_habit, "new_habit": new_habit}
                )
                
                # Update any remaining old habit records to the new name
                await session.execute(
                    text("""
                    UPDATE progress 
                    SET habit = :new_habit
                    WHERE habit = :old_habit
                    """),
                    {"old_habit": old_habit, "new_habit": new_habit}
                )
            
            # Commit all changes
            await session.commit()
            print("Successfully merged and updated habit records!")
            
            # Show current habits
            result = await session.execute(
                text("""
                SELECT habit, COUNT(*) as count 
                FROM progress 
                GROUP BY habit 
                ORDER BY count DESC
                """)
            )
            habits = result.fetchall()
            
            print("\nCurrent Habits in Database:")
            print("=" * 60)
            print(f"{'Habit':<40} {'Record Count':<10}")
            print("-" * 60)
            for habit, count in habits:
                print(f"{habit:<40} {count:<10}")
            
        except Exception as e:
            print(f"Error merging habits: {e}")
            await session.rollback()
            raise

async def main():
    try:
        await merge_habits()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
