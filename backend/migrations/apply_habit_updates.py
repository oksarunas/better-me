import asyncio
import os
import sys

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker

async def apply_migration():
    async with async_session_maker() as session:
        try:
            # Begin transaction
            await session.execute(text("""
                UPDATE progress 
                SET habit = CASE habit
                    WHEN '7 hours of sleep' THEN '7 hours of sleep'
                    WHEN 'Healthy Breakfast' THEN 'Healthy Breakfast'
                    WHEN 'Workout for 30 minutes' THEN 'Workout for 30 minutes'
                    WHEN 'Work on personal project for an hour' THEN 'Work on personal project for an hour'
                    WHEN '5 g of creatine' THEN '5 g of creatine'
                    WHEN 'Read for 20 minutes' THEN 'Read for 20 minutes'
                    WHEN 'Multivitamins' THEN 'Multivitamins'
                    WHEN 'No alcohol' THEN 'No alcohol'
                    ELSE habit
                END
                WHERE habit IN (
                    '7 hours of sleep',
                    'Healthy Breakfast',
                    'Workout for 30 minutes',
                    'Work on personal project for an hour',
                    '5 g of creatine',
                    'Read for 20 minutes',
                    'Multivitamins',
                    'No alcohol'
                )
            """))
            
            # Commit the transaction
            await session.commit()
            print("Migration completed successfully!")
            
        except Exception as e:
            # Rollback in case of error
            await session.rollback()
            print(f"Error during migration: {e}")
            raise

async def main():
    try:
        await apply_migration()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
