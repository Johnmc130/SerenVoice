# backend/routes/resultados_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.resultado_analisis import ResultadoAnalisis
from backend.models.analisis import Analisis
from backend.models.audio import Audio
from backend.utils.helpers import Helpers

bp = Blueprint('resultados', __name__, url_prefix='/api/resultados')

@bp.route('/<int:id_resultado>', methods=['GET'])
@jwt_required()
def get_resultado(id_resultado):
    """Obtener resultado por ID"""
    user_id = get_jwt_identity()
    
    resultado = ResultadoAnalisis.get_by_id(id_resultado)
    
    if not resultado:
        return Helpers.format_response(
            success=False,
            message='Resultado no encontrado',
            status=404
        )
    
    # Verificar permisos
    analisis = Analisis.get_by_id(resultado['id_analisis'])
    audio = Audio.get_by_id(analisis['id_audio'])
    
    if audio['id_usuario'] != user_id:
        return Helpers.format_response(
            success=False,
            message='No tienes permisos para ver este resultado',
            status=403
        )
    
    return Helpers.format_response(
        success=True,
        data=resultado,
        status=200
    )
