"""
Check what groups exist in the database
"""
import sqlite3

DB_PATH = "fileserver.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("Groups in database:")
print("-" * 60)
cursor.execute("SELECT id, name, description FROM groups")
groups = cursor.fetchall()

if groups:
    for group in groups:
        print(f"ID: {group[0]}, Name: '{group[1]}', Description: '{group[2]}'")
else:
    print("No groups found in database")

print(f"\nTotal groups: {len(groups)}")

conn.close()
