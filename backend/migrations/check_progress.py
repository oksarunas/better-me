import sqlite3

def check_progress():
    try:
        conn = sqlite3.connect('backend/progress.db')
        cursor = conn.cursor()
        
        # Get table info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print("\nTables in database:")
        print("=" * 80)
        for table in tables:
            print(table[0])
            
        # This script checks the contents of the progress table in the database.
        # It verifies that the table exists and displays statistics about the habits and their progress.
        # If progress table exists, show some data
        cursor.execute("""
            SELECT habit, COUNT(*) as count,
                   SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as completed,
                   MAX(streak) as max_streak
            FROM progress 
            GROUP BY habit
        """)
        rows = cursor.fetchall()
        
        print("\nProgress Statistics:")
        print("=" * 80)
        print(f"{'Habit':<35} {'Total':<8} {'Completed':<10} {'Max Streak':<10}")
        print("-" * 80)
        for row in rows:
            print(f"{row[0]:<35} {row[1]:<8} {row[2]:<10} {row[3]:<10}")
            
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_progress()
