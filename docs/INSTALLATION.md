# FileServer Installation Guide

This guide covers all methods to install and run the FileServer application.

## Table of Contents
1. [Windows Installation](#windows-installation)
2. [Linux Installation](#linux-installation)
3. [Running from Source](#running-from-source-any-os)
4. [Docker Installation](#docker-installation)

---

## Windows Installation

### Method 1: Pre-built Installer (Recommended)
1. Download `FileServerSetup.exe`.
2. Double-click the installer and follow the prompts.
3. Once installed, launch "FileServer" from your Start Menu.
4. The server console will open, and your default browser will launch to `http://localhost:30815`.

### Method 2: Standalone Executable
1. Download `fileserver-win.zip`.
2. Extract the contents to a folder of your choice.
3. Double-click `FileServer.exe` inside the folder.

### Default Login
- **Username**: `admin`
- **Password**: `adminpassword`
> **Important**: Change this password immediately in the "Account Settings" menu!

---

## Linux Installation

### Method 1: Automated Installer (Ubuntu/Debian)
1. Download `fileserver-linux-[VERSION].tar.gz`.
2. Open a terminal and extract the archive:
   ```bash
   tar -xzf fileserver-linux-[VERSION].tar.gz
   cd fileserver-linux-[VERSION]
   ```
3. Run the installation script as root:
   ```bash
   sudo bash install-linux.sh
   ```
4. Start the server:
   ```bash
   # Start in background
   sudo systemctl start fileserver
   
   # Enable on boot
   sudo systemctl enable fileserver
   ```

### Method 2: Manual Run
1. Extract the archive.
2. Run the executable directly:
   ```bash
   ./run-linux.sh
   ```

---

## Running from Source (Any OS)

If you want to modify the code or run on a non-standard platform.

### Prerequisites
- **Python 3.8+**: [Download Python](https://www.python.org/downloads/)
- **Node.js 16+**: [Download Node.js](https://nodejs.org/) (Required only for building frontend)

### Steps

1. **Clone or Download the Repository**
   ```bash
   git clone https://github.com/yourusername/fileserver.git
   cd fileserver
   ```

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Build the Frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

4. **Start the Server**
   ```bash
   # Windows
   run.bat
   
   # Linux/Mac
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
   ```

---

## Docker Installation

1. **Ensure Docker is installed**.
2. Run using Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Access at `http://localhost:30815`.

### Persisting Data
To ensure your files are saved when the container restarts, map the storage volume in `docker-compose.yml`:
```yaml
volumes:
  - ./storage:/app/storage
  - ./fileserver.db:/app/fileserver.db
```
