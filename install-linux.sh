#!/bin/bash

# FileServer - Installation Script for Linux
# This script installs FileServer as a systemd service

set -e

echo "============================================================"
echo "FileServer - Linux Installation Script"
echo "============================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Default installation directory
INSTALL_DIR="/opt/fileserver"
DATA_DIR="/var/lib/fileserver"
SERVICE_USER="fileserver"

echo "Installation directories:"
echo "  Application: $INSTALL_DIR"
echo "  Data: $DATA_DIR"
echo ""

# Create user if doesn't exist
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "Creating service user: $SERVICE_USER"
    useradd -r -s /bin/false -d "$DATA_DIR" "$SERVICE_USER"
fi

# Create directories
echo "Creating directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR"

# Copy files
echo "Copying application files..."
cp -r dist/fileserver "$INSTALL_DIR/"
cp -r frontend/dist "$INSTALL_DIR/frontend/"
cp -r backend "$INSTALL_DIR/"
cp README.md "$INSTALL_DIR/" 2>/dev/null || true
cp LICENSE.txt "$INSTALL_DIR/" 2>/dev/null || true

# Set permissions
echo "Setting permissions..."
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$DATA_DIR"
chmod +x "$INSTALL_DIR/fileserver"

# Create systemd service file
echo "Creating systemd service..."
cat > /etc/systemd/system/fileserver.service << EOF
[Unit]
Description=FileServer - Secure File Management System
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
Environment="STORAGE_ROOT=$DATA_DIR"
ExecStart=$INSTALL_DIR/fileserver
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "Reloading systemd..."
systemctl daemon-reload

echo ""
echo "============================================================"
echo "Installation Complete!"
echo "============================================================"
echo ""
echo "To start FileServer:"
echo "  sudo systemctl start fileserver"
echo ""
echo "To enable on boot:"
echo "  sudo systemctl enable fileserver"
echo ""
echo "To check status:"
echo "  sudo systemctl status fileserver"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u fileserver -f"
echo ""
echo "Access the application at: http://localhost:30815"
echo "Default credentials: admin / adminpassword"
echo ""
echo "Data directory: $DATA_DIR"
echo "============================================================"
