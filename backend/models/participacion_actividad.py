# backend/models/participacion_actividad.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class ParticipacionActividad:
    """Modelo para la tabla participacion_actividad"""
    
    @staticmethod
    def create(id_actividad, id_usuario, estado_emocional_antes=None, notas_participante=None):
        """Registrar participación en una actividad"""
        query = """
            INSERT INTO participacion_actividad 
            (id_actividad, id_usuario, estado_emocional_antes, notas_participante)
            VALUES (%s, %s, %s, %s)
        """
        return DatabaseConnection.execute_query(
            query, 
            (id_actividad, id_usuario, estado_emocional_antes, notas_participante),
            fetch=False
        )
    
    @staticmethod
    def get_by_id(id_participacion):
        """Obtener participación por ID"""
        query = """
            SELECT pa.*, u.nombre, u.apellido, u.correo,
                   ag.titulo as actividad_titulo
            FROM participacion_actividad pa
            JOIN usuario u ON pa.id_usuario = u.id_usuario
            JOIN actividades_grupo ag ON pa.id_actividad = ag.id_actividad
            WHERE pa.id = %s
        """
        results = DatabaseConnection.execute_query(query, (id_participacion,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_actividad(id_actividad):
        """Obtener todas las participaciones de una actividad"""
        query = """
            SELECT pa.*, u.nombre, u.apellido, u.correo, u.foto_perfil
            FROM participacion_actividad pa
            JOIN usuario u ON pa.id_usuario = u.id_usuario
            WHERE pa.id_actividad = %s
            ORDER BY pa.fecha_completada DESC, pa.id DESC
        """
        return DatabaseConnection.execute_query(query, (id_actividad,))
    
    @staticmethod
    def get_by_usuario(id_usuario, completada=None):
        """Obtener participaciones de un usuario"""
        query = """
            SELECT pa.*, ag.titulo, ag.descripcion, ag.tipo_actividad,
                   ag.fecha_programada, g.nombre_grupo
            FROM participacion_actividad pa
            JOIN actividades_grupo ag ON pa.id_actividad = ag.id_actividad
            JOIN grupos g ON ag.id_grupo = g.id_grupo
            WHERE pa.id_usuario = %s
        """
        params = [id_usuario]
        
        if completada is not None:
            query += " AND pa.completada = %s"
            params.append(completada)
        
        query += " ORDER BY ag.fecha_programada DESC"
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def check_participation(id_actividad, id_usuario):
        """Verificar si un usuario ya participa en una actividad"""
        query = """
            SELECT * FROM participacion_actividad 
            WHERE id_actividad = %s AND id_usuario = %s
        """
        results = DatabaseConnection.execute_query(query, (id_actividad, id_usuario))
        return results[0] if results else None
    
    @staticmethod
    def complete(id_participacion, estado_emocional_despues=None, notas_finales=None):
        """Marcar participación como completada"""
        query = """
            UPDATE participacion_actividad 
            SET completada = 1,
                fecha_completada = NOW(),
                estado_emocional_despues = %s,
                notas_participante = COALESCE(%s, notas_participante)
            WHERE id = %s
        """
        DatabaseConnection.execute_query(
            query, 
            (estado_emocional_despues, notas_finales, id_participacion),
            fetch=False
        )
        return True
    
    @staticmethod
    def update_notas(id_participacion, notas):
        """Actualizar notas de participación"""
        query = "UPDATE participacion_actividad SET notas_participante = %s WHERE id = %s"
        DatabaseConnection.execute_query(query, (notas, id_participacion), fetch=False)
        return True
    
    @staticmethod
    def get_statistics(id_actividad):
        """Obtener estadísticas de participación de una actividad"""
        query = """
            SELECT 
                COUNT(*) as total_participantes,
                SUM(completada) as participantes_completados,
                COUNT(DISTINCT estado_emocional_antes) as estados_antes_unicos,
                COUNT(DISTINCT estado_emocional_despues) as estados_despues_unicos
            FROM participacion_actividad
            WHERE id_actividad = %s
        """
        results = DatabaseConnection.execute_query(query, (id_actividad,))
        return results[0] if results else None
    
    @staticmethod
    def get_user_progress(id_usuario, id_grupo):
        """Obtener progreso de un usuario en un grupo específico"""
        query = """
            SELECT 
                COUNT(DISTINCT pa.id_actividad) as actividades_inscritas,
                SUM(pa.completada) as actividades_completadas,
                ROUND(SUM(pa.completada) * 100.0 / COUNT(DISTINCT pa.id_actividad), 2) as porcentaje_completado
            FROM participacion_actividad pa
            JOIN actividades_grupo ag ON pa.id_actividad = ag.id_actividad
            WHERE pa.id_usuario = %s AND ag.id_grupo = %s
        """
        results = DatabaseConnection.execute_query(query, (id_usuario, id_grupo))
        return results[0] if results else None
