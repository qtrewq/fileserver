# Linux Installer Build Guide

## Overview
The `build_linux_installer.bat` script creates a distributable Linux package (.tar.gz) that can be installed on any Linux system.

## What It Does

### 1. Package Creation
- Creates a tarball (`.tar.gz`) containing all necessary files
- Excludes user data (storage contents, databases)
- Excludes build artifacts (node_modules, __pycache__, etc.)

### 2. Included Files
The package includes:
- **Application Code**: Backend Python files, Frontend source
- **Scripts**: Installation scripts, build scripts, run scripts
- **Configuration**: Docker files, environment examples
- **Documentation**: README.md, LICENSE files, INSTALL.txt
- **Empty Storage**: Creates storage directory structure

### 3. Excluded Files
- User data (fileserver.db, storage contents)
- Build artifacts (__pycache__, *.pyc, *.pyo)
- Node modules (node_modules/)
- Log files (*.log)
- Package lock files

## How to Use

### On Windows (Building the Package)
```batch
.\build_linux_installer.bat
```

This will create: `installer_output\fileserver-linux-1.0.0.tar.gz`

### On Linux (Installing the Package)

#### Method 1: Automated Installation (Recommended)
```bash
# Extract the package
tar -xzf fileserver-linux-1.0.0.tar.gz
cd fileserver-linux-1.0.0

# Run installation script as root
sudo bash install-linux.sh

# Start the service
sudo systemctl start fileserver
sudo systemctl enable fileserver
```

#### Method 2: Manual Installation
```bash
# Extract the package
tar -xzf fileserver-linux-1.0.0.tar.gz
cd fileserver-linux-1.0.0

# Install Python dependencies
pip3 install -r requirements.txt

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Run the application
python3 launcher.py
```

#### Method 3: Docker Installation
```bash
# Extract the package
tar -xzf fileserver-linux-1.0.0.tar.gz
cd fileserver-linux-1.0.0

# Run with Docker Compose
docker-compose up -d
```

## Requirements

### Windows (for building)
- Windows 10 or later (includes built-in tar command)
- OR Git for Windows / WSL for older versions

### Linux (for installation)
- **Method 1 (systemd)**: Python 3.8+, systemd, root access
- **Method 2 (manual)**: Python 3.8+, Node.js 14+, npm
- **Method 3 (Docker)**: Docker and Docker Compose

## Output
- Package: `installer_output/fileserver-linux-1.0.0.tar.gz`
- Size: Approximately 5-10 MB (without node_modules)
- Format: Compressed tarball (gzip)

## Notes
- The package is platform-independent (source code)
- Users need to build/install dependencies on their Linux system
- For a pre-built binary, use PyInstaller on Linux to create the executable first
- Default credentials: admin / adminpassword (change after first login!)
