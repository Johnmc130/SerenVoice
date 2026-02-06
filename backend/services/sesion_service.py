# backend/services/sesion_service.py
from backend.models.sesion import Sesion
from backend.database.connection import DatabaseConnection

class SesionService:
    """Servicio de gestión de sesiones"""
    
    @staticmethod
    def create_session(id_usuario):
        """
        Crear nueva sesión
        
        Args:
            id_usuario: ID del usuario
        
        Returns:
            int: ID de la sesión creada
        """
        return Sesion.create(id_usuario)
    
    @staticmethod
    def get_session_by_id(id_sesion):
        """Obtener sesión por ID"""
        return Sesion.get_by_id(id_sesion)
    
    @staticmethod
    def get_user_sessions(id_usuario, limit=10):
        """Obtener sesiones de un usuario"""
        return Sesion.get_user_sessions(id_usuario, limit)
    
    @staticmethod
    def get_active_sessions(id_usuario):
        """Obtener sesiones activas de un usuario"""
        return Sesion.get_active_sessions(id_usuario)
    
    @staticmethod
    def close_session(id_sesion):
        """
        Cerrar sesión
        
        Args:
            id_sesion: ID de la sesión
        
        Returns:
            dict: Resultado de la operación
        """
        if Sesion.close_session(id_sesion):
            return {'success': True, 'message': 'Sesión cerrada exitosamente'}
        
        return {'success': False, 'error': 'Error al cerrar sesión'}
    
    @staticmethod
    def close_all_user_sessions(id_usuario):
        """
        Cerrar todas las sesiones activas de un usuario
        
        Args:
            id_usuario: ID del usuario
        
        Returns:
            dict: Resultado de la operación
        """
        if Sesion.close_all_user_sessions(id_usuario):
            return {'success': True, 'message': 'Todas las sesiones cerradas exitosamente'}
        
        return {'success': False, 'error': 'Error al cerrar sesiones'}
    
    @staticmethod
    def get_session_statistics(id_usuario):
        """
        Obtener estadísticas de sesiones del usuario
        
        Args:
            id_usuario: ID del usuario
        
        Returns:
            dict: Estadísticas de sesiones
        """
        query = """
            SELECT 
                COUNT(*) as total_sesiones,
                COUNT(CASE WHEN estado = 'activa' THEN 1 END) as sesiones_activas,
                COUNT(CASE WHEN estado = 'cerrada' THEN 1 END) as sesiones_cerradas,
                -- duracion is stored as TIME; convert to seconds then to minutes for numeric average
                AVG(TIME_TO_SEC(duracion))/60.0 as duracion_promedio,
                MAX(fecha_inicio) as ultima_sesion
            FROM sesion
            WHERE id_usuario = %s
        """
        
        result = DatabaseConnection.execute_query(query, (id_usuario,))
        return result[0] if result else None
    
    @staticmethod
    def get_recent_sessions(id_usuario, dias=7):
        """
        Obtener sesiones recientes de los últimos N días
        
        Args:
            id_usuario: ID del usuario
            dias: Número de días hacia atrás
        
        Returns:
            list: Sesiones recientes
        """
        query = """
            SELECT *
            FROM sesion
            WHERE id_usuario = %s
            AND fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
            ORDER BY fecha_inicio DESC
        """
        
        return DatabaseConnection.execute_query(query, (id_usuario, dias))
    
    @staticmethod
    def get_all_active_sessions():
        """
        Obtener todas las sesiones activas del sistema (admin)
        
        Returns:
            list: Todas las sesiones activas
        """
        query = """
            SELECT s.*, u.nombre, u.apellido, u.correo
            FROM sesion s
            JOIN usuario u ON s.id_usuario = u.id_usuario
            WHERE s.estado = 'activa'
            ORDER BY s.fecha_inicio DESC
        """
        
        return DatabaseConnection.execute_query(query)
    
    @staticmethod
    def get_session_duration_stats(id_usuario):
        """
        Obtener estadísticas de duración de sesiones
        
        Args:
            id_usuario: ID del usuario
        
        Returns:
            dict: Estadísticas de duración
        """
        import numpy as np
        
        query = """
            -- Return duration in minutes as numeric value
            SELECT TIME_TO_SEC(duracion)/60.0 as duracion_min
            FROM sesion
            WHERE id_usuario = %s AND duracion IS NOT NULL
        """
        
        results = DatabaseConnection.execute_query(query, (id_usuario,))
        
        if not results:
            return {
                'total': 0,
                'promedio': 0,
                'min': 0,
                'max': 0
            }
        
        duraciones = [float(r['duracion_min']) for r in results]
        
        return {
            'total': len(duraciones),
            'promedio': round(np.mean(duraciones), 2),
            'min': round(np.min(duraciones), 2),
            'max': round(np.max(duraciones), 2)
        }
