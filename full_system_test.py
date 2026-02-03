"""
ANÁLISIS COMPLETO DE SERENVOICE
Pruebas de funcionalidad de Backend API
"""
import requests
import json
from datetime import datetime

BASE_URL = "https://serenvoice-backend-11587771642.us-central1.run.app"

def test_endpoint(name, method, url, expected_status=200, json_data=None, headers=None, allow_fail=False):
    """Test a single endpoint"""
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            resp = requests.post(url, json=json_data, headers=headers, timeout=30)
        elif method == "PUT":
            resp = requests.put(url, json=json_data, headers=headers, timeout=30)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=30)
        else:
            return False, f"Método no soportado: {method}"
        
        success = resp.status_code == expected_status or (allow_fail and resp.status_code < 500)
        status = "✅" if success else "❌"
        
        try:
            response_data = resp.json()
        except:
            response_data = resp.text[:100]
        
        return success, f"{status} {name}: {resp.status_code} - {str(response_data)[:100]}"
    except Exception as e:
        return False, f"❌ {name}: ERROR - {str(e)[:50]}"

def run_tests():
    print("\n" + "="*70)
    print("  ANÁLISIS COMPLETO DE SERENVOICE - BACKEND API")
    print("="*70)
    print(f"  Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  URL: {BASE_URL}")
    print("="*70 + "\n")
    
    results = {"passed": 0, "failed": 0, "tests": []}
    
    # ========================================
    # 1. ENDPOINTS PÚBLICOS (sin auth)
    # ========================================
    print("📌 1. ENDPOINTS PÚBLICOS (sin autenticación)")
    print("-" * 50)
    
    public_tests = [
        ("Health Check", "GET", f"{BASE_URL}/api/health", 200),
        ("Login (campos vacíos)", "POST", f"{BASE_URL}/api/auth/login", 400, {}),
        ("Registro (campos vacíos)", "POST", f"{BASE_URL}/api/auth/register", 400, {}),
    ]
    
    for test in public_tests:
        name, method, url, expected = test[:4]
        data = test[4] if len(test) > 4 else None
        success, msg = test_endpoint(name, method, url, expected, data)
        print(f"   {msg}")
        results["tests"].append({"name": name, "success": success})
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # ========================================
    # 2. AUTENTICACIÓN
    # ========================================
    print("\n📌 2. AUTENTICACIÓN")
    print("-" * 50)
    
    # Login con credenciales correctas
    login_data = {"correo": "kenny@gmail.com", "contrasena": "Kenny123"}
    success, msg = test_endpoint("Login Kenny", "POST", f"{BASE_URL}/api/auth/login", 200, login_data)
    print(f"   {msg}")
    results["tests"].append({"name": "Login Kenny", "success": success})
    if success:
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Obtener token
    token = None
    user_id = None
    try:
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if resp.status_code == 200:
            token = resp.json().get("token")
            # Decode JWT to get user_id
            import base64
            payload = token.split('.')[1]
            # Add padding if needed
            payload += '=' * (4 - len(payload) % 4)
            decoded = json.loads(base64.urlsafe_b64decode(payload))
            user_id = decoded.get('sub')
            print(f"   ✅ Token obtenido (usuario ID: {user_id})")
    except Exception as e:
        print(f"   ❌ Error obteniendo token: {e}")
    
    if not token:
        print("\n❌ No se pudo obtener token. Abortando pruebas autenticadas.")
        return results
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Login con credenciales incorrectas (verificar contador de intentos)
    bad_login = {"correo": "test_temp@test.com", "contrasena": "wrongpass"}
    success, msg = test_endpoint("Login incorrecto (debe mostrar intentos)", "POST", f"{BASE_URL}/api/auth/login", 401, bad_login)
    print(f"   {msg}")
    results["tests"].append({"name": "Login incorrecto", "success": success})
    if success:
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # ========================================
    # 3. PERFIL DE USUARIO
    # ========================================
    print("\n📌 3. PERFIL DE USUARIO")
    print("-" * 50)
    
    user_tests = [
        ("Obtener perfil", "GET", f"{BASE_URL}/api/auth/me", 200),
        ("Obtener usuario por ID", "GET", f"{BASE_URL}/api/usuarios/{user_id}", 200),
    ]
    
    for name, method, url, expected in user_tests:
        success, msg = test_endpoint(name, method, url, expected, headers=headers)
        print(f"   {msg}")
        results["tests"].append({"name": name, "success": success})
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # ========================================
    # 4. NOTIFICACIONES
    # ========================================
    print("\n📌 4. NOTIFICACIONES")
    print("-" * 50)
    
    notif_tests = [
        ("Obtener notificaciones", "GET", f"{BASE_URL}/api/notificaciones", 200),
        ("Contador no leídas", "GET", f"{BASE_URL}/api/notificaciones/contador", 200),
    ]
    
    for name, method, url, expected in notif_tests:
        success, msg = test_endpoint(name, method, url, expected, headers=headers)
        print(f"   {msg}")
        results["tests"].append({"name": name, "success": success})
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # ========================================
    # 5. GRUPOS
    # ========================================
    print("\n📌 5. GRUPOS")
    print("-" * 50)
    
    grupos_tests = [
        ("Mis grupos", "GET", f"{BASE_URL}/api/grupos/mis-grupos", 200),
        ("Listar grupos", "GET", f"{BASE_URL}/api/grupos", 200),
    ]
    
    for name, method, url, expected in grupos_tests:
        success, msg = test_endpoint(name, method, url, expected, headers=headers)
        print(f"   {msg}")
        results["tests"].append({"name": name, "success": success})
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # ========================================
    # 6. ACTIVIDADES GRUPALES
    # ========================================
    print("\n📌 6. ACTIVIDADES GRUPALES")
    print("-" * 50)
    
    # Primero obtener un grupo
    try:
        resp = requests.get(f"{BASE_URL}/api/grupos/mis-grupos", headers=headers)
        grupos = resp.json().get("data", [])
        if grupos:
            grupo_id = grupos[0].get("id_grupo") or grupos[0].get("id")
            print(f"   📋 Grupo encontrado: ID {grupo_id}")
            
            # Listar actividades del grupo
            success, msg = test_endpoint(
                "Listar actividades del grupo", "GET", 
                f"{BASE_URL}/api/actividades_grupo/{grupo_id}/actividades", 200, 
                headers=headers
            )
            print(f"   {msg}")
            results["tests"].append({"name": "Listar actividades", "success": success})
            if success:
                results["passed"] += 1
            else:
                results["failed"] += 1
        else:
            print("   ⚠️ No hay grupos para probar actividades")
    except Exception as e:
        print(f"   ❌ Error obteniendo grupos: {e}")
    
    # ========================================
    # 7. ANÁLISIS DE VOZ
    # ========================================
    print("\n📌 7. ANÁLISIS DE VOZ")
    print("-" * 50)
    
    audio_tests = [
        ("Historial de análisis", "GET", f"{BASE_URL}/api/analisis/historial", 200),
    ]
    
    for name, method, url, expected in audio_tests:
        success, msg = test_endpoint(name, method, url, expected, headers=headers)
        print(f"   {msg}")
        results["tests"].append({"name": name, "success": success})
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # ========================================
    # 8. JUEGOS TERAPÉUTICOS
    # ========================================
    print("\n📌 8. JUEGOS TERAPÉUTICOS")
    print("-" * 50)
    
    juegos_tests = [
        ("Listar juegos", "GET", f"{BASE_URL}/api/juegos", 200),
        ("Historial de sesiones", "GET", f"{BASE_URL}/api/sesiones-juego/historial", 200),
    ]
    
    for name, method, url, expected in juegos_tests:
        success, msg = test_endpoint(name, method, url, expected, headers=headers)
        print(f"   {msg}")
        results["tests"].append({"name": name, "success": success})
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # ========================================
    # 9. RECOMENDACIONES
    # ========================================
    print("\n📌 9. RECOMENDACIONES")
    print("-" * 50)
    
    recom_tests = [
        ("Obtener recomendaciones", "GET", f"{BASE_URL}/api/recomendaciones", 200),
    ]
    
    for name, method, url, expected in recom_tests:
        success, msg = test_endpoint(name, method, url, expected, headers=headers, allow_fail=True)
        print(f"   {msg}")
        results["tests"].append({"name": name, "success": success})
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # ========================================
    # 10. ALERTAS
    # ========================================
    print("\n📌 10. ALERTAS")
    print("-" * 50)
    
    alertas_tests = [
        ("Obtener alertas", "GET", f"{BASE_URL}/api/alertas", 200),
    ]
    
    for name, method, url, expected in alertas_tests:
        success, msg = test_endpoint(name, method, url, expected, headers=headers, allow_fail=True)
        print(f"   {msg}")
        results["tests"].append({"name": name, "success": success})
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # ========================================
    # RESUMEN
    # ========================================
    print("\n" + "="*70)
    print("  RESUMEN DE PRUEBAS")
    print("="*70)
    total = results["passed"] + results["failed"]
    percentage = (results["passed"] / total * 100) if total > 0 else 0
    
    print(f"  ✅ Pasaron: {results['passed']}/{total} ({percentage:.1f}%)")
    print(f"  ❌ Fallaron: {results['failed']}/{total}")
    
    if results["failed"] > 0:
        print("\n  Tests fallidos:")
        for test in results["tests"]:
            if not test["success"]:
                print(f"     - {test['name']}")
    
    print("="*70 + "\n")
    
    return results

if __name__ == "__main__":
    run_tests()
