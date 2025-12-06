"""
FileServer - Storage Diagnostic Tool
This script helps diagnose storage path issues
"""
import os
import sqlite3
from pathlib import Path

print("=" * 60)
print("FileServer Storage Diagnostic")
print("=" * 60)
print()

# Check current directory
print(f"Current directory: {os.getcwd()}")
print()

# Check STORAGE_ROOT environment variable
storage_root = os.environ.get('STORAGE_ROOT', 'Not set')
print(f"STORAGE_ROOT env var: {storage_root}")
print()

# Check if storage directory exists
storage_path = Path('storage')
print(f"Storage directory exists: {storage_path.exists()}")
if storage_path.exists():
    print(f"Storage directory path: {storage_path.absolute()}")
    print(f"Storage directory contents:")
    try:
        items = list(storage_path.iterdir())
        if items:
            for item in items[:10]:  # Show first 10 items
                print(f"  - {item.name} {'(dir)' if item.is_dir() else f'({item.stat().st_size} bytes)'}")
            if len(items) > 10:
                print(f"  ... and {len(items) - 10} more items")
        else:
            print("  (empty)")
    except Exception as e:
        print(f"  Error reading directory: {e}")
print()

# Check database
db_path = Path('fileserver.db')
print(f"Database exists: {db_path.exists()}")
if db_path.exists():
    print(f"Database path: {db_path.absolute()}")
    try:
        conn = sqlite3.connect('fileserver.db')
        cursor = conn.cursor()
        
        # Get users
        cursor.execute('SELECT username, root_path, is_admin, is_super_admin FROM users')
        users = cursor.fetchall()
        print(f"\nUsers in database ({len(users)}):")
        for username, root_path, is_admin, is_super_admin in users:
            admin_str = "admin" if is_admin else "user"
            super_str = " (super)" if is_super_admin else ""
            print(f"  - {username}: root_path='{root_path}' [{admin_str}{super_str}]")
        
        conn.close()
    except Exception as e:
        print(f"  Error reading database: {e}")
print()

# Recommendations
print("=" * 60)
print("Recommendations:")
print("=" * 60)
print()

if storage_root == 'Not set':
    print("⚠ STORAGE_ROOT environment variable is not set")
    print("  Solution: Set STORAGE_ROOT to point to your storage directory")
    print(f"  Example: set STORAGE_ROOT={storage_path.absolute()}")
    print()

if not storage_path.exists():
    print("⚠ Storage directory does not exist")
    print("  Solution: Create the storage directory or check STORAGE_ROOT path")
    print()

print("To fix file access issues:")
print("1. Make sure you're logged in as the correct user")
print("2. Check that the user's root_path exists in the storage directory")
print("3. Verify STORAGE_ROOT environment variable points to the correct location")
print("4. If running from executable, storage is in the same folder as the .exe")
print()
print("=" * 60)
