#!/bin/bash

# FileServer - Build Script for Linux
# This script builds a standalone executable for Linux using PyInstaller

echo "============================================================"
echo "FileServer - Building Linux Executable"
echo "============================================================"
echo ""

# Check if PyInstaller is installed
if ! python3 -c "import PyInstaller" 2>/dev/null; then
    echo "Installing PyInstaller..."
    pip3 install pyinstaller
    echo ""
fi

# Check if executable exists
if [ ! -f "dist/FileServer.exe" ]; then
    echo "ERROR: FileServer.exe not found in dist folder!"
    echo ""
    echo "Please build the executable first:"
    echo "  python3 -m PyInstaller fileserver.spec --clean"
    echo ""
    exit 1
fi

echo "Building Linux executable..."
echo "This may take a few minutes..."
echo ""

# Build the executable
python3 -m PyInstaller fileserver-linux.spec --clean

if [ $? -ne 0 ]; then
    echo ""
    echo "============================================================"
    echo "BUILD FAILED"
    echo "============================================================"
    exit 1
fi

echo ""
echo "============================================================"
echo "BUILD SUCCESSFUL"
echo "============================================================"
echo ""
echo "The executable has been created in the 'dist' folder:"
ls -lh dist/FileServer 2>/dev/null || ls -lh dist/fileserver 2>/dev/null
echo ""
echo "To run the application:"
echo "  ./dist/FileServer"
echo "or"
echo "  ./dist/fileserver"
echo ""
echo "The server will start on: http://localhost:30815"
echo "============================================================"
echo ""
