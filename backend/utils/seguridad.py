# utils/seguridad.py
"""
Módulo de seguridad para SerenVoice.
Incluye validación de contraseñas, sanitización de inputs y control de acceso.
"""
import re
import bcrypt
import html
import secrets
from functools import wraps
from typing import Tuple, List, Optional
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity


class Seguridad:
    """Clase principal de utilidades de seguridad."""

    # ----------------------------
    # VALIDAR EMAIL
    # ----------------------------
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Valida que el correo tenga un formato correcto.
        Usa un patrón más estricto que cumple con RFC 5322 simplificado.
        """
        if not email:
            return False
        # Patrón mejorado para validación de email
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email.strip()) is not None

    # ----------------------------
    # VALIDAR FUERZA DE CONTRASEÑA (UNIFICADA)
    # ----------------------------
    @staticmethod
    def validate_password_strength(password: str) -> Tuple[bool, str]:
        """
        Validación UNIFICADA de contraseña usando configuración centralizada.
        
        Reglas por defecto:
        - Mínimo 8 caracteres
        - Al menos una mayúscula
        - Al menos una minúscula  
        - Al menos un número
        - Opcionalmente un carácter especial
        
        Returns:
            Tuple[bool, str]: (es_valida, mensaje)
        """
        from database.config import Config
        
        errors = []
        
        # Longitud mínima
        min_length = Config.PASSWORD_MIN_LENGTH
        if len(password) < min_length:
            errors.append(f"Debe tener mínimo {min_length} caracteres")
        
        # Mayúscula requerida
        if Config.PASSWORD_REQUIRE_UPPERCASE and not re.search(r"[A-Z]", password):
            errors.append("Debe incluir al menos una letra mayúscula")
        
        # Minúscula requerida
        if Config.PASSWORD_REQUIRE_LOWERCASE and not re.search(r"[a-z]", password):
            errors.append("Debe incluir al menos una letra minúscula")
        
        # Número requerido
        if Config.PASSWORD_REQUIRE_DIGIT and not re.search(r"[0-9]", password):
            errors.append("Debe incluir al menos un número")
        
        # Carácter especial (opcional por defecto)
        if Config.PASSWORD_REQUIRE_SPECIAL and not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            errors.append("Debe incluir al menos un carácter especial (!@#$%^&*)")
        
        # Verificar contraseñas comunes (blacklist básica)
        common_passwords = {
            'password', '12345678', 'qwerty123', 'admin123', 
            'letmein', 'welcome', 'monkey', 'dragon', 'master',
            'password1', 'Password1', '123456789', 'abc12345'
        }
        if password.lower() in common_passwords:
            errors.append("Esta contraseña es muy común. Elige una más segura")
        
        if errors:
            return False, "La contraseña " + "; ".join(errors)
        
        return True, "Contraseña válida"
    
    @staticmethod
    def get_password_requirements() -> dict:
        """
        Retorna los requisitos de contraseña actuales.
        Útil para mostrar al usuario las reglas.
        """
        from database.config import Config
        
        return {
            "min_length": Config.PASSWORD_MIN_LENGTH,
            "require_uppercase": Config.PASSWORD_REQUIRE_UPPERCASE,
            "require_lowercase": Config.PASSWORD_REQUIRE_LOWERCASE,
            "require_digit": Config.PASSWORD_REQUIRE_DIGIT,
            "require_special": Config.PASSWORD_REQUIRE_SPECIAL
        }

    # ----------------------------
    # HASH DE CONTRASEÑA
    # ----------------------------
    @staticmethod
    def hash_password(password: str, rounds: int = 12) -> str:
        """
        Genera un hash seguro para almacenar contraseñas.
        
        Args:
            password: Contraseña en texto plano
            rounds: Factor de costo bcrypt (default 12, recomendado para 2024+)
        
        Returns:
            Hash bcrypt como string
        """
        salt = bcrypt.gensalt(rounds=rounds)
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    # ----------------------------
    # VERIFICAR CONTRASEÑA
    # ----------------------------
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """
        Verifica si la contraseña ingresada coincide con el hash.
        Implementa comparación de tiempo constante para evitar timing attacks.
        """
        if not password or not hashed:
            return False
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        except (ValueError, TypeError):
            return False

    # ----------------------------
    # LIMPIAR INPUT (XSS Prevention)
    # ----------------------------
    @staticmethod
    def sanitize_input(value: str) -> str:
        """
        Sanitiza input para prevenir XSS.
        Escapa caracteres HTML peligrosos.
        """
        if not value:
            return value
        if not isinstance(value, str):
            value = str(value)
        return html.escape(value.strip())
    
    @staticmethod
    def sanitize_dict(data: dict, fields_to_sanitize: List[str] = None) -> dict:
        """
        Sanitiza campos específicos de un diccionario.
        
        Args:
            data: Diccionario con datos
            fields_to_sanitize: Lista de campos a sanitizar. Si es None, sanitiza todos los strings.
        """
        if not isinstance(data, dict):
            return data
            
        result = {}
        for key, value in data.items():
            if fields_to_sanitize is None or key in fields_to_sanitize:
                if isinstance(value, str):
                    result[key] = Seguridad.sanitize_input(value)
                elif isinstance(value, dict):
                    result[key] = Seguridad.sanitize_dict(value, fields_to_sanitize)
                else:
                    result[key] = value
            else:
                result[key] = value
        return result

    # ----------------------------
    # VALIDAR ID NUMÉRICO
    # ----------------------------
    @staticmethod
    def validate_id(value) -> Optional[int]:
        """
        Valida y convierte un ID a entero seguro.
        Previene inyección de valores maliciosos.
        """
        if value is None:
            return None
        try:
            id_int = int(value)
            if id_int <= 0:
                return None
            return id_int
        except (ValueError, TypeError):
            return None

    # ----------------------------
    # GENERAR TOKEN SEGURO
    # ----------------------------
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Genera un token criptográficamente seguro."""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def generate_numeric_code(length: int = 6) -> str:
        """Genera un código numérico seguro (para verificación 2FA)."""
        return ''.join(str(secrets.randbelow(10)) for _ in range(length))


