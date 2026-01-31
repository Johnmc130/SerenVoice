# backend/models/audio.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class Audio:
    """Modelo para la tabla audio
    
    Estructura REAL de la tabla en producción (Railway/Cloud):
    - id_audio (int, PK)
    - id_usuario (int, FK)
    - ruta_archivo (varchar 255)
    - duracion_segundos (int) - NO duracion
    - formato (varchar 10)
    - fecha_subida (timestamp)
    - nombre_archivo (varchar 255)
    - duracion (int) - adicional
    - fecha_grabacion (timestamp)
    - tamano_bytes (int) - NO tamano_archivo
    - procesado (tinyint) - NO procesado_por_ia
    
    NOTA: Esta tabla NO tiene columnas de emociones. Las emociones se guardan
    en resultado_analisis.
    """
    
    @staticmethod
    def create(id_usuario, nombre_archivo, ruta_archivo, duracion=None):
        """Crear registro de audio
        
        Args:
            id_usuario: ID del usuario
            nombre_archivo: Nombre del archivo
            ruta_archivo: Ruta del archivo
            duracion: Duración en segundos (float o int)
        """
        # Convertir duración a int para compatibilidad con la BD
        duracion_int = int(duracion) if duracion else 0
        
        query = """
            INSERT INTO audio (id_usuario, nombre_archivo, ruta_archivo, duracion, duracion_segundos, fecha_grabacion, procesado)
            VALUES (%s, %s, %s, %s, %s, %s, 0)
        """
        res = DatabaseConnection.execute_update(
            query,
            (id_usuario, nombre_archivo, ruta_archivo, duracion_int, duracion_int, datetime.now())
        )
        return res.get('last_id') if res else None
    
    @staticmethod
    def get_by_id(id_audio):
        """Obtener audio por ID"""
        query = "SELECT * FROM audio WHERE id_audio = %s"
        results = DatabaseConnection.execute_query(query, (id_audio,))
        return results[0] if results else None
    
    @staticmethod
    def get_user_audios(id_usuario, limit=20, offset=0):
        """Obtener audios de un usuario"""
        query = """
            SELECT * FROM audio 
            WHERE id_usuario = %s
            ORDER BY fecha_grabacion DESC
            LIMIT %s OFFSET %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit, offset))
    
    @staticmethod
    def delete(id_audio):
        """Eliminar audio (hard delete ya que no hay columna 'activo')"""
        query = "DELETE FROM audio WHERE id_audio = %s"
        DatabaseConnection.execute_query(query, (id_audio,), fetch=False)
        return True
    
    @staticmethod
    def mark_processed(id_audio):
        """Marcar audio como procesado"""
        query = "UPDATE audio SET procesado = 1 WHERE id_audio = %s"
        DatabaseConnection.execute_query(query, (id_audio,), fetch=False)
        return True