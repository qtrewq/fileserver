import requests

response = requests.post("http://localhost:30815/api/token", data={"username": "admin", "password": "adminpassword"})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

url = "http://localhost:30815/api/groups/pytogether/"
print(f"Testing: {url}")
response = requests.get(url, headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print("SUCCESS! Group details loaded:")
    print(response.json())
else:
    print(f"FAILED: {response.text}")
