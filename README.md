# FileServer - Secure File Management System

A modern, secure file management system with real-time collaboration features.

## Features

- 🔐 **Secure Authentication** - Role-based access control with user and group management
- 📁 **File Management** - Upload, download, organize files and folders
- 🤝 **Real-time Collaboration** - Multiple users can edit files simultaneously with live updates
- 🔄 **Auto-save** - Files automatically save as you type (1-second debounce)
- 🔗 **File Sharing** - Share files and folders with other users
- 🐍 **Python Execution** - Run Python scripts directly in the browser
- 🎨 **Modern UI** - Beautiful, responsive interface with dark mode

## Quick Start (Standalone Executable)

### Option 1: Run Pre-built Executable

1. **Build the executable** (first time only):
   ```bash
   python -m PyInstaller fileserver.spec --clean
   ```

2. **Run the application**:
   - Double-click `run.bat`
   - Or run `dist\FileServer.exe` directly

3. **Access the application**:
   - Open your browser to `http://localhost:30815`
   - Default admin credentials: `admin` / `adminpassword`
   - **Change the password immediately after first login!**

### Option 2: Run from Source

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Build frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. **Start the server**:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
   ```

## Building the Executable

To create a standalone executable:

```bash
# Install PyInstaller
pip install pyinstaller

# Build the executable
python -m PyInstaller fileserver.spec --clean
```

The executable will be created in the `dist` folder (~16MB).

## Project Structure

```
fileserver/
├── backend/              # FastAPI backend
│   ├── main.py          # Main application
│   ├── models.py        # Database models
│   ├── schemas.py       # Pydantic schemas
│   ├── crud.py          # Database operations
│   ├── auth.py          # Authentication logic
│   └── python_runner.py # Python execution engine
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api.js      # API client
│   │   └── App.jsx     # Main app component
│   └── dist/           # Built frontend (after npm build)
├── storage/            # User file storage
├── launcher.py         # Executable launcher
├── fileserver.spec     # PyInstaller configuration
├── build.bat          # Build script
└── run.bat            # Run script

```

## Configuration

### Environment Variables

- `STORAGE_ROOT` - Directory for file storage (default: `./storage`)
- `SECRET_KEY` - JWT secret key (auto-generated if not set)
- `MAX_FILE_SIZE_MB` - Maximum file size in MB (default: 100)
- `MAX_TOTAL_UPLOAD_SIZE_MB` - Maximum total upload size (default: 500)

### Default Permissions

Users can be assigned to groups with different permission levels:
- **Super Admins** - Full system access
- **Admins** - User and group management
- **Users** - File access based on group permissions

## Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on login attempts
- ✅ Account lockout after failed attempts
- ✅ Path traversal protection
- ✅ File type restrictions
- ✅ Permission-based access control

## Email Configuration

The server supports sending password reset emails.
See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed configuration instructions.

Supported Modes:
- **Gmail (Recommended)**: Use your Gmail account with an App Password.
- **Relay**: Use a custom SMTP provider (Brevo, Mailgun).
- **Direct**: Send directly (blocked by most residential ISPs).

## Real-time Collaboration

The application supports real-time collaboration features:
- **Live Editing** - See changes from other users in real-time
- **Cursor Tracking** - See where other users are editing
- **Active Users** - View who else is editing the file
- **Auto-sync** - Changes automatically save and sync across all users

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Uvicorn** - ASGI server
- **JWT** - Authentication tokens
- **Passlib** - Password hashing
- **WebSockets** - Real-time communication

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Tailwind CSS** - Styling (via custom CSS)

## Development

### Running in Development Mode

**Backend:**
```bash
python -m uvicorn backend.main:app --reload --port 30815
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Build executable
python -m PyInstaller fileserver.spec --clean
```

## Troubleshooting

### Port Already in Use
If port 30815 is already in use, you can change it in:
- `launcher.py` (for executable)
- Command line when running uvicorn directly

### Permission Errors
- Ensure the `storage` directory is writable
- On Windows, run as Administrator if needed

### Database Issues
- Delete `fileserver.db` to reset the database
- Default admin user will be recreated on next startup

### WebSocket Connection Issues
- Check firewall settings
- Ensure port 30815 is accessible
- Verify both HTTP and WebSocket protocols are allowed

## License

This project is provided as-is for educational and personal use.

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.
