# backend/routes/analisis_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.services.analisis_service import AnalisisService
from backend.utils.helpers import Helpers
from backend.utils.seguridad import role_required
from backend.database.connection import DatabaseConnection
import traceback

bp = Blueprint('analisis', __name__, url_prefix='/api/analisis')

@bp.route('/<int:id_analisis>', methods=['GET'])
@jwt_required()
def get_analisis(id_analisis):
    """Obtener detalle de un análisis"""
    from models.audio import Audio
    from models.analisis import Analisis
    
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except Exception:
        # si no se puede convertir, dejar como estaba (permitirá la comparación fallida que resultará en 403)
        pass
    
    # Verificar que el análisis pertenece al usuario
    analisis = Analisis.get_by_id(id_analisis)
    if not analisis:
        return Helpers.format_response(
            success=False,
            message='Análisis no encontrado',
            status=404
        )
    
    audio = Audio.get_by_id(analisis['id_audio'])
    if audio['id_usuario'] != user_id:
        return Helpers.format_response(
            success=False,
            message='No tienes permisos para ver este análisis',
            status=403
        )
    
    # Obtener detalle completo
    detalle = AnalisisService.get_analysis_detail(id_analisis)
    
    return Helpers.format_response(
        success=True,
        data=detalle,
        status=200
    )

@bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Obtener historial de análisis del usuario"""
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 10, type=int)
    
    history = AnalisisService.get_user_history(user_id, limit)
    
    return Helpers.format_response(
        success=True,
        data=history,
        status=200
    )


@bp.route('/hoy', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_analisis_hoy():
    """Contar análisis realizados hoy (compatibilidad con frontend)"""
    try:
        query = "SELECT COUNT(*) AS total FROM analisis WHERE fecha_analisis = CURRENT_DATE() AND activo = 1"
        result = DatabaseConnection.execute_query(query)
        total = result[0]['total'] if result and len(result) > 0 else 0

        return Helpers.format_response(success=True, data={'total': total}, status=200)
    except Exception as e:
        tb = traceback.format_exc()
        print('[ANALISIS] Error en get_analisis_hoy:\n', tb)
        return Helpers.format_response(False, str(e), status=500)