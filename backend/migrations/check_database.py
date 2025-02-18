import asyncio
import os
import sys

# Add the parent directory to the Python path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, async_session_maker

async def check_database():
    async with async_session_maker() as session:
        try:
            # Check users table
            result = await session.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            print(f"\nUsers in database: {user_count}")
            
            if user_count > 0:
                # Show user details
                result = await session.execute(
                    text("SELECT id, email, name FROM users")
                )
                users = result.fetchall()
                print("\nUser Details:")
                print("-" * 50)
                for user in users:
                    print(f"ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")
            
            # Check progress table
            result = await session.execute(text("SELECT COUNT(*) FROM progress"))
            progress_count = result.scalar()
            print(f"\nProgress records in database: {progress_count}")
            
            if progress_count > 0:
                # Show some progress records
                result = await session.execute(
                    text("""
                    SELECT date, habit, status, streak, user_id 
                    FROM progress 
                    ORDER BY date DESC 
                    LIMIT 5
                    """)
                )
                progress = result.fetchall()
                print("\nLatest Progress Records:")
                print("-" * 80)
                for p in progress:
                    date_str = p[0].strftime('%Y-%m-%d') if p[0] else 'N/A'
                    print(f"Date: {date_str}, Habit: {p[1]}, Status: {p[2]}, Streak: {p[3]}, User ID: {p[4]}")
            
            # Check database file location and size
            result = await session.execute(text("PRAGMA database_list"))
            db_info = result.fetchall()
            print("\nDatabase Information:")
            print("-" * 50)
            for info in db_info:
                print(f"Database file: {info[2]}")
                if os.path.exists(info[2]):
                    size = os.path.getsize(info[2])
                    print(f"Size: {size/1024:.2f} KB")
                else:
                    print("Database file not found on disk!")

        except Exception as e:
            print(f"Error checking database: {e}")
            raise

async def main():
    try:
        await check_database()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
