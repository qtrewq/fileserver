# FileServer - Storage Access Fix

## Issue

You can't see your files in FileServer even though they exist in the `storage` folder.

## Root Cause

The `STORAGE_ROOT` environment variable is not set, which means the server might be looking for files in the wrong location or using a default path that doesn't match where your files are stored.

## Your Current Setup

**Storage Location**: `I:\fileserver\storage`

**Files Found**: 17 items including:
- admin_only_folder/
- file.txt
- folder/
- ICS3U_Justin-assignment03/
- My New Folder/
- python-api/
- python_test/
- python_test_folder/
- pytogetherbetter/
- shared_folder/
- temp_cursor_folder/
- test.txt
- test_collab.txt
- test_collab_2.txt
- test_file.txt
- test_upload.txt

**Users in Database**:
- `aqueous` - root_path: `/` (admin, super)
- `admin` - root_path: `/` (admin, super)
- `admin2` - root_path: `/` (super)
- `tester` - root_path: `/`
- `user1-4, testuser` - root_path: `/pytogetherbetter`
- `restricted_user` - root_path: `/restricted`

## Solution

### Option 1: Use the New Start Script (Recommended)

Run the server using the new `start-server.bat` file:

```bash
start-server.bat
```

This script automatically sets `STORAGE_ROOT` to the correct path before starting the server.

### Option 2: Set Environment Variable Manually

Before running the server, set the environment variable:

```bash
# In PowerShell
$env:STORAGE_ROOT = "I:\fileserver\storage"
python -m uvicorn backend.main:app --host 0.0.0.0 --port 30815

# Or in CMD
set STORAGE_ROOT=I:\fileserver\storage
python -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
```

### Option 3: Use the Executable

If you're using the compiled executable (`dist\FileServer.exe`), it automatically sets the storage path to be in the same directory as the executable.

```bash
dist\FileServer.exe
```

The storage will be at: `dist\storage`

**Note**: If you want the executable to use your existing storage folder, you need to either:
1. Copy your `storage` folder to the `dist` directory, OR
2. Set `STORAGE_ROOT` environment variable before running the executable

## Verification

After starting the server with the correct storage path:

1. **Login** to FileServer at `http://localhost:30815`
2. **Check the console** - it should show:
   ```
   Storage location: I:\fileserver\storage
   ```
3. **View your files** - You should now see all your files and folders

## User-Specific Access

Remember that users see different files based on their `root_path`:

- **Admin users** (`aqueous`, `admin`) with `root_path=/` see ALL files
- **Regular users** with `root_path=/pytogetherbetter` only see files in that folder
- **Restricted user** with `root_path=/restricted` only sees files in `/restricted` folder

If you're logged in as a non-admin user and don't see files, make sure:
1. You're logged in as an admin user (like `admin` or `aqueous`)
2. Or the user's `root_path` points to a folder that exists in storage

## Quick Fix Commands

```bash
# Stop any running server (Ctrl+C)

# Start server with correct storage path
start-server.bat

# Or if you prefer to run manually
set STORAGE_ROOT=I:\fileserver\storage
python -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
```

## Files Created

- **`start-server.bat`** - Batch file that sets STORAGE_ROOT and starts the server
- **`diagnose_storage.py`** - Diagnostic script to check storage configuration

## Summary

The issue is that `STORAGE_ROOT` wasn't set, so the server couldn't find your files. Use `start-server.bat` to run the server with the correct storage path, and you should see all your files.
