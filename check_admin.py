import sqlite3

DB_PATH = "fileserver.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("Checking admin user...")
cursor.execute("SELECT username, is_admin, is_super_admin FROM users WHERE username = 'admin'")
result = cursor.fetchone()

if result:
    print(f"Username: {result[0]}")
    print(f"is_admin: {result[1]}")
    print(f"is_super_admin: {result[2]}")
    
    if not result[1]:
        print("\nAdmin user is not marked as admin! Fixing...")
        cursor.execute("UPDATE users SET is_admin = 1, is_super_admin = 1 WHERE username = 'admin'")
        conn.commit()
        print("Fixed!")
else:
    print("Admin user not found!")

conn.close()
