import requests

BASE_URL = "http://localhost:30815"

print("Checking server routes...")
print("\nTrying various endpoints:")

endpoints = [
    ("GET", "/api/users/me"),
    ("GET", "/api/groups"),
    ("GET", "/api/groups/"),
    ("POST", "/api/groups"),
    ("POST", "/api/groups/"),
]

# Login first
resp = requests.post(f"{BASE_URL}/api/token", data={"username": "admin", "password": "adminpassword"})
if resp.status_code != 200:
    print(f"Login failed: {resp.status_code}")
    exit(1)

token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

for method, endpoint in endpoints:
    try:
        if method == "GET":
            resp = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        elif method == "POST":
            resp = requests.post(f"{BASE_URL}{endpoint}", json={"name": "test"}, headers=headers)
        print(f"{method:6} {endpoint:20} -> {resp.status_code} {resp.reason}")
    except Exception as e:
        print(f"{method:6} {endpoint:20} -> ERROR: {e}")

print("\n\nChecking OpenAPI docs endpoint:")
try:
    resp = requests.get(f"{BASE_URL}/openapi.json")
    if resp.status_code == 200:
        routes = resp.json().get("paths", {})
        print(f"Found {len(routes)} routes in OpenAPI spec")
        group_routes = [r for r in routes.keys() if "group" in r.lower()]
        if group_routes:
            print(f"Group-related routes: {group_routes}")
        else:
            print("No group-related routes found in OpenAPI spec!")
            print("\nAll routes:")
            for route in sorted(routes.keys()):
                print(f"  {route}")
except Exception as e:
    print(f"Error fetching OpenAPI: {e}")
