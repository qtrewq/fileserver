# FileServer

A modern, single-port file server with a beautiful web UI and Python API access. Built with FastAPI backend and React frontend.

## Features

✨ **Modern Web Interface**
- Beautiful glassmorphic dark theme UI
- **Mobile Responsive Design** (New!)
- File preview for images and text files
- Drag-and-drop file upload
- File/folder management (upload, download, delete)
- **Right-click Context Menu** (New!)
- Breadcrumb navigation

🤝 **Collaboration**
- **Folder Sharing** with other users (New!)
- Granular permissions (Read/Write)
- View shared folders in a dedicated section

🔐 **User Management**
- JWT-based authentication
- Admin panel for user management
- **Password Reset & Change** (New!)
- Per-user directory access restrictions
- Role-based permissions (admin/user)

🐍 **Python API Access**
- RESTful API for programmatic access
- Token-based authentication
- Full CRUD operations on files

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Server

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
```

The server will be available at: **http://localhost:30815**

### 3. Login

**Default Admin Credentials:**
- Username: `admin`
- Password: `adminpassword`

⚠️ **Important:** Change the default admin password in production!

## Web Interface

### Dashboard
- View and navigate through files and folders
- **Mobile Friendly:** Optimized for phones and tablets
- **Context Menu:** Right-click (or long press on mobile) for options
- **Share Folders:** Share folders with other users via the context menu
- Upload files by clicking the "Upload File" button
- Click on files to preview (images, text files)
- Download files using the download button
- Delete files/folders using the trash icon
- **Change Password:** Click the key icon in the header

### Admin Panel
- Create new users
- **Edit Usernames & Root Paths:** Click the pencil icon next to a username
- **Reset Passwords:** Click the key icon next to a user
- Set user root paths (restrict access to specific directories)
- Assign admin privileges
- Delete users

## Python API Usage

See `client_script.py` for a complete example. Basic usage:

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
    requests.post(f"{BASE_URL}/upload/", headers=headers, files={'file': f})

# 4. Download file
content = requests.get(f"{BASE_URL}/files/myfile.txt", headers=headers).text
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
- `DELETE /api/delete/{path}` - Delete file or directory

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

## Project Structure

```
fileserver/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── database.py      # Database configuration
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── crud.py          # Database operations
│   └── auth.py          # Authentication utilities
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api.js       # API client
│   │   ├── App.jsx      # Main app component
│   │   └── index.css    # Styles
│   └── dist/            # Built frontend (served by backend)
├── storage/             # File storage directory
├── client_script.py     # Python API example
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Security Notes

1. **Change Default Credentials:** The default admin password should be changed immediately
2. **Secret Key:** Update the `SECRET_KEY` in `backend/auth.py` for production
3. **HTTPS:** Use a reverse proxy (nginx, Caddy) with HTTPS in production
4. **Path Traversal:** The server includes path traversal protection
5. **User Isolation:** Users can only access files within their assigned root path

## User Access Control

When creating users, you can restrict their access:

- **Root Path:** Set to `/` for full access, or `/subfolder` to restrict to a specific directory
- **Admin:** Admin users can access the user management panel and have full permissions

Example:
- User `john` with root path `/john` can only access files in `storage/john/`
- Admin users can access all files regardless of root path

## Development

### Rebuild Frontend

```bash
cd frontend
npm install
npm run build
```

### Run in Development Mode

Backend:
```bash
python -m uvicorn backend.main:app --reload --port 30815
```

Frontend:
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

## License

This project is provided as-is for educational and personal use.
