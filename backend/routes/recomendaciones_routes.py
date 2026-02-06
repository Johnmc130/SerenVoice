# backend/routes/recomendaciones_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.recomendacion import Recomendacion
from backend.models.resultado_analisis import ResultadoAnalisis
from backend.models.analisis import Analisis
from backend.models.audio import Audio
from backend.database.connection import DatabaseConnection
from backend.utils.helpers import Helpers
from backend.utils.seguridad import role_required
from backend.database.connection import DatabaseConnection

bp = Blueprint('recomendaciones', __name__, url_prefix='/api/recomendaciones')

@bp.route('', methods=['GET'])
@jwt_required()
def get_recomendaciones_usuario():
    """Obtener todas las recomendaciones del usuario actual"""
    user_id = get_jwt_identity()
    
    try:
        # Convertir user_id a entero (viene como string del JWT)
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            return Helpers.format_response(
                success=False,
                message='ID de usuario inválido',
                status=400
            )
        
        print(f"[DEBUG] Buscando recomendaciones para user_id: {user_id_int}")
        
        # Query que filtra por usuario y trae información relevante
        query = """
            SELECT 
                r.id_recomendacion,
                r.id_resultado,
                r.tipo_recomendacion,
                r.prioridad,
                r.contenido,
                r.aplica,
                r.fecha_aplica,
                r.util,
                r.fecha_generacion,
                r.activo,
                ra.clasificacion,
                ra.nivel_estres,
                ra.nivel_ansiedad,
                ra.emocion_dominante,
                a.id_analisis,
                a.fecha_analisis,
                au.nombre_archivo
            FROM recomendaciones r
            JOIN resultado_analisis ra ON r.id_resultado = ra.id_resultado
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s AND r.activo = 1
            ORDER BY r.fecha_generacion DESC
            LIMIT 50
        """
        
        result = DatabaseConnection.execute_query(query, (user_id_int,), fetch=True)
        print(f"[DEBUG] Resultado de query: {len(result) if result else 0} recomendaciones")
        
        return Helpers.format_response(
            success=True,
            data={'recomendaciones': result or []},
            status=200
        )
    except Exception as e:
        print(f"[ERROR] get_recomendaciones_usuario: {str(e)}")
        import traceback
        traceback.print_exc()
        return Helpers.format_response(
            success=False,
            message=f'Error al obtener recomendaciones: {str(e)}',
            status=500
        )
