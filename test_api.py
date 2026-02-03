import requests
import json

# Primero probar health check
print("=== Health Check ===")
health = requests.get("https://serenvoice-backend-11587771642.us-central1.run.app/api/health")
print(f"Status: {health.status_code}")
print(f"Response: {health.text[:500]}")

print("\n=== Login Test (con 'contrasena' no 'password') ===")
# Login con 'contrasena' que es lo que espera el backend
data = {"correo": "kenny@gmail.com", "contrasena": "Kenny123"}
print(f"Enviando: {data}")

login_response = requests.post(
    "https://serenvoice-backend-11587771642.us-central1.run.app/api/auth/login",
    json=data
)

print(f"Status: {login_response.status_code}")
print(f"Response: {login_response.text[:500]}")

if login_response.status_code == 200:
    token = login_response.json().get('token')  # Es 'token' no 'access_token'
    print(f"\n✅ Token obtenido: {token[:30]}...")
    
    # Obtener notificaciones
    headers = {"Authorization": f"Bearer {token}"}
    notif_response = requests.get(
        "https://serenvoice-backend-11587771642.us-central1.run.app/api/notificaciones",
        headers=headers
    )
    print("\n=== Notificaciones ===")
    print(json.dumps(notif_response.json(), indent=2, ensure_ascii=False))
else:
    print("\n❌ Error en login")
