# backend/utils/security_middleware.py
"""
Middleware de seguridad para SerenVoice.
Incluye: Rate Limiting, Security Headers, CORS seguro, Logging seguro.
"""

from flask import request, g, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps
import os
import secrets
import hashlib
from datetime import datetime
from typing import Optional, Callable


# ============================================
# CONFIGURACIÓN DE RATE LIMITING
# ============================================
def get_client_identifier() -> str:
    """
    Obtiene identificador único del cliente para rate limiting.
    Usa IP + User-Agent hash para mejor identificación.
    EXCLUYE peticiones OPTIONS (CORS preflight) del rate limiting.
    """
    # Excluir peticiones OPTIONS del rate limiting
    if request.method == 'OPTIONS':
        return None  # Esto hace que el limiter no aplique rate limiting
    
    ip = get_remote_address()
    user_agent = request.headers.get('User-Agent', '')
    
    # Crear hash del user agent para privacidad
    ua_hash = hashlib.sha256(user_agent.encode()).hexdigest()[:8]
    
    return f"{ip}:{ua_hash}"


# Instancia global del limiter (se inicializa en app.py)
limiter = Limiter(
    key_func=get_client_identifier,
    default_limits=["10000 per day", "2000 per hour", "100 per minute"],  # Límites generosos para desarrollo
    storage_uri="memory://",
    strategy="fixed-window",
    swallow_errors=True  # No romper la app si hay error en limiter
)


# ============================================
# SECURITY HEADERS
# ============================================
def add_security_headers(response):
    """
    Añade headers de seguridad a todas las respuestas.
    """
    # Prevenir clickjacking
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    
    # Prevenir MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Habilitar protección XSS del navegador
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Referrer Policy - no enviar referrer a otros dominios
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Permissions Policy - restringir APIs del navegador
    response.headers['Permissions-Policy'] = (
        "geolocation=(), "
        "microphone=(self), "  # Permitir micrófono solo en mismo origen (necesario para grabación)
        "camera=(), "
        "payment=()"
    )
    
    # Content Security Policy (CSP) - IMPORTANTE para producción
    # En desarrollo puede ser más permisivo
    if os.getenv('FLASK_ENV') == 'production':
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' https://api.groq.com; "
            "media-src 'self' blob:; "
            "frame-ancestors 'self';"
        )
    
    # HSTS (HTTP Strict Transport Security) - solo en producción con HTTPS
    if os.getenv('FLASK_ENV') == 'production':
        response.headers['Strict-Transport-Security'] = (
            'max-age=31536000; includeSubDomains; preload'
        )
    
    # Cache control para datos sensibles
    if '/auth/' in request.path or '/usuario/' in request.path:
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    
    return response


# ============================================
# CORS CONFIGURACIÓN SEGURA
# ============================================
def get_allowed_origins() -> list:
    """
    Retorna lista de orígenes permitidos según el entorno.
    """
    env = os.getenv('FLASK_ENV', 'development')
    
    # Orígenes base siempre permitidos en desarrollo
    dev_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        # Expo web (React Native)
        "http://localhost:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
        # Expo web para desarrollo
        "http://localhost:8000",
        "http://localhost:19000",
        # IP del servidor para aplicación móvil (actualizada)
        "http://192.168.1.27:5000",
        "http://192.168.1.27:8081",
        "http://192.168.1.27:8082",
        "http://192.168.1.27:19006",
        "http://192.168.1.27:3000",
        "http://192.168.1.27:5173",
        "http://192.168.1.27:5174",
        # IPs antiguas (compatibilidad)
        "http://192.168.54.14:5000",
        "http://192.168.54.14:8081",
        "http://192.168.54.14:19006",
    ]
    
    # Orígenes de producción desde variable de entorno
    prod_origins = os.getenv('ALLOWED_ORIGINS', '').split(',')
    prod_origins = [o.strip() for o in prod_origins if o.strip()]
    
    if env == 'production' and prod_origins:
        return prod_origins
    
    # En desarrollo, combinar ambos
    return dev_origins + prod_origins


def get_cors_config() -> dict:
    """
    Retorna configuración CORS segura.
    IMPORTANTE: React Native no envía Origin header, por lo que usamos "*" para móviles.
    """
    allowed_origins = get_allowed_origins()
    
    # ⚠️ Para aplicaciones móviles nativas (React Native, Flutter, etc.),
    # NO se envía el header Origin, por lo que necesitamos permitir "*"
    # Esto es SEGURO porque las apps nativas no están sujetas a CORS.
    return {
        "origins": "*",  # Permite todos los orígenes (necesario para React Native)
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-CSRF-Token"
        ],
        "expose_headers": [
            "Content-Type",
            "Authorization",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        ],
        "supports_credentials": False,  # ⚠️ DEBE ser False con origins="*"
        "max_age": 600  # Preflight cache: 10 minutos
    }