@bp.route('/todas', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_todas_recomendaciones():
    """Obtener todas las recomendaciones (solo admin)"""
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT 
                r.id_recomendacion,
                r.tipo_recomendacion,
                r.prioridad,
                r.contenido,
                r.aplica,
                r.fecha_aplica,
                r.util,
                r.fecha_generacion,
                u.nombre as usuario,
                u.correo as email
            FROM recomendaciones r
            LEFT JOIN resultado_analisis ra ON r.id_resultado = ra.id_resultado
            LEFT JOIN analisis a ON ra.id_analisis = a.id_analisis
            LEFT JOIN audio au ON a.id_audio = au.id_audio
            LEFT JOIN usuario u ON au.id_usuario = u.id_usuario
            ORDER BY r.fecha_generacion DESC
        """
        
        cursor.execute(query)
        recomendaciones = cursor.fetchall()
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return Helpers.format_response(
            success=True,
            data=recomendaciones,
            status=200
        )
    except Exception as e:
        return Helpers.format_response(
            success=False,
            message=f'Error al obtener recomendaciones: {str(e)}',
            status=500
        )

@bp.route('/estadisticas', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_estadisticas_recomendaciones():
    """Obtener estadísticas de recomendaciones (solo admin)"""
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total de recomendaciones
        cursor.execute("SELECT COUNT(*) as total FROM recomendaciones")
        total = cursor.fetchone()['total']
        
        # Recomendaciones aplicadas
        cursor.execute("SELECT COUNT(*) as aplicadas FROM recomendaciones WHERE aplica = TRUE")
        aplicadas = cursor.fetchone()['aplicadas']
        
        # Recomendaciones útiles
        cursor.execute("SELECT COUNT(*) as utiles FROM recomendaciones WHERE util = TRUE")
        utiles = cursor.fetchone()['utiles']
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return Helpers.format_response(
            success=True,
            data={
                'total': total,
                'aplicadas': aplicadas,
                'utiles': utiles
            },
            status=200
        )
    except Exception as e:
        return Helpers.format_response(
            success=False,
            message=f'Error al obtener estadísticas: {str(e)}',
            status=500
        )

@bp.route('/resultado/<int:id_resultado>', methods=['GET'])
@jwt_required()
def get_recomendaciones_by_resultado(id_resultado):
    """Obtener recomendaciones de un resultado"""
    user_id = get_jwt_identity()
    
    # Verificar permisos
    resultado = ResultadoAnalisis.get_by_id(id_resultado)
    if not resultado:
        return Helpers.format_response(
            success=False,
            message='Resultado no encontrado',
            status=404
        )
    
    analisis = Analisis.get_by_id(resultado['id_analisis'])
    audio = Audio.get_by_id(analisis['id_audio'])
    
    if audio['id_usuario'] != user_id:
        return Helpers.format_response(
            success=False,
            message='No tienes permisos para ver estas recomendaciones',
            status=403
        )
    
    recomendaciones = Recomendacion.get_by_result(id_resultado)
    
    return Helpers.format_response(
        success=True,
        data=recomendaciones,
        status=200
    )

@bp.route('/<int:id_recomendacion>', methods=['GET'])
@jwt_required()
def get_recomendacion(id_recomendacion):
    """Obtener una recomendación específica"""
    user_id = get_jwt_identity()
    
    recomendacion = Recomendacion.get_by_id(id_recomendacion)
    
    if not recomendacion:
        return Helpers.format_response(
            success=False,
            message='Recomendación no encontrada',
            status=404
        )
    
    # Verificar permisos
    resultado = ResultadoAnalisis.get_by_id(recomendacion['id_resultado'])
    analisis = Analisis.get_by_id(resultado['id_analisis'])
    audio = Audio.get_by_id(analisis['id_audio'])
    
    if audio['id_usuario'] != user_id:
        return Helpers.format_response(
            success=False,
            message='No tienes permisos',
            status=403
        )
    
    return Helpers.format_response(
        success=True,
        data=recomendacion,
        status=200
    )

@bp.route('/<int:id_recomendacion>/aplicar', methods=['PUT'])
@jwt_required()
def marcar_aplicada(id_recomendacion):
    """Marcar una recomendación como aplicada"""
    user_id = get_jwt_identity()
    
    # Convertir user_id a entero (viene como string del JWT)
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        return Helpers.format_response(
            success=False,
            message='ID de usuario inválido',
            status=400
        )
    
    print(f"[DEBUG aplicar] user_id del JWT: {user_id} (tipo: {type(user_id)})")
    print(f"[DEBUG aplicar] user_id_int: {user_id_int}")
    
    try:
        recomendacion = Recomendacion.get_by_id(id_recomendacion)
        print(f"[DEBUG aplicar] recomendacion: {recomendacion}")
        
        if not recomendacion:
            return Helpers.format_response(
                success=False,
                message='Recomendación no encontrada',
                status=404
            )
        
        # Verificar permisos
        resultado = ResultadoAnalisis.get_by_id(recomendacion['id_resultado'])
        print(f"[DEBUG aplicar] resultado: {resultado}")
        analisis = Analisis.get_by_id(resultado['id_analisis'])
        print(f"[DEBUG aplicar] analisis: {analisis}")
        audio = Audio.get_by_id(analisis['id_audio'])
        print(f"[DEBUG aplicar] audio: {audio}")
        print(f"[DEBUG aplicar] audio['id_usuario']: {audio['id_usuario']} (tipo: {type(audio['id_usuario'])})")
        print(f"[DEBUG aplicar] Comparación: {audio['id_usuario']} != {user_id_int} = {audio['id_usuario'] != user_id_int}")
        
        if audio['id_usuario'] != user_id_int:
            return Helpers.format_response(
                success=False,
                message='No tienes permisos',
                status=403
            )
        
        # Actualizar la recomendación
        query = """
            UPDATE recomendaciones 
            SET aplica = 1, fecha_aplica = NOW() 
            WHERE id_recomendacion = %s
        """
        DatabaseConnection.execute_query(query, (id_recomendacion,), fetch=False)
        
        return Helpers.format_response(
            success=True,
            message='Recomendación marcada como aplicada',
            status=200
        )
    except Exception as e:
        return Helpers.format_response(
            success=False,
            message=f'Error al marcar recomendación: {str(e)}',
            status=500
        )

@bp.route('/<int:id_recomendacion>/util', methods=['PUT'])
@jwt_required()
def marcar_util(id_recomendacion):
    """Marcar una recomendación como útil"""
    user_id = get_jwt_identity()
    
    # Convertir user_id a entero (viene como string del JWT)
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        return Helpers.format_response(
            success=False,
            message='ID de usuario inválido',
            status=400
        )
    
    try:
        data = request.get_json() or {}
        util = data.get('util', True)
        
        recomendacion = Recomendacion.get_by_id(id_recomendacion)
        
        if not recomendacion:
            return Helpers.format_response(
                success=False,
                message='Recomendación no encontrada',
                status=404
            )
        
        # Verificar permisos
        resultado = ResultadoAnalisis.get_by_id(recomendacion['id_resultado'])
        analisis = Analisis.get_by_id(resultado['id_analisis'])
        audio = Audio.get_by_id(analisis['id_audio'])
        
        if audio['id_usuario'] != user_id_int:
            return Helpers.format_response(
                success=False,
                message='No tienes permisos',
                status=403
            )
        
        # Actualizar la recomendación
        query = """
            UPDATE recomendaciones 
            SET util = %s 
            WHERE id_recomendacion = %s
        """
        DatabaseConnection.execute_query(query, (1 if util else 0, id_recomendacion), fetch=False)
        
        return Helpers.format_response(
            success=True,
            message='Utilidad de recomendación actualizada',
            status=200
        )
    except Exception as e:
        return Helpers.format_response(
            success=False,
            message=f'Error al actualizar recomendación: {str(e)}',
            status=500
        )
