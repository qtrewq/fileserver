# FileServer Installation Contents

## What's Included in the Installer

This installer includes the complete FileServer package with both the executable and full source code.

### Executable (Ready to Run)
- **FileServer.exe** - Standalone executable (~28.6 MB)
  - No Python installation required
  - All dependencies bundled
  - Ready to run immediately

### Complete Source Code
All source files are included so you can:
- Modify the application
- Run from source with Python
- Rebuild the executable
- Customize features
- Learn from the code

### Directory Structure After Installation

```
C:\Program Files\FileServer\
├── FileServer.exe              # Main executable
├── run.bat                     # Launch script (auto-generated)
│
├── Documentation/
│   ├── README.md              # Main documentation
│   ├── README_EXECUTABLE.md   # Executable guide
│   ├── RELEASE_NOTES.md       # Version info
│   ├── LICENSE.txt            # MIT License
│   ├── INSTALLER_GUIDE.md     # Installer documentation
│   └── INSTALLATION_OPTIONS.md # Distribution options
│
├── Python Source/
│   ├── launcher.py            # Executable launcher
│   ├── requirements.txt       # Python dependencies
│   ├── fileserver.spec        # PyInstaller config
│   ├── backend/               # Backend Python code
│   │   ├── main.py           # FastAPI application
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── crud.py           # Database operations
│   │   ├── auth.py           # Authentication
│   │   ├── database.py       # Database config
│   │   └── python_runner.py  # Python execution
│   │
│   └── frontend/              # React frontend
│       ├── src/              # Source code
│       ├── dist/             # Built files
│       ├── public/           # Static assets
│       ├── index.html        # Main HTML
│       ├── package.json      # NPM config
│       └── vite.config.js    # Vite config
│
├── Build Scripts/
│   ├── build.bat             # Build executable
│   └── build_installer.bat   # Build installer
│
└── Configuration/
    └── .gitignore            # Git ignore rules
```

### Data Directory (Separate)
During installation, you choose where to store user data:
- **Default**: `C:\Program Files\FileServer\storage`
- **Custom**: Any location you choose

This directory contains:
- User uploaded files
- SQLite database (fileserver.db)
- User accounts and permissions

**Note**: This directory is NOT removed when uninstalling to preserve your data.

## Running FileServer

### Option 1: Use the Executable (Recommended)
```
Start Menu → FileServer
or
Desktop Icon (if created)
or
Double-click: C:\Program Files\FileServer\FileServer.exe
```

### Option 2: Run from Source
If you have Python 3.8+ installed:

```bash
# Install dependencies
cd "C:\Program Files\FileServer"
pip install -r requirements.txt

# Install frontend dependencies (optional, for development)
cd frontend
npm install
npm run build
cd ..

# Run the server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
```

## Modifying the Application

All source code is included, so you can:

1. **Edit Backend Code**
   - Modify `backend/*.py` files
   - Add new API endpoints
   - Change authentication logic
   - Customize permissions

2. **Edit Frontend Code**
   - Modify `frontend/src/components/*.jsx`
   - Change UI design
   - Add new features
   - Customize styling

3. **Rebuild Executable**
   ```bash
   # After making changes
   python -m PyInstaller fileserver.spec --clean
   ```

4. **Rebuild Installer**
   ```bash
   # After rebuilding executable
   build_installer.bat
   ```

## What's NOT Included

To keep the installer clean and respect privacy:
- ❌ User uploaded files
- ❌ Database with user accounts
- ❌ Any existing user data
- ❌ node_modules (frontend dependencies)
- ❌ Python virtual environments
- ❌ Build artifacts
- ❌ Log files

## File Sizes

- **Installer**: ~30-35 MB
- **After Installation**: ~50-60 MB
  - Executable: ~28.6 MB
  - Source code: ~5 MB
  - Frontend built files: ~15 MB
  - Documentation: ~1 MB

## Uninstallation

When uninstalling:
- ✅ Removes all program files
- ✅ Removes shortcuts
- ✅ Cleans up registry entries
- ❌ **Preserves** your data directory (user files and database)

To completely remove everything:
1. Uninstall via Windows Settings or Control Panel
2. Manually delete the data directory if desired

## Support

- **Documentation**: See README.md in installation folder
- **Issues**: https://github.com/qtrewq/fileserver/issues
- **Source**: https://github.com/qtrewq/fileserver

## License

FileServer is licensed under the MIT License. See LICENSE.txt for details.

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Use privately
- ✅ Sublicense
