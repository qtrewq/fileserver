import sqlite3

DB_PATH = "fileserver.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check current schema
print("Current users table schema:")
cursor.execute("PRAGMA table_info(users)")
columns = cursor.fetchall()
for col in columns:
    print(f"  {col[1]} ({col[2]})")

print("\nCurrent groups table schema (if exists):")
try:
    cursor.execute("PRAGMA table_info(groups)")
    columns = cursor.fetchall()
    if columns:
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
    else:
        print("  Table does not exist")
except:
    print("  Table does not exist")

print("\nCurrent user_groups table schema (if exists):")
try:
    cursor.execute("PRAGMA table_info(user_groups)")
    columns = cursor.fetchall()
    if columns:
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
    else:
        print("  Table does not exist")
except:
    print("  Table does not exist")

# Add missing columns
print("\n\nAdding missing columns...")

try:
    cursor.execute("ALTER TABLE users ADD COLUMN require_password_change BOOLEAN DEFAULT 0")
    print("[OK] Added require_password_change to users")
except sqlite3.OperationalError as e:
    if "duplicate column" in str(e):
        print("[OK] require_password_change already exists")
    else:
        print(f"[ERROR] {e}")

conn.commit()
conn.close()
print("\nDatabase migration complete!")
