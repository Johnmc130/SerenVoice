# backend/routes/auditoria_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.utils.helpers import Helpers
from backend.utils.seguridad import role_required
from backend.database.connection import DatabaseConnection

bp = Blueprint('auditoria', __name__, url_prefix='/api/auditoria')

@bp.route('/sesiones', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_sesiones():
    """Obtener historial de sesiones de usuarios"""
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT 
                s.id_sesion,
                s.id_usuario,
                u.nombre as usuario,
                u.correo as email,
                s.ip_address,
                s.user_agent as dispositivo,
                s.fecha_inicio,
                s.fecha_fin,
                TIMESTAMPDIFF(MINUTE, s.fecha_inicio, s.fecha_fin) as duracion_minutos
            FROM sesion s
            LEFT JOIN usuario u ON s.id_usuario = u.id_usuario
            ORDER BY s.fecha_inicio DESC
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
            message=f'Error al obtener sesiones: {str(e)}',
            status=500
        )

@bp.route('/cambios-roles', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_cambios_roles():
    """Obtener historial de cambios de roles"""
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT 
                ru.id_rol_usuario as id_cambio,
                u.nombre as usuario,
                u.correo as email,
                r.nombre_rol as rol_nuevo,
                'usuario' as rol_anterior,
                NULL as admin_asigna,
                ru.fecha_creacion as fecha_cambio
            FROM rol_usuario ru
            LEFT JOIN usuario u ON ru.id_usuario = u.id_usuario
            LEFT JOIN rol r ON ru.id_rol = r.id_rol
            ORDER BY ru.fecha_creacion DESC
            LIMIT 500
        """
        
        cursor.execute(query)
        cambios = cursor.fetchall()
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return Helpers.format_response(
            success=True,
            data=cambios,
            status=200
        )
    except Exception as e:
        return Helpers.format_response(
            success=False,
            message=f'Error al obtener cambios de roles: {str(e)}',
            status=500
        )

@bp.route('/actividad-sospechosa', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_actividad_sospechosa():
    """Detectar actividad sospechosa (múltiples intentos de login, accesos desde IPs diferentes, etc.)"""
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Detectar múltiples sesiones desde diferentes IPs en el mismo día
        query = """
            SELECT 
                s.id_usuario,
                u.nombre as usuario,
                u.correo as email,
                'Múltiples IPs en 24h' as tipo_actividad,
                CONCAT('Accesos desde ', COUNT(DISTINCT s.ip_address), ' IPs diferentes') as descripcion,
                CASE 
                    WHEN COUNT(DISTINCT s.ip_address) > 5 THEN 'critica'
                    WHEN COUNT(DISTINCT s.ip_address) > 3 THEN 'alta'
                    ELSE 'media'
                END as nivel_gravedad,
                MAX(s.fecha_inicio) as fecha_deteccion,
                GROUP_CONCAT(DISTINCT s.ip_address) as ip_address
            FROM sesion s
            LEFT JOIN usuario u ON s.id_usuario = u.id_usuario
            WHERE s.fecha_inicio >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            GROUP BY s.id_usuario, u.nombre, u.correo
            HAVING COUNT(DISTINCT s.ip_address) > 2
            
            UNION ALL
            
            SELECT 
                s.id_usuario,
                u.nombre as usuario,
                u.correo as email,
                'Sesiones simultáneas' as tipo_actividad,
                CONCAT(COUNT(*), ' sesiones activas simultáneas') as descripcion,
                CASE 
                    WHEN COUNT(*) > 5 THEN 'alta'
                    ELSE 'media'
                END as nivel_gravedad,
                MAX(s.fecha_inicio) as fecha_deteccion,
                s.ip_address
            FROM sesion s
            LEFT JOIN usuario u ON s.id_usuario = u.id_usuario
            WHERE s.fecha_fin IS NULL
            GROUP BY s.id_usuario, u.nombre, u.correo, s.ip_address
            HAVING COUNT(*) > 3
            
            ORDER BY nivel_gravedad DESC, fecha_deteccion DESC
            LIMIT 100
        """
        
        cursor.execute(query)
        actividades = cursor.fetchall()
        
        # Agregar ID único para cada actividad
        for idx, actividad in enumerate(actividades):
            actividad['id_actividad'] = idx + 1
            actividad['acciones_tomadas'] = 'Pendiente revisión'
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return Helpers.format_response(
            success=True,
            data=actividades,
            status=200
        )
    except Exception as e:
        return Helpers.format_response(
            success=False,
            message=f'Error al obtener actividad sospechosa: {str(e)}',
            status=500
        )
