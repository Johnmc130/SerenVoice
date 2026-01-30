# -*- coding: utf-8 -*-
from flask import Flask, jsonify, send_from_directory, request, g
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flasgger import Swagger
import os
import sys
import io

# ============================================
# CONFIGURAR UTF-8 PARA WINDOWS
# ============================================
if sys.platform == "win32":
    # Forzar UTF-8 en la salida estándar y de error
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    # Configurar variable de entorno
    os.environ['PYTHONIOENCODING'] = 'utf-8'

from database.config import Config
from database.connection import DatabaseConnection
from services.audio_service import AudioService

# ============================================
# MIDDLEWARE DE SEGURIDAD
# ============================================
from utils.security_middleware import (
    limiter,
    add_security_headers,
    get_cors_config,
    add_request_id,
    log_request_completion,
    secure_log
)

# ===============================
# VARIABLES DE ENTORNO
# ===============================
try:
    from dotenv import load_dotenv
    from pathlib import Path
    # Cargar .env desde la raíz del proyecto (override=True para sobrescribir)
    root_dir = Path(__file__).parent.parent
    env_path = root_dir / '.env'
    load_dotenv(dotenv_path=env_path, override=True)
except Exception:
    pass

# ===============================
# EXTENSIONES SQL (OPCIONAL)
# ===============================
try:
    from extensions import db, jwt as sql_jwt
    HAS_SQL_EXTENSIONS = True
except Exception:
    HAS_SQL_EXTENSIONS = False

# ===============================
# BLUEPRINTS
# ===============================
from routes.contact_routes import bp as contact_bp
from routes.auth_routes import bp as auth_bp
from routes.usuario_routes import bp as usuarios_bp
from routes.admin_routes import bp as admin_bp
from routes.audio_routes import bp as audio_bp
from routes.analisis_routes import bp as analisis_bp

from routes.sesion_routes import bp as sesion_bp
from routes.roles_routes import bp as roles_bp
from routes.resultados_routes import bp as resultados_bp
from routes.reportes_routes import bp as reportes_bp
from routes.recomendaciones_routes import bp as recomendaciones_bp
from routes.alertas_routes import bp as alertas_bp
from routes.notificaciones_routes import bp as notificaciones_bp

# Actividades de grupo (opcional)
try:
    from routes.actividades_grupo_routes import bp as actividades_grupo_bp
    from routes.actividades_grupo_v2_routes import bp as actividades_grupo_v2_bp
    HAS_ACTIVIDADES = True
except Exception:
    actividades_grupo_bp = None
    actividades_grupo_v2_bp = None
    HAS_ACTIVIDADES = False

# ===============================
# JUEGOS (OPCIONAL)
# ===============================
try:
    from routes.juegos_routes import juegos_bp
    HAS_JUEGOS = True
except Exception:
    juegos_bp = None
    HAS_JUEGOS = False


