# backend/routes/sesiones_juego_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.utils.helpers import Helpers
from backend.utils.seguridad import role_required
from backend.database.connection import DatabaseConnection

bp = Blueprint('sesiones_juego', __name__, url_prefix='/api/sesiones-juego')

@bp.route('/todas', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_todas_sesiones():
    """Obtener todas las sesiones de juego terapéutico"""
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT 
                sj.id,
                sj.id_usuario,
                u.nombre as usuario,
                u.correo as email,
                sj.id_juego,
                jt.nombre as nombre_juego,
                jt.descripcion as descripcion_juego,
                sj.fecha_inicio,
                sj.fecha_fin,
                sj.duracion_segundos,
                TIMESTAMPDIFF(MINUTE, sj.fecha_inicio, sj.fecha_fin) as duracion_minutos,
                sj.estado_antes,
                sj.estado_despues,
                sj.mejora_percibida,
                sj.completado,
                sj.puntuacion,
                sj.nivel_alcanzado,
                sj.notas
            FROM sesiones_juego sj
            LEFT JOIN usuario u ON sj.id_usuario = u.id_usuario
            LEFT JOIN juegos_terapeuticos jt ON sj.id_juego = jt.id
            ORDER BY sj.fecha_inicio DESC
            LIMIT 500
        """
        
        cursor.execute(query)
        sesiones = cursor.fetchall()
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return Helpers.format_response(
            success=True,
            data=sesiones,
            status=200
        )
    except Exception as e:
        return Helpers.format_response(
            success=False,
            message=f'Error al obtener sesiones de juego: {str(e)}',
            status=500
        )

@bp.route('/estadisticas', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_estadisticas():
    """Obtener estadísticas de sesiones de juego"""
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total de sesiones
        cursor.execute("SELECT COUNT(*) as total FROM sesiones_juego")
        total = cursor.fetchone()['total']
        
        # Sesiones completadas
        cursor.execute("SELECT COUNT(*) as completadas FROM sesiones_juego WHERE completado = TRUE")
        completadas = cursor.fetchone()['completadas']
        
        # Duración promedio
        cursor.execute("""
            SELECT AVG(TIMESTAMPDIFF(MINUTE, fecha_inicio, fecha_fin)) as duracion_promedio 
            FROM sesiones_juego 
            WHERE fecha_fin IS NOT NULL
        """)
        duracion_promedio = cursor.fetchone()['duracion_promedio'] or 0
        
        # Puntuación promedio (columna `puntuacion` en el esquema)
        cursor.execute("""
            SELECT AVG(puntuacion) as puntuacion_promedio 
            FROM sesiones_juego 
            WHERE puntuacion IS NOT NULL
        """)
        puntuacion_promedio = cursor.fetchone()['puntuacion_promedio'] or 0

        # Juegos disponibles (usar PK `id_juego` de la tabla juegos_terapeuticos)
        cursor.execute("SELECT id_juego, nombre FROM juegos_terapeuticos WHERE activo = TRUE")
        juegos = cursor.fetchall()
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return Helpers.format_response(
            success=True,
            data={
                'total': total,
                'completadas': completadas,
                'duracion_promedio': round(duracion_promedio, 1),
                'puntuacion_promedio': round(puntuacion_promedio, 1),
                'juegos': juegos
            },
            status=200
        )
    except Exception as e:
        return Helpers.format_response(
            success=False,
            message=f'Error al obtener estadísticas: {str(e)}',
            status=500
        )

@bp.route('/usuario/<int:id_usuario>', methods=['GET'])
@jwt_required()
def get_sesiones_usuario(id_usuario):
    """Obtener sesiones de juego de un usuario específico"""
    try:
        current_user = get_jwt_identity()
        
        # Verificar permisos (solo el propio usuario o admin)
        if current_user != id_usuario:
            # Aquí deberías verificar si es admin
            pass
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT 
                sj.*,
                jt.nombre as nombre_juego,
                jt.descripcion as descripcion_juego
            FROM sesiones_juego sj
            LEFT JOIN juegos_terapeuticos jt ON sj.id_juego = jt.id
            WHERE sj.id_usuario = %s
            ORDER BY sj.fecha_inicio DESC
        """
        
        cursor.execute(query, (id_usuario,))
        sesiones = cursor.fetchall()
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return Helpers.format_response(
            success=True,
            data=sesiones,
            status=200
        )
    except Exception as e:
        return Helpers.format_response(
            success=False,
            message=f'Error al obtener sesiones: {str(e)}',
            status=500
        )
