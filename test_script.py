import urllib.request
import urllib.parse
import json

base_url = "http://localhost:8001"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    if data:
        data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8"))
        except:
            return e.code, None

# 1. POST /auth/login
login_data = {"email": "admin@exmample.com", "password": "lexicore123"}
status1, resp1 = make_request(f"{base_url}/auth/login", method="POST", data=login_data)
print(f"Login Status: {status1}")
print(f"Login Keys: {list(resp1.keys()) if resp1 else None}")

# 2. GET /admin/analytics (Correct Credentials)
headers2 = {
    "x-admin-email": "admin@exmample.com",
    "x-admin-password": "lexicore123"
}
status2, resp2 = make_request(f"{base_url}/admin/analytics", headers=headers2)
print(f"Analytics Status: {status2}")
print(f"Analytics Keys: {list(resp2.keys()) if resp2 else None}")

# 3. GET /admin/analytics (Wrong Password)
headers3 = {
    "x-admin-email": "admin@exmample.com",
    "x-admin-password": "wrongpassword"
}
status3, resp3 = make_request(f"{base_url}/admin/analytics", headers=headers3)
print(f"Wrong Pwd Status: {status3}")
print(f"Wrong Pwd Keys: {list(resp3.keys()) if resp3 else None}")