def create_app():
    app = Flask(__name__)
    
    # ===============================
    # DESACTIVAR REDIRECCIÓN POR BARRA FINAL
    # Evita redirecciones 308 que causan problemas con HTTPS
    # ===============================
    app.url_map.strict_slashes = False

    # ===============================
    # CONFIGURACIÓN
    # ===============================
    app.config.from_object(Config)
    app.config["UPLOAD_FOLDER"] = "uploads"
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

    # ===============================
    # ✅ RATE LIMITING
    # ===============================
    if Config.RATELIMIT_ENABLED:
        limiter.init_app(app)
        print("[SECURITY] Rate Limiting habilitado")
    else:
        print("[SECURITY] Rate Limiting deshabilitado")

    # ===============================
    # ✅ CORS SEGURO (NO WILDCARD)
    # ===============================
    cors_config = get_cors_config()
    CORS(
        app,
        resources={
            r"/api/*": cors_config,
            r"/juegos/*": cors_config,
            r"/grupos*": cors_config
        }
    )
    print(f"[SECURITY] CORS configurado para: {cors_config['origins'][:3]}...")

    # ===============================
    # ✅ SECURITY HEADERS & REQUEST TRACKING
    # ===============================
    @app.before_request
    def before_request_handler():
        # Añadir ID único a cada request
        add_request_id()
        
        # Manejar preflight OPTIONS
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
            return response

    @app.after_request
    def after_request_handler(response):
        # Añadir security headers a todas las respuestas
        response = add_security_headers(response)
        # Log de finalización (opcional)
        response = log_request_completion(response)
        return response

    # ===============================
    # JWT CON CONFIGURACIÓN MEJORADA
    # ===============================
    jwt = JWTManager(app)
    
    # Callbacks de error JWT personalizados (sin exponer detalles)
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        secure_log.warning("Token expirado", data={"sub": jwt_payload.get("sub")})
        return jsonify({
            'success': False,
            'error': 'Token expirado. Por favor, inicia sesión nuevamente.'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        secure_log.warning("Token inválido recibido")
        return jsonify({
            'success': False,
            'error': 'Token inválido'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return jsonify({
            'success': False,
            'error': 'Token de autorización requerido'
        }), 401

    # ===============================
    # AUDIO SERVICE
    # ===============================
    app.audio_service = AudioService()
    print("[AUDIO] AudioService OK")
    # ===============================
    # DATABASE (la inicialización de pool se hace más abajo con manejo de errores)
    # ===============================

    # ===============================
    # SQLALCHEMY (SI EXISTE)
    # ===============================
    if HAS_SQL_EXTENSIONS:
        try:
            from urllib.parse import quote_plus

            db_conf = Config.DB_CONFIG
            user = db_conf.get("user")
            password = quote_plus(str(db_conf.get("password", "")))
            host = db_conf.get("host", "localhost")
            port = db_conf.get("port", 3306)
            database = db_conf.get("database")

            if user and database:
                app.config["SQLALCHEMY_DATABASE_URI"] = (
                    f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{database}"
                )
                app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

            db.init_app(app)
            sql_jwt.init_app(app)
            print("[EXT] SQLAlchemy OK")
        except Exception as e:
            print(f"[EXT] ADVERTENCIA: error preparando configuración SQLAlchemy: {e}")
            # No intentar init_app de nuevo aquí; ya se intentó dentro del bloque try

    # ===============================
    # POOL DE CONEXIONES MYSQL (manejar fallos en entorno local)
    # ===============================
    print("[BD] Inicializando Pool de MySQL...")
    try:
        DatabaseConnection.initialize_pool()
        DatabaseConnection.test_connection()
        app.config['DB_CONNECTED'] = True
    except Exception as e:
        # No detener la aplicación solo por falta de BD en desarrollo local
        print(f"[BD] ADVERTENCIA: no se pudo inicializar el pool de MySQL: {e}")
        app.config['DB_CONNECTED'] = False

    # ===============================
    # SWAGGER
    # ===============================
    Swagger(app, config={
        "openapi": "3.0.3",
        "swagger_ui": True,
        "specs_route": "/api/docs/",
        "headers": [],
        "specs": [{
            "endpoint": "apispec",
            "route": "/api/openapi.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }],
    })

    # ===============================
    # REGISTRAR BLUEPRINTS
    # ===============================
    
    # IMPORTANTE: Registrar rutas de uploads ANTES de los blueprints
    # para evitar conflictos con prefijos /api
    # Nota: uploads está en /app/uploads, no en /app/backend/uploads
    uploads_base = os.path.join(os.path.dirname(app.root_path), "uploads")
    
    @app.route("/api/uploads/<path:filename>")
    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        full_path = os.path.join(uploads_base, filename)
        print(f"[UPLOADS] Sirviendo archivo: {filename} desde {uploads_base}")
        print(f"[UPLOADS] Existe: {os.path.exists(full_path)}")
        return send_from_directory(uploads_base, filename)
    
    app.register_blueprint(contact_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(usuarios_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(audio_bp)
    app.register_blueprint(analisis_bp)

    app.register_blueprint(sesion_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(resultados_bp)
    app.register_blueprint(reportes_bp)
    app.register_blueprint(recomendaciones_bp)
    app.register_blueprint(alertas_bp)
    app.register_blueprint(notificaciones_bp)

    # Registrar blueprints de actividades de grupo si existen
    try:
        if HAS_ACTIVIDADES and actividades_grupo_bp:
            app.register_blueprint(actividades_grupo_bp)
            print("[RUTAS] actividades_grupo_bp OK")
        if HAS_ACTIVIDADES and actividades_grupo_v2_bp:
            app.register_blueprint(actividades_grupo_v2_bp)
            print("[RUTAS] actividades_grupo_v2_bp OK")
    except Exception as e:
        print(f"[RUTAS] actividades_grupo_bp NO cargado: {e}")


    print("[RUTAS] OK - Blueprint de notificaciones registrado en /api/notificaciones")
    
    # Blueprint de reportes de admin
    try:
        from routes.admin_reportes_routes import bp as admin_reportes_bp
        app.register_blueprint(admin_reportes_bp)
        print("[RUTAS] OK - Blueprint de reportes admin registrado en /api/admin/reportes")
    except ImportError as e:
        print(f"[RUTAS] ADVERTENCIA - No se pudo importar admin_reportes_routes: {e}")
    
    # Nuevos blueprints para admin
    try:
        from routes.auditoria_routes import bp as auditoria_bp
        app.register_blueprint(auditoria_bp)
        print("[RUTAS] OK - Blueprint de auditoría registrado en /api/auditoria")
    except ImportError as e:
        print(f"[RUTAS] ADVERTENCIA - No se pudo importar auditoria_routes: {e}")
    
    try:
        from routes.sesiones_juego_routes import bp as sesiones_juego_bp
        app.register_blueprint(sesiones_juego_bp)
        print("[RUTAS] OK - Blueprint de sesiones de juego registrado en /api/sesiones-juego")
    except ImportError as e:
        print(f"[RUTAS] ADVERTENCIA - No se pudo importar sesiones_juego_routes: {e}")
    
    # Grupos - Nuevo
    try:
        from routes.grupos_routes import bp as grupos_bp
        app.register_blueprint(grupos_bp)
        print("[RUTAS] grupos_bp OK")
    except Exception as e:
        print(f"[RUTAS] grupos_bp NO cargado: {e}")

    # Sesiones Grupales - Actividades con análisis de voz grupal
    try:
        from routes.sesion_grupal_routes import bp as sesion_grupal_bp
        app.register_blueprint(sesion_grupal_bp)
        print("[RUTAS] sesion_grupal_bp OK - /api/sesiones-grupales")
    except Exception as e:
        print(f"[RUTAS] sesion_grupal_bp NO cargado: {e}")

    if HAS_JUEGOS and juegos_bp:
        app.register_blueprint(juegos_bp)
        print("[RUTAS] juegos_bp OK")

    # ===============================
    # VERIFICACIÓN DE SALUD
    # ===============================
    @app.route('/api/contacto', methods=['POST'])
    def contacto_directo():
        data = request.get_json()
        if not data:
            return jsonify({"ok": False, "error": "No se recibió JSON"}), 400

        nombre = data.get("nombre", "")
        email = data.get("email", "")
        mensaje = data.get("mensaje", "")

        print("[CONTACTO DIRECTO] Datos recibidos:")
        print("Nombre:", nombre)
        print("Correo:", email)
        print("Mensaje:", mensaje)

        return jsonify({"ok": True, "message": "Mensaje recibido"}), 200

    # ===============================
    # PÁGINA PRINCIPAL
    # ===============================
    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_status = DatabaseConnection.test_connection()
        return {
            'status': 'ok' if db_status else 'error',
            'database': 'conectada' if db_status else 'desconectada',
            'message': 'SerenVoice API funcionando correctamente'
        }, 200 if db_status else 500

    @app.route('/', methods=['GET'])
    def home():
        return {
            'message': 'Bienvenido a SerenVoice API',
            'version': '2.0.0',
            'endpoints': {
                'health': '/api/health',
                'docs': '/api/docs',
                'auth': '/api/auth',
                'usuario': '/api/usuario',
                'admin': '/api/admin',
                'audio': '/api/audio',
                'contacto': '/api/contacto'
            }
        }

    # Crear directorios necesarios (usar ruta absoluta para consistencia)
    # uploads está en /app/uploads, no en /app/backend/uploads
    uploads_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
    os.makedirs(uploads_root, exist_ok=True)
    os.makedirs(os.path.join(uploads_root, 'audios'), exist_ok=True)
    os.makedirs(os.path.join(uploads_root, 'perfiles'), exist_ok=True)
    os.makedirs(os.path.join(uploads_root, 'usuarios'), exist_ok=True)
    os.makedirs('models', exist_ok=True)

    # ===============================
    # MOSTRAR TODAS LAS RUTAS REGISTRADAS
    # ===============================
    print("\n" + "="*60)
    print("RUTAS REGISTRADAS EN LA APLICACIÓN:")
    print("="*60)
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':
            # Usar -> en lugar de → para evitar problemas de encoding en Windows
            print(f"  {rule.rule:50s} -> {rule.endpoint}")
    print("="*60 + "\n")

    return app


# ===============================
# EJECUTAR
# ===============================
# Crear la app para gunicorn (necesario para Cloud Run)
app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    
    # Mostrar información de seguridad
    print("\n" + "="*60)
    print("🔒 CONFIGURACIÓN DE SEGURIDAD:")
    print("="*60)
    print(f"  Entorno: {Config.FLASK_ENV}")
    print(f"  Limitación de Tasa: {'✅ Habilitado' if Config.RATELIMIT_ENABLED else '❌ Deshabilitado'}")
    print(f"  Orígenes CORS: {Config.ALLOWED_ORIGINS[:2]}...")
    print(f"  JWT Expira en: {Config.JWT_ACCESS_TOKEN_EXPIRES}")
    print(f"  Cabeceras de Seguridad: ✅ Habilitadas")
    print("="*60 + "\n")

    print(f"[SERVIDOR] http://0.0.0.0:{port}")
    print(f"[DOCUMENTACIÓN]   http://localhost:{port}/api/docs")

    app.run(
        host="0.0.0.0",
        port=port,
        debug=Config.DEBUG,
        use_reloader=False
    )