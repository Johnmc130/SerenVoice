# backend/routes/alertas_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.services.alertas_service import AlertasService
from backend.utils.helpers import Helpers
from backend.utils.seguridad import role_required

bp = Blueprint('alertas', __name__, url_prefix='/api/alertas')

@bp.route('/my-alerts', methods=['GET'])
@jwt_required()
def get_my_alerts():
    """Obtener alertas del usuario actual"""
    user_id = get_jwt_identity()
    alertas = AlertasService.get_user_alerts(user_id)
    
    return Helpers.format_response(
        success=True,
        data=alertas,
        status=200
    )

@bp.route('/active', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_active_alerts():
    """Obtener todas las alertas activas (solo admin)"""
    alertas = AlertasService.get_active_alerts()
    
    return Helpers.format_response(
        success=True,
        data=alertas,
        status=200
    )


@bp.route('/criticas', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_critical_alerts():
    """Obtener alertas críticas (compatibilidad con frontend)"""
    alertas = AlertasService.get_critical_alerts()

    return Helpers.format_response(
        success=True,
        data=alertas,
        status=200
    )

@bp.route('/<int:id_alerta>', methods=['GET'])
@jwt_required()
def get_alert(id_alerta):
    """Obtener alerta específica"""
    alerta = AlertasService.get_alert_by_id(id_alerta)
    
    if not alerta:
        return Helpers.format_response(
            success=False,
            message='Alerta no encontrada',
            status=404
        )
    
    return Helpers.format_response(
        success=True,
        data=alerta,
        status=200
    )


@bp.route('/<int:id_alerta>/asignar', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def assign_alert(id_alerta):
    """Asignar una alerta al admin que realiza la petición"""
    admin_id = get_jwt_identity()
    success = AlertasService.assign_alert(id_alerta, admin_id)
    if success:
        return Helpers.format_response(success=True, message='Alerta asignada', status=200)
    return Helpers.format_response(success=False, message='No se pudo asignar la alerta', status=500)


@bp.route('/<int:id_alerta>/resolver', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def resolve_alert(id_alerta):
    """Marcar alerta como revisada"""
    data = request.get_json(silent=True) or {}
    notas = data.get('notas')
    admin_id = get_jwt_identity()
    try:
        ok = AlertasService.resolve_alert(id_alerta, admin_id, notas)
        if ok:
            return Helpers.format_response(success=True, message='Alerta marcada como resuelta', status=200)
        return Helpers.format_response(success=False, message='No se pudo marcar como resuelta', status=500)
    except Exception as e:
        print(f"[ERROR] Al marcar resuelta: {e}")
        return Helpers.format_response(success=False, message=str(e), status=500)


@bp.route('/<int:id_alerta>/historial', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_historial(id_alerta):
    """Obtener historial de acciones para una alerta"""
    try:
        historial = AlertasService.get_historial(id_alerta)
        return Helpers.format_response(success=True, data=historial, status=200)
    except Exception as e:
        print(f"[ERROR] Al obtener historial: {e}")
        return Helpers.format_response(success=False, message=str(e), status=500)
