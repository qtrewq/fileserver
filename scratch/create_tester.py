import sqlite3
import os
from passlib.context import CryptContext

# Note: Using passlib context to match the backend's auth.py if possible. 
# But I don't have backends auth.py imports here easily.
# I'll just use the same logic if I can find it.
# Let's check backend/auth.py first.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_user():
    db_path = 'i:/fileserver/fileserver.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    username = "search_tester"
    password = "search_password_123"
    hashed_pw = pwd_context.hash(password)
    
    try:
        cursor.execute("INSERT INTO users (username, hashed_password, is_admin, is_super_admin, root_path, user_level, is_disabled) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (username, hashed_pw, 1, 1, "/", "admin", 0))
        conn.commit()
        print(f"User {username} created successfully with password {password}")
    except sqlite3.IntegrityError:
        print(f"User {username} already exists")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_user()
