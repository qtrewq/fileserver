# FileServer Python API Documentation

Complete guide for programmatic access to the FileServer using Python.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [File Operations](#file-operations)
- [User Management](#user-management)
- [Folder Sharing](#folder-sharing)
- [Error Handling](#error-handling)
- [Complete Examples](#complete-examples)

## Quick Start

### Installation

```bash
pip install requests
```

### Basic Usage

```python
import requests

BASE_URL = "http://localhost:30815/api"

# 1. Login
response = requests.post(f"{BASE_URL}/token", data={
    "username": "admin",
    "password": "adminpassword"
})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. List files
files = requests.get(f"{BASE_URL}/files/", headers=headers).json()
print(files)
```

## Authentication

### Login

Get an access token for API requests.

**Endpoint:** `POST /api/token`

**Request:**
```python
response = requests.post(f"{BASE_URL}/token", data={
    "username": "your_username",
    "password": "your_password"
})
```

**Response:**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
}
```

**Usage:**
```python
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
```

### Get Current User Info

Retrieve information about the authenticated user.

**Endpoint:** `GET /api/users/me`

**Request:**
```python
response = requests.get(f"{BASE_URL}/users/me", headers=headers)
user_info = response.json()
```

**Response:**
```json
{
    "id": 1,
    "username": "admin",
    "root_path": "/",
    "is_admin": true
}
```

## File Operations

### List Files/Directories

List contents of a directory or download a file.

**Endpoint:** `GET /api/files/{path}`

**List Directory:**
```python
# List root directory
response = requests.get(f"{BASE_URL}/files/", headers=headers)
items = response.json()

# List subdirectory
response = requests.get(f"{BASE_URL}/files/my_folder", headers=headers)
items = response.json()
```

**Response (Directory):**
```json
[
    {
        "name": "document.txt",
        "is_dir": false,
        "size": 1024,
        "path": "document.txt"
    },
    {
        "name": "my_folder",
        "is_dir": true,
        "size": 0,
        "path": "my_folder"
    }
]
```

**Download File:**
```python
# Download file content
response = requests.get(f"{BASE_URL}/files/document.txt", headers=headers)
content = response.text  # or response.content for binary

# Save to disk
with open("downloaded_file.txt", "wb") as f:
    f.write(response.content)
```

### Upload File

Upload a file to a directory.

**Endpoint:** `POST /api/upload/{path}`

**Request:**
```python
# Upload to root directory
with open("myfile.txt", "rb") as f:
    files = {"file": f}
    response = requests.post(f"{BASE_URL}/upload/", headers=headers, files=files)

# Upload to subdirectory
with open("myfile.txt", "rb") as f:
    files = {"file": f}
    response = requests.post(f"{BASE_URL}/upload/my_folder", headers=headers, files=files)
```

**Response:**
```json
{
    "info": "file 'myfile.txt' saved at 'my_folder'"
}
```

### Create Directory

Create a new directory.

**Endpoint:** `POST /api/mkdir/{path}`

**Request:**
```python
# Create directory in root
response = requests.post(f"{BASE_URL}/mkdir/new_folder", headers=headers)

# Create nested directory
response = requests.post(f"{BASE_URL}/mkdir/parent/child", headers=headers)
```

**Response:**
```json
{
    "status": "created"
}
```

### Delete File/Directory

Delete a file or directory.

**Endpoint:** `DELETE /api/delete/{path}`

**Request:**
```python
# Delete file
response = requests.delete(f"{BASE_URL}/delete/myfile.txt", headers=headers)

# Delete directory (and all contents)
response = requests.delete(f"{BASE_URL}/delete/my_folder", headers=headers)
```

**Response:**
```json
{
    "status": "deleted"
}
```

## User Management

**Note:** All user management endpoints require admin privileges.

### List All Users

**Endpoint:** `GET /api/users`

**Request:**
```python
response = requests.get(f"{BASE_URL}/users", headers=headers)
users = response.json()
```

**Response:**
```json
[
    {
        "id": 1,
        "username": "admin",
        "root_path": "/",
        "is_admin": true
    },
    {
        "id": 2,
        "username": "john",
        "root_path": "/john",
        "is_admin": false
    }
]
```

### Create User

**Endpoint:** `POST /api/users`

**Request:**
```python
new_user = {
    "username": "newuser",
    "password": "securepassword",
    "root_path": "/newuser",
    "is_admin": False
}
response = requests.post(f"{BASE_URL}/users", headers=headers, json=new_user)
```

**Response:**
```json
{
    "id": 3,
    "username": "newuser",
    "root_path": "/newuser",
    "is_admin": false
}
```

### Update User

**Endpoint:** `PUT /api/users/{username}`

**Request:**
```python
# Update username and root path
updates = {
    "username": "updated_username",
    "root_path": "/new_path"
}
response = requests.put(f"{BASE_URL}/users/oldusername", headers=headers, json=updates)

# Make user admin
updates = {"is_admin": True}
response = requests.put(f"{BASE_URL}/users/someuser", headers=headers, json=updates)
```

**Response:**
```json
{
    "id": 2,
    "username": "updated_username",
    "root_path": "/new_path",
    "is_admin": false
}
```

### Delete User

**Endpoint:** `DELETE /api/users/{username}`

**Request:**
```python
response = requests.delete(f"{BASE_URL}/users/username_to_delete", headers=headers)
```

**Response:**
```json
{
    "ok": true
}
```

### Reset User Password (Admin)

**Endpoint:** `POST /api/users/{username}/reset-password`

**Request:**
```python
password_data = {
    "new_password": "newpassword123"
}
response = requests.post(
    f"{BASE_URL}/users/john/reset-password",
    headers=headers,
    json=password_data
)
```

**Response:**
```json
{
    "ok": true,
    "message": "Password reset successfully"
}
```

### Change Own Password

**Endpoint:** `POST /api/change-password`

**Request:**
```python
password_data = {
    "current_password": "oldpassword",
    "new_password": "newpassword123"
}
response = requests.post(
    f"{BASE_URL}/change-password",
    headers=headers,
    json=password_data
)
```

**Response:**
```json
{
    "ok": true,
    "message": "Password changed successfully"
}
```

## Folder Sharing

### Share a Folder

Share a folder with another user.

**Endpoint:** `POST /api/share`

**Request:**
```python
share_data = {
    "folder_path": "my_folder",
    "username": "john",
    "permission": "read"  # or "write"
}
response = requests.post(f"{BASE_URL}/share", headers=headers, json=share_data)
```

**Response:**
```json
{
    "id": 1,
    "folder_path": "my_folder",
    "owner_id": 1,
    "shared_with_id": 2,
    "permission": "read"
}
```

### List Folders You've Shared

**Endpoint:** `GET /api/shares`

**Request:**
```python
response = requests.get(f"{BASE_URL}/shares", headers=headers)
shares = response.json()
```

**Response:**
```json
[
    {
        "id": 1,
        "folder_path": "my_folder",
        "shared_with_username": "john",
        "permission": "read"
    }
]
```

### List Folders Shared With You

**Endpoint:** `GET /api/shared-with-me`

**Request:**
```python
response = requests.get(f"{BASE_URL}/shared-with-me", headers=headers)
shared_folders = response.json()
```

**Response:**
```json
[
    {
        "id": 1,
        "folder_path": "admin/documents",
        "owner_username": "admin",
        "permission": "read"
    }
]
```

### Stop Sharing a Folder

**Endpoint:** `DELETE /api/share/{share_id}`

**Request:**
```python
share_id = 1
response = requests.delete(f"{BASE_URL}/share/{share_id}", headers=headers)
```

**Response:**
```json
{
    "ok": true
}
```

## Error Handling

### Common HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
    "detail": "Error message describing what went wrong"
}
```

### Example Error Handling

```python
try:
    response = requests.get(f"{BASE_URL}/files/nonexistent", headers=headers)
    response.raise_for_status()  # Raises HTTPError for bad status codes
    data = response.json()
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 404:
        print("File not found")
    elif e.response.status_code == 403:
        print("Access denied")
    else:
        print(f"Error: {e.response.json().get('detail', 'Unknown error')}")
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
```

## Complete Examples

### Example 1: File Management Workflow

```python
import requests
import os

BASE_URL = "http://localhost:30815/api"

# Login
response = requests.post(f"{BASE_URL}/token", data={
    "username": "admin",
    "password": "adminpassword"
})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create a project directory
requests.post(f"{BASE_URL}/mkdir/my_project", headers=headers)

# Upload files to the project
files_to_upload = ["script.py", "data.csv", "README.md"]
for filename in files_to_upload:
    if os.path.exists(filename):
        with open(filename, "rb") as f:
            files = {"file": f}
            requests.post(f"{BASE_URL}/upload/my_project", headers=headers, files=files)

# List project contents
response = requests.get(f"{BASE_URL}/files/my_project", headers=headers)
print("Project files:", response.json())

# Download a specific file
response = requests.get(f"{BASE_URL}/files/my_project/data.csv", headers=headers)
with open("downloaded_data.csv", "wb") as f:
    f.write(response.content)
```

### Example 2: User Management

```python
import requests

BASE_URL = "http://localhost:30815/api"

# Admin login
response = requests.post(f"{BASE_URL}/token", data={
    "username": "admin",
    "password": "adminpassword"
})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create a new user
new_user = {
    "username": "developer",
    "password": "dev123",
    "root_path": "/projects",
    "is_admin": False
}
response = requests.post(f"{BASE_URL}/users", headers=headers, json=new_user)
print("User created:", response.json())

# Create their workspace
requests.post(f"{BASE_URL}/mkdir/projects", headers=headers)

# List all users
response = requests.get(f"{BASE_URL}/users", headers=headers)
print("All users:", response.json())

# Update user's root path
updates = {"root_path": "/projects/developer"}
requests.put(f"{BASE_URL}/users/developer", headers=headers, json=updates)
```

### Example 3: Folder Sharing

```python
import requests

BASE_URL = "http://localhost:30815/api"

# Login as admin
response = requests.post(f"{BASE_URL}/token", data={
    "username": "admin",
    "password": "adminpassword"
})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create a shared folder
requests.post(f"{BASE_URL}/mkdir/shared_docs", headers=headers)

# Share with another user (read-only)
share_data = {
    "folder_path": "shared_docs",
    "username": "john",
    "permission": "read"
}
response = requests.post(f"{BASE_URL}/share", headers=headers, json=share_data)
print("Folder shared:", response.json())

# List all shares
response = requests.get(f"{BASE_URL}/shares", headers=headers)
print("My shares:", response.json())

# Login as john to access shared folder
response = requests.post(f"{BASE_URL}/token", data={
    "username": "john",
    "password": "johnpassword"
})
john_token = response.json()["access_token"]
john_headers = {"Authorization": f"Bearer {john_token}"}

# View folders shared with john
response = requests.get(f"{BASE_URL}/shared-with-me", headers=john_headers)
print("Folders shared with me:", response.json())
```

### Example 4: Batch File Operations

```python
import requests
import os
from pathlib import Path

BASE_URL = "http://localhost:30815/api"

# Login
response = requests.post(f"{BASE_URL}/token", data={
    "username": "admin",
    "password": "adminpassword"
})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

def upload_directory(local_path, remote_path=""):
    """Recursively upload a local directory to the server"""
    local_path = Path(local_path)
    
    for item in local_path.iterdir():
        if item.is_file():
            # Upload file
            with open(item, "rb") as f:
                files = {"file": f}
                target = f"{remote_path}/{item.name}" if remote_path else item.name
                requests.post(f"{BASE_URL}/upload/{remote_path}", headers=headers, files=files)
                print(f"Uploaded: {target}")
        elif item.is_dir():
            # Create directory and recurse
            new_remote = f"{remote_path}/{item.name}" if remote_path else item.name
            requests.post(f"{BASE_URL}/mkdir/{new_remote}", headers=headers)
            upload_directory(item, new_remote)

# Upload entire directory
upload_directory("./my_local_folder", "backup")
```

### Example 5: Error Handling and Retry Logic

```python
import requests
import time
from typing import Optional

BASE_URL = "http://localhost:30815/api"

class FileServerClient:
    def __init__(self, username: str, password: str, base_url: str = BASE_URL):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.token: Optional[str] = None
        self.headers: dict = {}
        self.login()
    
    def login(self):
        """Authenticate and get access token"""
        response = requests.post(f"{self.base_url}/token", data={
            "username": self.username,
            "password": self.password
        })
        response.raise_for_status()
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def request_with_retry(self, method: str, endpoint: str, max_retries: int = 3, **kwargs):
        """Make request with automatic retry on failure"""
        for attempt in range(max_retries):
            try:
                url = f"{self.base_url}/{endpoint}"
                response = requests.request(method, url, headers=self.headers, **kwargs)
                
                # Re-authenticate on 401
                if response.status_code == 401 and attempt < max_retries - 1:
                    print("Token expired, re-authenticating...")
                    self.login()
                    continue
                
                response.raise_for_status()
                return response
            
            except requests.exceptions.RequestException as e:
                if attempt == max_retries - 1:
                    raise
                print(f"Attempt {attempt + 1} failed, retrying...")
                time.sleep(2 ** attempt)  # Exponential backoff
    
    def list_files(self, path: str = ""):
        """List files in directory"""
        response = self.request_with_retry("GET", f"files/{path}")
        return response.json()
    
    def upload_file(self, local_path: str, remote_path: str = ""):
        """Upload a file"""
        with open(local_path, "rb") as f:
            files = {"file": f}
            response = self.request_with_retry("POST", f"upload/{remote_path}", files=files)
        return response.json()

# Usage
client = FileServerClient("admin", "adminpassword")
files = client.list_files()
print(files)
```

## Best Practices

1. **Always use HTTPS in production** - The examples use HTTP for local development
2. **Store credentials securely** - Use environment variables or secure vaults
3. **Handle token expiration** - Implement re-authentication logic
4. **Validate file paths** - Prevent path traversal attacks
5. **Use streaming for large files** - Use `stream=True` for large downloads
6. **Implement rate limiting** - Avoid overwhelming the server
7. **Log API interactions** - For debugging and audit trails

## Additional Resources

- Main README: See `README.md` for general information
- Example Script: See `client_script.py` for a working example
- API Base URL: `http://localhost:30815/api` (default)

## Support

For issues or questions, please refer to the main project documentation.
