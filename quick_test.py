import requests

# Test on port 30816
response = requests.post("http://localhost:30816/api/token", data={"username": "admin", "password": "adminpassword"})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

url = "http://localhost:30816/api/groups/pytogether/"
print(f"Testing: {url}")
response = requests.get(url, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")
