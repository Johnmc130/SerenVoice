# backend/models/audio.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class Audio:
    """Modelo para la tabla Audio"""
    
    @staticmethod
    def create(id_usuario, nombre_archivo, ruta_archivo, duracion=None):
        """Crear registro de audio"""
        query = """
            INSERT INTO audio (id_usuario, nombre_archivo, ruta_archivo, duracion, fecha_grabacion)
            VALUES (%s, %s, %s, %s, %s)
        """
        return DatabaseConnection.execute_query(
            query,
            (id_usuario, nombre_archivo, ruta_archivo, duracion, datetime.now()),
            fetch=False
        )
    
    @staticmethod
    def get_by_id(id_audio):
        """Obtener audio por ID"""
        query = "SELECT * FROM audio WHERE id_audio = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (id_audio,))
        return results[0] if results else None
    
    @staticmethod
    def get_user_audios(id_usuario, limit=20, offset=0):
        """Obtener audios de un usuario"""
        query = """
            SELECT * FROM audio 
            WHERE id_usuario = %s AND activo = 1
            ORDER BY fecha_grabacion DESC
            LIMIT %s OFFSET %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit, offset))
    
    @staticmethod
    def delete(id_audio):
        """Eliminar audio (soft delete)"""
        query = "UPDATE audio SET eliminado = 1, activo = 0 WHERE id_audio = %s"
        DatabaseConnection.execute_query(query, (id_audio,), fetch=False)
        return True