# ----------------------------
# DECORADOR PARA ROLES
# ----------------------------
def role_required(required_role):
    """
    Decorador para verificar que el usuario tenga el rol requerido.
    Acepta un `str` (ej. 'admin') o una lista de roles (ej. ['admin','moderator']).
    Uso: @role_required('admin') o @role_required(['admin'])
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            from utils.security_middleware import secure_log
            
            try:
                # Importación local para evitar dependencias circulares
                from services.usuario_service import UsuarioService
                
                # Obtener el ID del usuario del token JWT
                current_user_id = get_jwt_identity()
                
                if not current_user_id:
                    secure_log.warning("Intento de acceso sin token válido", 
                                      data={"endpoint": request.endpoint})
                    return jsonify({
                        'success': False,
                        'message': 'Token inválido o no proporcionado'
                    }), 401
                
                # Validar que el ID sea un entero válido
                user_id = Seguridad.validate_id(current_user_id)
                if not user_id:
                    return jsonify({
                        'success': False,
                        'message': 'Token inválido'
                    }), 401
                
                # Obtener información del usuario
                user = UsuarioService.get_usuario_by_id(user_id)
                
                if not user:
                    secure_log.warning("Usuario no encontrado en verificación de rol",
                                      data={"user_id": user_id})
                    return jsonify({
                        'success': False,
                        'message': 'Usuario no encontrado'
                    }), 404
                
                # Obtener roles desde la tabla rol_usuario (soporta múltiples roles)
                from backend.models.rol_usuario import RolUsuario

                try:
                    user_roles = RolUsuario.get_user_roles(user_id)
                    roles_list = [r.get('nombre_rol') for r in user_roles] if user_roles else []
                except Exception as e:
                    secure_log.error("Error obteniendo roles de usuario", 
                                    data={"error": str(e)}, user_id=user_id)
                    roles_list = []

                if not roles_list:
                    return jsonify({
                        'success': False,
                        'message': 'El usuario no tiene un rol asignado'
                    }), 403

                # Normalizar required_role a lista para permitir comprobar varios roles
                if isinstance(required_role, (list, tuple, set)):
                    required_roles = list(required_role)
                else:
                    required_roles = [required_role]

                # Verificar si al menos uno de los roles requeridos está presente
                if not any(r in roles_list for r in required_roles):
                    secure_log.security(
                        "Acceso denegado por rol insuficiente",
                        data={
                            "required": required_roles,
                            "user_roles": roles_list,
                            "endpoint": request.endpoint
                        },
                        user_id=user_id
                    )
                    return jsonify({
                        'success': False,
                        'message': f'Se requiere uno de los roles {required_roles}'
                    }), 403
                
                return fn(*args, **kwargs)
                
            except Exception as e:
                secure_log.error("Error en verificación de rol", data={"error": str(e)})
                return jsonify({
                    'success': False,
                    'message': 'Error al verificar permisos'
                }), 500
        
        return wrapper
    return decorator
