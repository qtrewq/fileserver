# FileServer

A modern, group-based file server with a beautiful web UI and Python API access. Built with FastAPI backend and React frontend.

## Features

✨ **Modern Web Interface**
- Beautiful glassmorphic dark theme UI
- Mobile responsive design
- File preview for images and text files
- Drag-and-drop file upload
- File/folder management (upload, download, delete)
- Right-click context menu
- Breadcrumb navigation
- In-browser Python code execution

🔐 **Group-Based Permissions**
- Flexible group management system
- Assign users to multiple groups
- Granular permissions per group (upload, download, delete, share, create folders)
- Storage quotas per group
- File type restrictions per group
- Easy-to-use checkbox interface for group selection

🤝 **Collaboration**
- Folder sharing with other users
- Granular permissions (Read/Write)
- View shared folders in a dedicated section

👥 **User Management**
- JWT-based authentication
- Admin panel for user management
- Password reset & change
- Account disabling
- Per-user directory access restrictions
- Group-based role management

🐍 **Python API Access**
- RESTful API for programmatic access
- Token-based authentication
- Full CRUD operations on files
- Execute Python code remotely

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Start the Server

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
```

The server will be available at: **http://localhost:30815**

### 4. Login

**Default Admin Credentials:**
- Username: `admin`
- Password: `adminpassword`

⚠️ **Important:** Change the default admin password in production!

## Web Interface

### Dashboard
- View and navigate through files and folders
- Mobile friendly: Optimized for phones and tablets
- Context menu: Right-click (or long press on mobile) for options
- Share folders: Share folders with other users via the context menu
- Upload files by clicking the "Upload File" button
- Click on files to preview (images, text files)
- Download files using the download button
- Delete files/folders using the trash icon
- Change password: Click the key icon in the header
- Run Python code: Use the built-in code editor

### Admin Panel
- **User Management:**
  - Create new users
  - Edit usernames & root paths
  - Reset passwords
  - Disable/enable accounts
  - Assign users to groups (multiple selection via checkboxes)
  - Delete users

- **Group Management:**
  - Create groups with custom permissions
  - Set permissions: upload, download, delete, share, create folders
  - Configure storage quotas per group
  - Restrict allowed file types per group
  - Edit group permissions
  - Delete groups

## Group-Based Permissions

### How It Works

Users inherit permissions from **all groups** they belong to:
- **Boolean Permissions** (upload, delete, etc.): If ANY group grants it, the user has it
- **Storage Quota**: The HIGHEST quota from all groups applies
- **File Types**: UNION of all allowed file types from all groups

### Creating Groups

1. Go to Admin Panel
2. Enter a group name (e.g., "Students", "Teachers")
3. Click "Add"
4. Click the edit icon to configure permissions

### Assigning Users to Groups

1. When creating or editing a user
2. Check the boxes next to the groups you want to assign
3. Users can belong to multiple groups simultaneously

### Admin Groups

Two special groups are created by default:
- **`admins`**: Full file management permissions
- **`super_admins`**: Full system access including user management

To make a user an admin, simply add them to the `admins` or `super_admins` group.

## Python API Usage

Basic usage example:

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

# 3. Upload file
with open("myfile.txt", "rb") as f:
    requests.post(f"{BASE_URL}/upload/", headers=headers, files={'files': f})

# 4. Download file
content = requests.get(f"{BASE_URL}/files/myfile.txt", headers=headers).content

# 5. Execute Python code
code = "print('Hello from remote!')"
result = requests.post(f"{BASE_URL}/python/execute", 
                      headers=headers, 
                      json={"code": code}).json()
print(result["output"])
```

## API Endpoints

### Authentication
- `POST /api/token` - Login and get access token
- `GET /api/users/me` - Get current user info
- `POST /api/change-password` - Change own password

### File Operations
- `GET /api/files/{path}` - List directory or download file
- `POST /api/upload/{path}` - Upload file to directory
- `POST /api/mkdir/{path}` - Create directory
- `DELETE /api/files/{path}` - Delete file or directory

### Python Execution
- `POST /api/python/execute` - Execute Python code
- `GET /api/python/files` - List Python files
- `POST /api/python/save` - Save Python file

### Sharing
- `POST /api/share` - Share a folder
- `GET /api/shares` - List folders shared by me
- `GET /api/shared-with-me` - List folders shared with me
- `DELETE /api/share/{id}` - Stop sharing a folder

### User Management (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/{username}` - Update user details
- `POST /api/users/{username}/reset-password` - Reset user password
- `DELETE /api/users/{username}` - Delete user

### Group Management (Admin Only)
- `GET /api/groups/` - List all groups
- `POST /api/groups/` - Create new group
- `GET /api/groups/{name}/` - Get group details
- `PUT /api/groups/{name}/` - Update group permissions
- `DELETE /api/groups/{name}/` - Delete group

## Project Structure

```
fileserver/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── database.py      # Database configuration
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── crud.py          # Database operations
│   ├── auth.py          # Authentication & permissions
│   └── python_runner.py # Python code execution
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Admin.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── CodeEditor.jsx
│   │   │   └── AccountDisabled.jsx
│   │   ├── api.js       # API client
│   │   ├── App.jsx      # Main app component
│   │   └── index.css    # Styles
│   └── dist/            # Built frontend (served by backend)
├── storage/             # File storage directory
├── requirements.txt     # Python dependencies
├── .gitignore          # Git ignore rules
├── LICENSE             # License file
└── README.md           # This file
```

## Security Notes

1. **Change Default Credentials:** The default admin password should be changed immediately
2. **Secret Key:** Update the `SECRET_KEY` in `backend/auth.py` for production
3. **HTTPS:** Use a reverse proxy (nginx, Caddy) with HTTPS in production
4. **Path Traversal:** The server includes path traversal protection
5. **User Isolation:** Users can only access files within their assigned root path
6. **Group Permissions:** All file operations are enforced through group-based permissions
7. **Python Execution:** Code execution is sandboxed but should be restricted to trusted users

## User Access Control

### Root Path Restrictions
When creating users, you can restrict their file system access:
- **Root Path:** Set to `/` for full access, or `/subfolder` to restrict to a specific directory
- Example: User `john` with root path `/john` can only access files in `storage/john/`

### Permission Hierarchy
1. **Admin Groups:** Users in `admins` or `super_admins` groups have full permissions
2. **Custom Groups:** Permissions are aggregated from all groups the user belongs to
3. **No Groups:** Users with no groups have no file operation permissions

## Development

### Rebuild Frontend

```bash
cd frontend
npm install
npm run build
```

### Run in Development Mode

Backend with auto-reload:
```bash
python -m uvicorn backend.main:app --reload --port 30815
```

Frontend dev server:
```bash
cd frontend
npm run dev
```

## Technologies Used

**Backend:**
- FastAPI - Modern Python web framework
- SQLAlchemy - Database ORM
- Pydantic - Data validation
- python-jose - JWT tokens
- passlib - Password hashing

**Frontend:**
- React - UI framework
- Vite - Build tool
- Tailwind CSS - Styling
- Lucide React - Icons
- Axios - HTTP client
- React Router - Routing
- Monaco Editor - Code editor

## License

MIT License - See LICENSE file for details.
