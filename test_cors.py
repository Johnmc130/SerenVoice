import requests

# Test OPTIONS (preflight)
print("Testing OPTIONS preflight request...")
r = requests.options(
    'http://192.168.54.14:5000/api/health',
    headers={
        'Origin': 'http://localhost:8081',
        'Access-Control-Request-Method': 'GET'
    }
)

print(f"\nStatus Code: {r.status_code}")
print("\nCORS Headers:")
print(f"  Access-Control-Allow-Origin: {r.headers.get('Access-Control-Allow-Origin')}")
print(f"  Access-Control-Allow-Methods: {r.headers.get('Access-Control-Allow-Methods')}")
print(f"  Access-Control-Allow-Headers: {r.headers.get('Access-Control-Allow-Headers')}")
print(f"  Access-Control-Allow-Credentials: {r.headers.get('Access-Control-Allow-Credentials')}")

# Test GET request
print("\n\nTesting GET request...")
r2 = requests.get(
    'http://192.168.54.14:5000/api/health',
    headers={'Origin': 'http://localhost:8081'}
)

print(f"\nStatus Code: {r2.status_code}")
print(f"Response: {r2.json()}")
print(f"\nCORS Headers:")
print(f"  Access-Control-Allow-Origin: {r2.headers.get('Access-Control-Allow-Origin')}")
print(f"  Access-Control-Allow-Credentials: {r2.headers.get('Access-Control-Allow-Credentials')}")