# ============================================
# LOGGING SEGURO (sin datos sensibles)
# ============================================
class SecureLogger:
    """
    Logger que sanitiza datos sensibles antes de escribir.
    """
    
    # Campos que NUNCA deben loguearse
    SENSITIVE_FIELDS = {
        'contrasena', 'password', 'token', 'secret', 'api_key',
        'authorization', 'cookie', 'session', 'credit_card',
        'tarjeta', 'cvv', 'pin', 'ssn', 'social_security'
    }
    
    # Campos que deben enmascararse parcialmente
    MASK_FIELDS = {
        'correo', 'email', 'telefono', 'phone', 'direccion', 'address'
    }
    
    @staticmethod
    def sanitize_value(key: str, value) -> str:
        """Sanitiza un valor según su tipo de sensibilidad."""
        key_lower = key.lower()
        
        # Campos totalmente sensibles - ocultar completamente
        for sensitive in SecureLogger.SENSITIVE_FIELDS:
            if sensitive in key_lower:
                return "[REDACTED]"
        
        # Campos parcialmente sensibles - enmascarar
        for mask_field in SecureLogger.MASK_FIELDS:
            if mask_field in key_lower:
                if isinstance(value, str) and len(value) > 4:
                    return f"{value[:2]}***{value[-2:]}"
                return "[MASKED]"
        
        return value
    
    @staticmethod
    def sanitize_dict(data: dict) -> dict:
        """Sanitiza un diccionario completo."""
        if not isinstance(data, dict):
            return data
        
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, dict):
                sanitized[key] = SecureLogger.sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    SecureLogger.sanitize_dict(v) if isinstance(v, dict) else v
                    for v in value
                ]
            else:
                sanitized[key] = SecureLogger.sanitize_value(key, value)
        
        return sanitized
    
    @staticmethod
    def log(level: str, message: str, data: dict = None, user_id: int = None):
        """
        Log seguro con timestamp y contexto.
        """
        timestamp = datetime.now().isoformat()
        
        log_entry = {
            "timestamp": timestamp,
            "level": level.upper(),
            "message": message,
            "request_id": getattr(g, 'request_id', None),
            "user_id": user_id,
            "ip": get_remote_address() if request else None,
            "path": request.path if request else None,
            "method": request.method if request else None
        }
        
        if data:
            log_entry["data"] = SecureLogger.sanitize_dict(data)
        
        # En producción, usar JSON estructurado
        if os.getenv('FLASK_ENV') == 'production':
            import json
            print(json.dumps(log_entry))
        else:
            # En desarrollo, formato legible
            print(f"[{timestamp}] [{level.upper()}] {message}")
            if data:
                print(f"  Data: {SecureLogger.sanitize_dict(data)}")
    
    @staticmethod
    def info(message: str, data: dict = None, user_id: int = None):
        SecureLogger.log("info", message, data, user_id)
    
    @staticmethod
    def warning(message: str, data: dict = None, user_id: int = None):
        SecureLogger.log("warning", message, data, user_id)
    
    @staticmethod
    def error(message: str, data: dict = None, user_id: int = None):
        SecureLogger.log("error", message, data, user_id)
    
    @staticmethod
    def security(message: str, data: dict = None, user_id: int = None):
        """Log específico para eventos de seguridad."""
        SecureLogger.log("security", message, data, user_id)


# Alias para uso más sencillo
secure_log = SecureLogger


# ============================================
# GENERADOR DE SECRETOS SEGUROS
# ============================================
def generate_secure_secret(length: int = 64) -> str:
    """
    Genera un secreto criptográficamente seguro.
    """
    return secrets.token_urlsafe(length)


def generate_jwt_secret() -> str:
    """
    Genera un secreto específico para JWT.
    """
    return secrets.token_hex(32)  # 256 bits


# ============================================
# REQUEST ID MIDDLEWARE
# ============================================
def add_request_id():
    """
    Añade un ID único a cada request para trazabilidad.
    """
    g.request_id = secrets.token_hex(8)
    g.request_start = datetime.now()


def log_request_completion(response):
    """
    Loguea la finalización del request con métricas.
    """
    if hasattr(g, 'request_start'):
        duration = (datetime.now() - g.request_start).total_seconds() * 1000
        
        # Solo loguear en producción o si es lento
        if os.getenv('FLASK_ENV') == 'production' or duration > 1000:
            secure_log.info(
                "Request completed",
                data={
                    "duration_ms": round(duration, 2),
                    "status": response.status_code
                }
            )
    
    return response


# ============================================
# DECORADOR PARA ENDPOINTS SENSIBLES
# ============================================
def sensitive_endpoint(audit_action: str = None):
    """
    Decorador para marcar endpoints que manejan datos sensibles.
    Aplica logging de auditoría y validaciones adicionales.
    """
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Registrar acceso a endpoint sensible
            secure_log.security(
                f"Acceso a endpoint sensible: {audit_action or fn.__name__}",
                data={
                    "endpoint": request.endpoint,
                    "args": SecureLogger.sanitize_dict(dict(request.args))
                }
            )
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ============================================
# VALIDACIÓN DE ENTRADA MEJORADA
# ============================================
def validate_content_type(allowed_types: list = None):
    """
    Decorador para validar Content-Type de requests.
    """
    if allowed_types is None:
        allowed_types = ['application/json']
    
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            content_type = request.content_type or ''
            
            # Permitir multipart para uploads
            if 'multipart/form-data' in content_type:
                return fn(*args, **kwargs)
            
            # Verificar tipos permitidos
            if not any(t in content_type for t in allowed_types):
                return jsonify({
                    'success': False,
                    'error': f'Content-Type no permitido. Esperado: {allowed_types}'
                }), 415
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
