# backend/models/audio.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class Audio:
    """Modelo para la tabla audio
    
    Estructura ACTUALIZADA después de migración (Railway/Cloud - Enero 2026):
    - id_audio (int, PK)
    - id_usuario (int, FK)
    - nombre_archivo (varchar 255)
    - ruta_archivo (varchar 255)
    - duracion (int)
    - tamano_archivo (float) - calculado de tamano_bytes
    - fecha_grabacion (timestamp)
    - nivel_estres (float) ✅ NUEVO
    - nivel_ansiedad (float) ✅ NUEVO
    - nivel_felicidad (float) ✅ NUEVO
    - nivel_tristeza (float) ✅ NUEVO
    - nivel_miedo (float) ✅ NUEVO
    - nivel_neutral (float) ✅ NUEVO
    - nivel_enojo (float) ✅ NUEVO
    - nivel_sorpresa (float) ✅ NUEVO
    - procesado_por_ia (tinyint) ✅ NUEVO
    - eliminado (tinyint) ✅ NUEVO
    - activo (tinyint) ✅ NUEVO
    
    NOTA: Ahora las emociones SÍ se pueden guardar directamente en audio.
    """
    
    @staticmethod
    def create(id_usuario, nombre_archivo, ruta_archivo, duracion=None,
               nivel_estres=None, nivel_ansiedad=None, nivel_felicidad=None,
               nivel_tristeza=None, nivel_miedo=None, nivel_neutral=None,
               nivel_enojo=None, nivel_sorpresa=None, procesado_por_ia=False):
        """Crear registro de audio con emociones opcionales
        
        Args:
            id_usuario: ID del usuario
            nombre_archivo: Nombre del archivo
            ruta_archivo: Ruta del archivo
            duracion: Duración en segundos (float o int)
            nivel_estres: Nivel de estrés (0-100)
            nivel_ansiedad: Nivel de ansiedad (0-100)
            nivel_felicidad: Nivel de felicidad (0-100)
            nivel_tristeza: Nivel de tristeza (0-100)
            nivel_miedo: Nivel de miedo (0-100)
            nivel_neutral: Nivel neutral (0-100)
            nivel_enojo: Nivel de enojo (0-100)
            nivel_sorpresa: Nivel de sorpresa (0-100)
            procesado_por_ia: Si fue procesado por IA (boolean)
        """
        # Convertir duración a int para compatibilidad con la BD
        duracion_int = int(duracion) if duracion else 0
        
        query = """
            INSERT INTO audio (
                id_usuario, nombre_archivo, ruta_archivo, duracion, duracion_segundos, 
                fecha_grabacion, procesado, nivel_estres, nivel_ansiedad, nivel_felicidad,
                nivel_tristeza, nivel_miedo, nivel_neutral, nivel_enojo, nivel_sorpresa,
                procesado_por_ia, activo, eliminado
            )
            VALUES (%s, %s, %s, %s, %s, %s, 0, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1, 0)
        """
        res = DatabaseConnection.execute_update(
            query,
            (id_usuario, nombre_archivo, ruta_archivo, duracion_int, duracion_int, 
             datetime.now(), nivel_estres, nivel_ansiedad, nivel_felicidad,
             nivel_tristeza, nivel_miedo, nivel_neutral, nivel_enojo, nivel_sorpresa,
             1 if procesado_por_ia else 0)
        )
        return res.get('last_id') if res else None
    
    @staticmethod
    def get_by_id(id_audio):
        """Obtener audio por ID con todas sus columnas incluyendo emociones"""
        query = "SELECT * FROM audio WHERE id_audio = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (id_audio,))
        return results[0] if results else None
    
    @staticmethod
    def get_user_audios(id_usuario, limit=20, offset=0):
        """Obtener audios de un usuario (solo activos)"""
        query = """
            SELECT * FROM audio 
            WHERE id_usuario = %s AND activo = 1 AND eliminado = 0
            ORDER BY fecha_grabacion DESC
            LIMIT %s OFFSET %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit, offset))
    
    @staticmethod
    def update_emotions(id_audio, nivel_estres=None, nivel_ansiedad=None, nivel_felicidad=None,
                       nivel_tristeza=None, nivel_miedo=None, nivel_neutral=None,
                       nivel_enojo=None, nivel_sorpresa=None):
        """Actualizar las emociones de un audio existente
        
        Útil cuando se analiza un audio previamente subido
        """
        query = """
            UPDATE audio SET
                nivel_estres = %s,
                nivel_ansiedad = %s,
                nivel_felicidad = %s,
                nivel_tristeza = %s,
                nivel_miedo = %s,
                nivel_neutral = %s,
                nivel_enojo = %s,
                nivel_sorpresa = %s,
                procesado_por_ia = 1
            WHERE id_audio = %s
        """
        DatabaseConnection.execute_query(
            query,
            (nivel_estres, nivel_ansiedad, nivel_felicidad, nivel_tristeza,
             nivel_miedo, nivel_neutral, nivel_enojo, nivel_sorpresa, id_audio),
            fetch=False
        )
        return True
    
    @staticmethod
    def soft_delete(id_audio):
        """Eliminar audio (soft delete usando columna 'eliminado')"""
        query = "UPDATE audio SET eliminado = 1, activo = 0 WHERE id_audio = %s"
        DatabaseConnection.execute_query(query, (id_audio,), fetch=False)
        return True
    
    @staticmethod
    def delete(id_audio):
        """Eliminar audio permanentemente (hard delete) - usar con precaución"""
        query = "DELETE FROM audio WHERE id_audio = %s"
        DatabaseConnection.execute_query(query, (id_audio,), fetch=False)
        return True
    
    @staticmethod
    def mark_processed(id_audio):
        """Marcar audio como procesado"""
        query = "UPDATE audio SET procesado = 1, procesado_por_ia = 1 WHERE id_audio = %s"
        DatabaseConnection.execute_query(query, (id_audio,), fetch=False)
        return True
