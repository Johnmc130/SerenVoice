"""
Decoradores personalizados para rutas protegidas
"""

from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_claims
from flask import jsonify


def require_role(*roles):
    """
    Decorador para requerir un rol específico
    
    Uso:
        @app.route('/admin')
        @require_role('admin')
        def admin_route():
            return {...}
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt_claims()
            user_role = claims.get('role', 'user')
            
            if user_role not in roles:
                return jsonify({
                    'success': False,
                    'error': f'Se requiere uno de estos roles: {", ".join(roles)}'
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def require_permission(permission):
    """
    Decorador para requerir un permiso específico
    
    Uso:
        @app.route('/admin')
        @require_permission('admin_access')
        def admin_route():
            return {...}
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt_claims()
            permissions = claims.get('permissions', [])
            
            if permission not in permissions:
                return jsonify({
                    'success': False,
                    'error': f'Se requiere el permiso: {permission}'
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
