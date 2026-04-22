from backend import database, models, auth, crud
from sqlalchemy.orm import Session

def create_test_user():
    db = database.SessionLocal()
    try:
        # Check if test_admin exists
        user = db.query(models.User).filter(models.User.username == "test_admin").first()
        if not user:
            hashed_pw = auth.get_password_hash("testpass123")
            user = models.User(
                username="test_admin",
                hashed_password=hashed_pw,
                is_admin=True,
                is_super_admin=True,
                root_path="/"
            )
            db.add(user)
            db.commit()
            print("Test user 'test_admin' created with password 'testpass123'")
        else:
            print("Test user 'test_admin' already exists")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
