# backend/models/sesion.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class Sesion:
    """Modelo para la tabla Sesion"""
    
    @staticmethod
    def create(id_usuario, estado='activa', ip_address=None, dispositivo=None, navegador=None, sistema_operativo=None, ultimo_acceso=None):
        """Crear nueva sesión con metadatos del cliente"""
        # Si no se proporciona ultimo_acceso, usar la fecha actual
        if ultimo_acceso is None:
            ultimo_acceso = datetime.now()

        query = """
            INSERT INTO sesion (
                id_usuario, fecha_inicio, estado,
                ip_address, dispositivo, navegador, sistema_operativo, ultimo_acceso
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        return DatabaseConnection.execute_query(
            query,
            (
                id_usuario,
                datetime.now(),
                estado,
                ip_address,
                dispositivo,
                navegador,
                sistema_operativo,
                ultimo_acceso,
            ),
            fetch=False
        )
    
    @staticmethod
    def get_by_id(id_sesion):
        """Obtener sesión por ID"""
        query = "SELECT * FROM sesion WHERE id_sesion = %s AND activa = 1"
        results = DatabaseConnection.execute_query(query, (id_sesion,))
        return results[0] if results else None
    
    @staticmethod
    def get_user_sessions(id_usuario, limit=10):
        """Obtener sesiones de un usuario"""
        query = """
            SELECT * FROM sesion 
            WHERE id_usuario = %s AND activa = 1
            ORDER BY fecha_inicio DESC 
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def get_active_sessions(id_usuario):
        """Obtener sesiones activas de un usuario"""
        query = """
            SELECT * FROM sesion 
            WHERE id_usuario = %s AND estado = 'activa' AND activa = 1
        """
        return DatabaseConnection.execute_query(query, (id_usuario,))
    
    @staticmethod
    def close_session(id_sesion):
        """Cerrar sesión"""
        fecha_fin = datetime.now()
        query = """
            UPDATE sesion
            SET fecha_fin = %s,
                -- duracion stored as TIME; use TIMEDIFF to compute hh:mm:ss
                duracion = TIMEDIFF(%s, fecha_inicio),
                estado = 'cerrada'
            WHERE id_sesion = %s
        """
        # Note: TIMEDIFF(fecha_fin, fecha_inicio) returns TIME
        DatabaseConnection.execute_query(query, (fecha_fin, fecha_fin, id_sesion), fetch=False)
        return True
    
    @staticmethod
    def close_all_user_sessions(id_usuario):
        """Cerrar todas las sesiones activas de un usuario"""
        fecha_fin = datetime.now()
        query = """
            UPDATE sesion
            SET fecha_fin = %s,
                duracion = TIMEDIFF(%s, fecha_inicio),
                estado = 'cerrada'
            WHERE id_usuario = %s AND estado = 'activa'
        """
        DatabaseConnection.execute_query(query, (fecha_fin, fecha_fin, id_usuario), fetch=False)
        return True
