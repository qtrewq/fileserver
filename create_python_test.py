"""
Test script to verify Python runner can access sibling files
"""

# Create test files in storage
import os
import requests

BASE_URL = "http://localhost:8000"
USERNAME = "admin"
PASSWORD = "adminpassword"

# Login
response = requests.post(f"{BASE_URL}/api/token", data={
    "username": USERNAME,
    "password": PASSWORD
})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create a test folder
test_folder = "python_test"
print(f"Creating test folder: {test_folder}")
response = requests.post(f"{BASE_URL}/api/mkdir/{test_folder}", headers=headers)
print(f"Folder creation: {response.status_code}")

# Create a data file
data_content = "Hello from data.txt!\nThis is line 2.\nThis is line 3."
files = {"files": ("data.txt", data_content.encode(), "text/plain")}
response = requests.post(f"{BASE_URL}/api/upload/{test_folder}", files=files, headers=headers)
print(f"Data file upload: {response.status_code}")

# Create a Python module file
module_content = """def greet(name):
    return f"Hello, {name}!"

def get_message():
    return "This is from helper.py"
"""
files = {"files": ("helper.py", module_content.encode(), "text/plain")}
response = requests.post(f"{BASE_URL}/api/upload/{test_folder}", files=files, headers=headers)
print(f"Helper module upload: {response.status_code}")

# Create the main Python script
script_content = """# Test script to verify file access
import os

print("Current working directory:", os.getcwd())
print("Files in current directory:", os.listdir('.'))
print()

# Test 1: Read data.txt
print("=== Test 1: Reading data.txt ===")
try:
    with open('data.txt', 'r') as f:
        content = f.read()
    print("SUCCESS: Read data.txt")
    print("Content:")
    print(content)
except Exception as e:
    print(f"FAILED: {e}")

print()

# Test 2: Import helper.py
print("=== Test 2: Importing helper.py ===")
try:
    import helper
    message = helper.get_message()
    greeting = helper.greet("World")
    print("SUCCESS: Imported helper.py")
    print(f"Message: {message}")
    print(f"Greeting: {greeting}")
except Exception as e:
    print(f"FAILED: {e}")
"""

files = {"files": ("test_script.py", script_content.encode(), "text/plain")}
response = requests.post(f"{BASE_URL}/api/upload/{test_folder}", files=files, headers=headers)
print(f"Test script upload: {response.status_code}")

print("\n" + "="*50)
print("Test files created successfully!")
print("Now run test_script.py from the UI to verify file access")
print("="*50)
