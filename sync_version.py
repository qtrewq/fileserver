import json
import os

def sync_version():
    """Reads VERSION file and updates frontend/package.json"""
    version_file = "VERSION"
    package_file = os.path.join("frontend", "package.json")
    
    if not os.path.exists(version_file):
        print(f"Error: {version_file} not found")
        return False
        
    with open(version_file, "r") as f:
        version = f.read().strip()
        
    if not os.path.exists(package_file):
        print(f"Error: {package_file} not found")
        return False
        
    try:
        with open(package_file, "r") as f:
            data = json.load(f)
            
        if data.get("version") != version:
            print(f"Updating package.json version from {data.get('version')} to {version}")
            data["version"] = version
            
            with open(package_file, "w") as f:
                json.dump(data, f, indent=2)
                f.write("\n") # Add newline at end of file
        else:
            print(f"package.json is already up to date ({version})")
            
    except Exception as e:
        print(f"Failed to update package.json: {e}")
        return False
        
    return True

if __name__ == "__main__":
    sync_version()
