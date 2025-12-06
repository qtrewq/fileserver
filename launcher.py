"""
FileServer - Standalone Application Launcher
This script starts the FastAPI server with the bundled frontend.
"""
import os
import sys
import uvicorn
from pathlib import Path

def get_base_path():
    """Get the base path for the application (handles PyInstaller bundling)"""
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        return Path(sys._MEIPASS)
    else:
        # Running as script
        return Path(__file__).parent

def main():
    """Main entry point for the application"""
    base_path = get_base_path()
    
    # Set environment variables
    os.environ.setdefault('STORAGE_ROOT', str(base_path / 'storage'))
    
    # Ensure storage directory exists
    storage_path = Path(os.environ['STORAGE_ROOT'])
    storage_path.mkdir(exist_ok=True)
    
    print("=" * 60)
    print("FileServer - Secure File Management System")
    print("=" * 60)
    print(f"Storage location: {storage_path}")
    print(f"Server starting on: http://localhost:30815")
    print("=" * 60)
    print("\nPress CTRL+C to stop the server\n")
    
    # Start the server
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=30815,
        log_level="info"
    )

if __name__ == "__main__":
    main()
