import requests

API_URL = "http://localhost:8000/api"

def setup():
    # Login as admin to create user
    resp = requests.post(f"{API_URL}/token", data={"username": "admin", "password": "adminpassword"})
    if resp.status_code != 200:
        print("Failed to login as admin")
        return
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create testuser
    user_data = {
        "username": "testuser",
        "password": "testpassword",
        "root_path": "/",
        "is_admin": False,
        "is_super_admin": False
    }
    
    resp = requests.post(f"{API_URL}/users", json=user_data, headers=headers)
    if resp.status_code == 200:
        print("User 'testuser' created")
    elif resp.status_code == 400 and "already exists" in resp.text:
        print("User 'testuser' already exists")
    else:
        print(f"Failed to create user: {resp.text}")

if __name__ == "__main__":
    setup()
