# FileServer - Linux Port Complete

## ✅ Linux Support Added!

FileServer is now fully cross-platform with complete Linux support including multiple deployment options.

## What Was Created

### 1. Build Scripts

**`build-linux.sh`** - Automated build script for Linux
- Checks for PyInstaller
- Builds standalone executable
- Creates `dist/fileserver` binary

**`fileserver-linux.spec`** - PyInstaller configuration for Linux
- Same dependencies as Windows version
- Optimized for Linux systems
- Creates single-file executable

### 2. Run Scripts

**`run-linux.sh`** - Simple launcher script
- Starts the FileServer executable
- Shows startup information
- Easy to use

### 3. System Service

**`install-linux.sh`** - Production installation script
- Installs to `/opt/fileserver`
- Creates systemd service
- Sets up `fileserver` system user
- Configures permissions
- Enables auto-start on boot

### 4. Docker Support

**`Dockerfile`** - Container image definition
- Based on Python 3.11 slim
- Optimized for production
- Includes all dependencies

**`docker-compose.yml`** - Easy deployment
- One-command startup
- Persistent data volumes
- Health checks
- Auto-restart

### 5. Documentation

**`LINUX_GUIDE.md`** - Comprehensive Linux guide
- Installation methods
- Configuration options
- Systemd service management
- Nginx reverse proxy setup
- Troubleshooting
- Security recommendations

**`DOCKER_GUIDE.md`** - Docker deployment guide
- Quick start instructions
- Docker Compose examples
- Production configurations
- Backup procedures
- Resource management

## Deployment Options

### Option 1: Standalone Executable

```bash
# Build
chmod +x build-linux.sh
./build-linux.sh

# Run
./dist/fileserver
```

**Best for**: Development, testing, single-user setups

### Option 2: System Service

```bash
# Install
sudo chmod +x install-linux.sh
sudo ./install-linux.sh

# Manage
sudo systemctl start fileserver
sudo systemctl enable fileserver
```

**Best for**: Production servers, multi-user environments

### Option 3: Docker

```bash
# Quick start
docker-compose up -d

# Or manual
docker build -t fileserver .
docker run -d -p 30815:30815 -v data:/app/storage fileserver
```

**Best for**: Cloud deployments, containerized infrastructure

### Option 4: From Source

```bash
# Install dependencies
pip3 install -r requirements.txt

# Build frontend
cd frontend && npm install && npm run build && cd ..

# Run
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
```

**Best for**: Development, customization

## Platform Support

### Windows
- ✅ Standalone executable (`FileServer.exe`)
- ✅ Inno Setup installer
- ✅ Build scripts (`build.bat`)
- ✅ Run scripts (`run.bat`)

### Linux
- ✅ Standalone executable (`fileserver`)
- ✅ Systemd service
- ✅ Build scripts (`build-linux.sh`)
- ✅ Run scripts (`run-linux.sh`)
- ✅ Installation script (`install-linux.sh`)
- ✅ Docker support
- ✅ Docker Compose

### Supported Distributions
- Ubuntu 20.04+
- Debian 11+
- CentOS 8+
- RHEL 8+
- Fedora 35+
- Any modern Linux with Python 3.8+

## Features

All features work identically on both platforms:
- ✅ File management
- ✅ Real-time collaboration
- ✅ User management
- ✅ Group permissions
- ✅ File sharing
- ✅ Python execution
- ✅ WebSocket support
- ✅ Auto-save
- ✅ Forced password change
- ✅ Admin controls

## File Structure

```
fileserver/
├── Windows Files
│   ├── build.bat
│   ├── run.bat
│   ├── fileserver.spec
│   ├── build_installer.bat
│   └── installer.iss
│
├── Linux Files
│   ├── build-linux.sh
│   ├── run-linux.sh
│   ├── fileserver-linux.spec
│   └── install-linux.sh
│
├── Docker Files
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── Documentation
│   ├── README.md
│   ├── LINUX_GUIDE.md
│   ├── DOCKER_GUIDE.md
│   ├── README_EXECUTABLE.md
│   └── INSTALLER_GUIDE.md
│
├── Application
│   ├── backend/
│   ├── frontend/
│   ├── launcher.py
│   └── requirements.txt
│
└── Configuration
    ├── LICENSE.txt
    └── .gitignore
```

## Quick Start by Platform

### Windows

```bash
# Build
build.bat

# Run
dist\FileServer.exe

# Or create installer
build_installer.bat
```

### Linux

```bash
# Build
chmod +x build-linux.sh
./build-linux.sh

# Run
./dist/fileserver

# Or install as service
sudo ./install-linux.sh
sudo systemctl start fileserver
```

### Docker (Any Platform)

```bash
# Build frontend first
cd frontend && npm install && npm run build && cd ..

# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:30815
```

## System Requirements

### Windows
- Windows 10 or later
- ~30MB disk space for executable
- Port 30815 available

### Linux
- Any modern Linux distribution
- Python 3.8+ (for building)
- ~30MB disk space for executable
- Port 30815 available

### Docker
- Docker 20.10+
- Docker Compose 1.29+ (optional)
- ~200MB for image
- Port 30815 available

## Default Credentials

**All Platforms**:
- Username: `admin`
- Password: `adminpassword`

⚠️ **IMPORTANT**: Change on first login!

## Next Steps

1. **Choose your platform** (Windows, Linux, or Docker)
2. **Follow the appropriate guide**:
   - Windows: `README_EXECUTABLE.md` or `INSTALLER_GUIDE.md`
   - Linux: `LINUX_GUIDE.md`
   - Docker: `DOCKER_GUIDE.md`
3. **Build or deploy** using the provided scripts
4. **Access** at `http://localhost:30815`
5. **Change default password** immediately

## Production Deployment

### Linux with Nginx

```bash
# Install as service
sudo ./install-linux.sh

# Configure Nginx reverse proxy
# See LINUX_GUIDE.md for configuration

# Enable HTTPS with Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

### Docker with Traefik

```bash
# Use Docker Compose with Traefik labels
# See DOCKER_GUIDE.md for configuration

docker-compose up -d
```

## Support

- **General**: See `README.md`
- **Windows**: See `README_EXECUTABLE.md`, `INSTALLER_GUIDE.md`
- **Linux**: See `LINUX_GUIDE.md`
- **Docker**: See `DOCKER_GUIDE.md`
- **Issues**: https://github.com/qtrewq/fileserver/issues

## License

MIT License - See `LICENSE.txt`

## Summary

FileServer is now a truly cross-platform application with:
- ✅ Windows support (executable + installer)
- ✅ Linux support (executable + systemd service)
- ✅ Docker support (containerized deployment)
- ✅ Comprehensive documentation for all platforms
- ✅ Production-ready deployment options
- ✅ All features working identically across platforms

Choose the deployment method that best fits your needs!
