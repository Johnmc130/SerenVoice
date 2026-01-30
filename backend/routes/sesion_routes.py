# backend/routes/sesion_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.sesion import Sesion
from backend.utils.helpers import Helpers

bp = Blueprint('sesiones', __name__, url_prefix='/api/sesiones')

@bp.route('/my-sessions', methods=['GET'])
@jwt_required()
def get_my_sessions():
    """Obtener sesiones del usuario actual"""
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 10, type=int)
    
    sesiones = Sesion.get_user_sessions(user_id, limit)
    
    return Helpers.format_response(
        success=True,
        data=sesiones,
        status=200
    )

@bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_sessions():
    """Obtener sesiones activas del usuario"""
    user_id = get_jwt_identity()
    sesiones = Sesion.get_active_sessions(user_id)
    
    return Helpers.format_response(
        success=True,
        data=sesiones,
        status=200
    )

@bp.route('/<int:id_sesion>/close', methods=['PUT'])
@jwt_required()
def close_session(id_sesion):
    """Cerrar sesión específica"""
    # get_jwt_identity() devuelve la identidad tal como se guardó en el token
    # Convertimos a int para evitar comparaciones entre str e int
    try:
        user_id = int(get_jwt_identity())
    except Exception:
        user_id = get_jwt_identity()
    
    sesion = Sesion.get_by_id(id_sesion)
    
    if not sesion:
        return Helpers.format_response(
            success=False,
            message='Sesión no encontrada',
            status=404
        )
    
    if sesion['id_usuario'] != user_id:
        return Helpers.format_response(
            success=False,
            message='No tienes permisos para cerrar esta sesión',
            status=403
        )
    
    Sesion.close_session(id_sesion)
    
    return Helpers.format_response(
        success=True,
        message='Sesión cerrada exitosamente',
        status=200
    )


@bp.route('/close-all', methods=['PUT'])
@jwt_required()
def close_all_sessions():
    """Cerrar todas las sesiones activas del usuario actual"""
    try:
        user_id = int(get_jwt_identity())
    except Exception:
        user_id = get_jwt_identity()
    try:
        Sesion.close_all_user_sessions(user_id)
        return Helpers.format_response(success=True, message='Todas las sesiones cerradas', status=200)
    except Exception as e:
        return Helpers.format_response(success=False, message=str(e), status=500)