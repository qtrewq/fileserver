# FileServer v1.0.0 - Initial Release

## 🎉 Features

### Core Functionality
- **Secure File Management** - Upload, download, organize files and folders with drag-and-drop support
- **User Authentication** - JWT-based authentication with role-based access control
- **User & Group Management** - Create users, assign permissions, manage groups
- **File Sharing** - Share files and folders with other users with customizable permissions

### Real-time Collaboration ✨
- **Live Editing** - Multiple users can edit files simultaneously with real-time updates
- **Auto-save** - Files automatically save as you type (1-second debounce)
- **Cursor Tracking** - See where other users are editing
- **Active Users** - View who else is editing the file
- **WebSocket Sync** - Instant synchronization across all connected clients

### Advanced Features
- **Python Execution** - Run Python scripts directly in the browser with isolated environments
- **Package Management** - Install Python packages on-the-fly for script execution
- **Syntax Highlighting** - Code editor with syntax highlighting for multiple languages
- **File Preview** - View text files, code, and more directly in the browser

### Security
- ✅ JWT-based authentication with secure token handling
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on login attempts
- ✅ Account lockout after failed attempts
- ✅ Path traversal protection
- ✅ File type restrictions
- ✅ Permission-based access control
- ✅ Session management

### User Experience
- 🎨 Modern, responsive UI with dark mode
- 🚀 Fast and lightweight
- 📱 Mobile-friendly interface
- ⚡ Real-time updates without page refresh
- 🔍 File search and filtering
- 📊 Storage usage tracking

## 📦 Installation Options

### Option 1: Standalone Executable (Windows)
1. Download `FileServer.exe` from the release assets
2. Run the executable - no installation required!
3. Access the application at `http://localhost:30815`

### Option 2: Run from Source
```bash
# Clone the repository
git clone https://github.com/qtrewq/fileserver.git
cd fileserver

# Install Python dependencies
pip install -r requirements.txt

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Start the server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
```

## 🔐 Default Credentials

- **Username:** `admin`
- **Password:** `adminpassword`

**⚠️ IMPORTANT:** Change the admin password immediately after first login!

## 📋 System Requirements

- **OS:** Windows 10 or later (executable) / Any OS with Python 3.8+ (source)
- **Browser:** Modern web browser (Chrome, Firefox, Edge, Safari)
- **Port:** 30815 must be available
- **Storage:** Varies based on file storage needs

## 🛠️ Technology Stack

**Backend:**
- FastAPI - Modern Python web framework
- SQLAlchemy - ORM for database operations
- Uvicorn - ASGI server
- WebSockets - Real-time communication
- JWT - Authentication
- Passlib - Password hashing

**Frontend:**
- React - UI framework
- Vite - Build tool
- Axios - HTTP client
- Custom CSS - Styling

## 📝 What's New in v1.0.0

- Initial stable release
- Complete file management system
- Real-time collaboration features
- Python script execution
- User and group management
- Standalone executable for Windows
- Comprehensive documentation

## 🐛 Known Issues

None at this time. Please report any issues on GitHub!

## 📚 Documentation

- [README.md](README.md) - Full project documentation
- [README_EXECUTABLE.md](README_EXECUTABLE.md) - Executable user guide

## 🙏 Credits

Built with modern web technologies and best practices for security and performance.

## 📄 License

This project is provided as-is for educational and personal use.

---

**Full Changelog:** Initial Release
