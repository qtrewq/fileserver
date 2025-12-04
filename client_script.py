import requests
import os

BASE_URL = "http://localhost:30815/api"
USERNAME = "admin"
PASSWORD = "adminpassword"

def main():
    # 1. Login
    print(f"Logging in as {USERNAME}...")
    response = requests.post(f"{BASE_URL}/token", data={
        "username": USERNAME,
        "password": PASSWORD
    })
    
    if response.status_code != 200:
        print("Login failed:", response.text)
        return
        
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful!")

    # 2. List files
    print("\nListing files in root:")
    response = requests.get(f"{BASE_URL}/files/", headers=headers)
    if response.status_code == 200:
        files = response.json()
        for f in files:
            print(f" - {f['name']} ({'DIR' if f['is_dir'] else 'FILE'})")
    else:
        print("Failed to list files:", response.text)

    # 3. Upload a file
    print("\nUploading 'test_upload.txt'...")
    with open("test_upload.txt", "w") as f:
        f.write("This is a test file uploaded from Python script.")
        
    with open("test_upload.txt", "rb") as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/upload/", headers=headers, files=files)
        print("Upload status:", response.status_code, response.json())

    # 4. List again to verify
    print("\nListing files after upload:")
    response = requests.get(f"{BASE_URL}/files/", headers=headers)
    if response.status_code == 200:
        files = response.json()
        for f in files:
            print(f" - {f['name']}")

    # 5. Download the file
    print("\nDownloading 'test_upload.txt'...")
    response = requests.get(f"{BASE_URL}/files/test_upload.txt", headers=headers)
    if response.status_code == 200:
        print("Download successful. Content:")
        print(response.text)
    else:
        print("Download failed:", response.text)
        
    # Cleanup
    if os.path.exists("test_upload.txt"):
        os.remove("test_upload.txt")

    # 6. Create a folder
    print("\nCreating folder 'python_test_folder'...")
    response = requests.post(f"{BASE_URL}/mkdir/python_test_folder", headers=headers)
    print("Create folder status:", response.status_code, response.json())

    # 7. Share the folder (if another user exists, e.g., 'user2')
    # print("\nSharing folder 'python_test_folder'...")
    # response = requests.post(f"{BASE_URL}/share", headers=headers, json={
    #     "folder_path": "python_test_folder",
    #     "username": "user2",
    #     "permission": "read"
    # })
    # print("Share status:", response.status_code, response.json())

    # 8. Change password (example)
    # print("\nChanging password...")
    # response = requests.post(f"{BASE_URL}/change-password", headers=headers, json={
    #     "current_password": "adminpassword",
    #     "new_password": "newadminpassword"
    # })
    # print("Change password status:", response.status_code, response.json())

if __name__ == "__main__":
    main()
