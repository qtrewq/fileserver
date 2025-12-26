import sys
import os
sys.path.append(os.getcwd())

from backend.database import SessionLocal
from backend import models

def check_user(username):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            print(f"User '{username}' not found.")
            return

        print(f"User: {user.username}")
        print(f"ID: {user.id}")
        print(f"is_admin (DB Flag): {user.is_admin}")
        print(f"is_super_admin (DB Flag): {user.is_super_admin}")
        
        print("Groups:")
        for group in user.groups:
            print(f"  - Name: '{group.name}'")
            print(f"    ID: {group.id}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_user("aqueous")
