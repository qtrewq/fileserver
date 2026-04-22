# Python API Client Guide

This guide describes how to access your FileServer programmatically using Python.

## Installation

You can install the client library directly from PyPI.

### Option 1: Install from PyPI (Recommended)
```bash
pip install fileserver-client
```

### Option 2: Install from Local Source
If you have the server source code:
```bash
cd python-client
pip install .
```

### Option 3: Copy the package
Copy the `python-client` folder to your project and install it.

## Usage Example

Save this as `client.py` and run it.

```python
from fileserver_client import FileServerClient
import os

# 1. Initialize Client
SERVER_URL = "http://localhost:30815"
try:
    admin = FileServerClient(SERVER_URL, "admin", "adminpassword")
    print(f"✅ Successfully logged in to {SERVER_URL}")
except Exception as e:
    print(f"❌ Login failed: {e}")
    exit(1)

# 2. List Files at Root
print("\n--- Root Directory ---")
try:
    files = admin.list_files()
    for item in files:
        type_icon = "📁" if item['is_dir'] else "📄"
        print(f"{type_icon} {item['name']} ({item['size']} bytes)")
except Exception as e:
    print(f"❌ Failed to list files: {e}")

# 3. Create a test file
with open("test_upload.txt", "w") as f:
    f.write("Hello from Python Script!")

# 4. Upload File
print("\n--- Uploading ---")
try:
    admin.upload_file("test_upload.txt")
    print("✅ Upload successful!")
except Exception as e:
    print(f"❌ Upload failed: {e}")

# 5. Clean up local file
os.remove("test_upload.txt")
```

## API Quick Reference

| Method | Description |
| :--- | :--- |
| `FileServerClient(url, user, pass)` | Initialize and authenticate. |
| `client.list_files(path)` | List directory contents. |
| `client.upload_file(local, remote)` | Upload a file. |
| `client.download_file(remote, local)` | Download a file. |
