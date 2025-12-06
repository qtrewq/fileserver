#!/bin/bash

# FileServer - Run Script for Linux
# Simple launcher for the FileServer executable

echo "============================================================"
echo "FileServer - Secure File Management System"
echo "============================================================"
echo ""
echo "Starting server..."
echo ""
echo "The server will be available at: http://localhost:30815"
echo ""
echo "Press CTRL+C to stop the server"
echo "============================================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the executable
"$SCRIPT_DIR/dist/fileserver"
