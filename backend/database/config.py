# backend/database/config.py
import os
import secrets
from dotenv import load_dotenv
import socket
from pathlib import Path
from datetime import timedelta

# Cargar variables de entorno desde la raíz del proyecto
root_dir = Path(__file__).parent.parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)


def _get_secure_jwt_secret() -> str:
    """
    Obtiene el JWT secret de forma segura.
    En producción DEBE estar configurado en .env
    En desarrollo genera uno temporal (con advertencia).
    """
    secret = os.getenv('JWT_SECRET_KEY')
    env = os.getenv('FLASK_ENV', 'development')
    
    if not secret or secret == 'dev-secret-key':
        if env == 'production':
            raise ValueError(
                "❌ CRÍTICO: JWT_SECRET_KEY no configurado en producción. "
                "Genera uno con: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        # En desarrollo, generar uno temporal pero advertir
        secret = secrets.token_hex(32)
        print("⚠️  [SEGURIDAD] JWT_SECRET_KEY no configurado. Usando secreto temporal.")
        print("   Para producción, agrega JWT_SECRET_KEY en .env")
    
    return secret


class Config:
    """Configuración de la aplicación con mejoras de seguridad"""
    
    # Entorno
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    
    # Base de datos
    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', '1234'),
        'database': os.getenv('DB_NAME', 'serenvoice'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'autocommit': False,
        'raise_on_warnings': True
    }
    
    # ============================================
    # JWT - CONFIGURACIÓN SEGURA
    # ============================================
    JWT_SECRET_KEY = _get_secure_jwt_secret()
    
    # Access token: vida corta (15 minutos por defecto en producción)
    _default_access_expires = 900 if os.getenv('FLASK_ENV') == 'production' else 28800
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', _default_access_expires))
    )
    
    # Refresh token: vida más larga (7 días)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv('JWT_REFRESH_TOKEN_DAYS', 7))
    )
    
    # Configuraciones adicionales de JWT
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    JWT_ERROR_MESSAGE_KEY = 'error'
    
    # Algoritmo seguro para JWT
    JWT_ALGORITHM = 'HS256'
    
    # ============================================
    # SEGURIDAD GENERAL
    # ============================================
    # Cookies seguras (solo en producción con HTTPS)
    SESSION_COOKIE_SECURE = os.getenv('FLASK_ENV') == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # CSRF Protection
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 3600  # 1 hora
    
    # ============================================
    # RATE LIMITING
    # ============================================
    RATELIMIT_ENABLED = os.getenv('RATELIMIT_ENABLED', 'true').lower() == 'true'
    # Límite aumentado para desarrollo: 1000/hora permite polling cada 3-10 segundos
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '5000 per day, 1000 per hour')
    RATELIMIT_STORAGE_URL = os.getenv('RATELIMIT_STORAGE_URL', 'memory://')
    
    # Límites específicos para endpoints sensibles
    RATELIMIT_AUTH = os.getenv('RATELIMIT_AUTH', '5 per minute, 20 per hour')
    RATELIMIT_API = os.getenv('RATELIMIT_API', '100 per minute')
    
    # ============================================
    # CORS - ORÍGENES PERMITIDOS
    # ============================================
    # Lista de orígenes separados por coma en producción
    ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 
        'http://localhost:5173,http://localhost:5174,http://localhost:3000,https://serenvoice-frontend-11587771642.us-central1.run.app'
    ).split(',')
    
    # Flask
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True' and FLASK_ENV != 'production'
    TESTING = False
    
    # Archivos
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './uploads/audios')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 52428800))  # 50MB
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'wav,mp3,ogg,webm').split(','))
    
    # ============================================
    # VALIDACIÓN DE CONTRASEÑAS (UNIFICADA)
    # ============================================
    PASSWORD_MIN_LENGTH = int(os.getenv('PASSWORD_MIN_LENGTH', 8))
    PASSWORD_REQUIRE_UPPERCASE = os.getenv('PASSWORD_REQUIRE_UPPERCASE', 'true').lower() == 'true'
    PASSWORD_REQUIRE_LOWERCASE = os.getenv('PASSWORD_REQUIRE_LOWERCASE', 'true').lower() == 'true'
    PASSWORD_REQUIRE_DIGIT = os.getenv('PASSWORD_REQUIRE_DIGIT', 'true').lower() == 'true'
    PASSWORD_REQUIRE_SPECIAL = os.getenv('PASSWORD_REQUIRE_SPECIAL', 'false').lower() == 'true'
    
    @staticmethod
    def init_app(app):
        """Inicializar configuración en la app"""
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    
    @staticmethod
    def is_production() -> bool:
        """Verificar si estamos en producción."""
        return Config.FLASK_ENV == 'production'
        
    @staticmethod
    def show_server_urls(port=5173):
        """Mostrar URLs del servidor frontend."""
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)

        print("\n  Servidor Frontend disponible en:")
        print(f"Local:   http://localhost:{port}/")
        print(f"Network: http://{local_ip}:{port}/")
