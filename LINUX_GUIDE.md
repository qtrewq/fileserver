# FileServer - Linux Installation Guide

## Overview

FileServer is now available for Linux! This guide covers installation, configuration, and deployment on Linux systems.

## System Requirements

- **OS**: Ubuntu 20.04+, Debian 11+, CentOS 8+, or any modern Linux distribution
- **Python**: 3.8 or higher (for building from source)
- **Architecture**: x86_64 (AMD64)
- **RAM**: 512MB minimum, 1GB recommended
- **Disk**: 100MB for application, varies for data storage

## Installation Methods

### Method 1: Standalone Executable (Recommended)

The easiest way to run FileServer on Linux.

#### Step 1: Build the Executable

On a Linux machine with Python 3.8+:

```bash
# Install dependencies
pip3 install -r requirements.txt

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Build Linux executable
chmod +x build-linux.sh
./build-linux.sh
```

#### Step 2: Run the Application

```bash
# Make executable runnable
chmod +x dist/fileserver

# Run directly
./dist/fileserver

# Or use the run script
chmod +x run-linux.sh
./run-linux.sh
```

The server will start on `http://localhost:30815`

### Method 2: System Service (Production)

Install FileServer as a systemd service for production use.

#### Installation

```bash
# Run the installation script as root
sudo chmod +x install-linux.sh
sudo ./install-linux.sh
```

This will:
- Install to `/opt/fileserver`
- Create data directory at `/var/lib/fileserver`
- Create `fileserver` system user
- Set up systemd service
- Configure permissions

#### Managing the Service

```bash
# Start the service
sudo systemctl start fileserver

# Enable on boot
sudo systemctl enable fileserver

# Check status
sudo systemctl status fileserver

# View logs
sudo journalctl -u fileserver -f

# Stop the service
sudo systemctl stop fileserver

# Restart the service
sudo systemctl restart fileserver
```

### Method 3: Run from Source

For development or if you prefer not to use the executable.

```bash
# Install Python dependencies
pip3 install -r requirements.txt

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Run the server
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
```

## Configuration

### Environment Variables

Set these before running FileServer:

```bash
# Data storage location
export STORAGE_ROOT=/var/lib/fileserver

# Server port (default: 30815)
export PORT=30815

# Server host (default: 0.0.0.0)
export HOST=0.0.0.0
```

### Systemd Service Configuration

Edit `/etc/systemd/system/fileserver.service`:

```ini
[Service]
Environment="STORAGE_ROOT=/var/lib/fileserver"
Environment="PORT=30815"
Environment="HOST=0.0.0.0"
```

After editing, reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart fileserver
```

## Firewall Configuration

### UFW (Ubuntu/Debian)

```bash
sudo ufw allow 30815/tcp
sudo ufw reload
```

### firewalld (CentOS/RHEL)

```bash
sudo firewall-cmd --permanent --add-port=30815/tcp
sudo firewall-cmd --reload
```

## Nginx Reverse Proxy (Optional)

For production deployments with HTTPS:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:30815;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://localhost:30815;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable HTTPS with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Building the Executable

### Prerequisites

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm

# CentOS/RHEL
sudo yum install python3 python3-pip nodejs npm

# Install PyInstaller
pip3 install pyinstaller
```

### Build Process

```bash
# Clone or navigate to the repository
cd fileserver

# Install Python dependencies
pip3 install -r requirements.txt

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Build executable
python3 -m PyInstaller fileserver-linux.spec --clean
```

The executable will be created at `dist/fileserver`

## File Locations

### Standalone Mode
- **Executable**: `./dist/fileserver`
- **Data**: `./storage/` (or `$STORAGE_ROOT`)
- **Database**: `./fileserver.db`

### System Service Mode
- **Application**: `/opt/fileserver/`
- **Data**: `/var/lib/fileserver/`
- **Database**: `/var/lib/fileserver/fileserver.db`
- **Service**: `/etc/systemd/system/fileserver.service`
- **Logs**: `journalctl -u fileserver`

## Default Credentials

- **Username**: `admin`
- **Password**: `adminpassword`

⚠️ **IMPORTANT**: Change the password immediately after first login!

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 30815
sudo lsof -i :30815

# Kill the process
sudo kill -9 <PID>
```

### Permission Denied

```bash
# Make executable runnable
chmod +x dist/fileserver

# Fix data directory permissions
sudo chown -R fileserver:fileserver /var/lib/fileserver
```

### Service Won't Start

```bash
# Check logs
sudo journalctl -u fileserver -n 50

# Check service status
sudo systemctl status fileserver

# Verify executable exists
ls -l /opt/fileserver/fileserver
```

### Database Locked

```bash
# Stop the service
sudo systemctl stop fileserver

# Remove lock file
sudo rm /var/lib/fileserver/fileserver.db-journal

# Restart service
sudo systemctl start fileserver
```

## Updating

### Standalone Mode

```bash
# Rebuild the executable
./build-linux.sh

# Restart the application
```

### System Service Mode

```bash
# Stop the service
sudo systemctl stop fileserver

# Replace the executable
sudo cp dist/fileserver /opt/fileserver/

# Update frontend if needed
sudo cp -r frontend/dist /opt/fileserver/frontend/

# Set permissions
sudo chown -R fileserver:fileserver /opt/fileserver

# Restart the service
sudo systemctl start fileserver
```

## Uninstallation

### Standalone Mode

```bash
# Just delete the directory
rm -rf fileserver/
```

### System Service Mode

```bash
# Stop and disable service
sudo systemctl stop fileserver
sudo systemctl disable fileserver

# Remove service file
sudo rm /etc/systemd/system/fileserver.service

# Reload systemd
sudo systemctl daemon-reload

# Remove application
sudo rm -rf /opt/fileserver

# Remove data (optional - this deletes user files!)
sudo rm -rf /var/lib/fileserver

# Remove user
sudo userdel fileserver
```

## Security Recommendations

1. **Change default password** immediately
2. **Use HTTPS** in production (nginx + Let's Encrypt)
3. **Configure firewall** to restrict access
4. **Regular backups** of `/var/lib/fileserver`
5. **Keep system updated**: `sudo apt update && sudo apt upgrade`
6. **Monitor logs**: `sudo journalctl -u fileserver -f`

## Performance Tuning

### For High Traffic

Edit `/etc/systemd/system/fileserver.service`:

```ini
[Service]
Environment="WORKERS=4"
ExecStart=/opt/fileserver/fileserver --workers 4
```

### Resource Limits

```ini
[Service]
LimitNOFILE=65536
LimitNPROC=4096
```

## Support

For issues specific to Linux:
- Check logs: `sudo journalctl -u fileserver`
- Verify permissions: `ls -la /opt/fileserver`
- Test connectivity: `curl http://localhost:30815`

## License

FileServer is licensed under the MIT License. See LICENSE.txt for details.
