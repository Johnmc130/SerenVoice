# backend/models/analisis.py
from backend.database.connection import DatabaseConnection
from datetime import date

class Analisis:
    """Modelo para la tabla analisis"""
    
    @staticmethod
    def create(id_audio, modelo_usado='modelo_v1.0', estado='procesando'):
        """Crear nuevo análisis y devolver su ID"""
        query = """
            INSERT INTO analisis (id_audio, modelo_usado, fecha_analisis, estado_analisis)
            VALUES (%s, %s, %s, %s)
        """
        res = DatabaseConnection.execute_update(
            query,
            (id_audio, modelo_usado, date.today(), estado)
        )
        return res.get('last_id')
    
    @staticmethod
    def get_by_id(id_analisis):
        """Obtener análisis por ID"""
        query = "SELECT * FROM analisis WHERE id_analisis = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (id_analisis,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_audio(id_audio):
        """Obtener análisis de un audio"""
        query = "SELECT * FROM analisis WHERE id_audio = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (id_audio,))
        return results[0] if results else None
    
    @staticmethod
    def get_complete_analysis(id_analisis):
        """Obtener análisis completo con todos los detalles usando vista optimizada"""
        query = "SELECT * FROM vista_analisis_completos WHERE id_analisis = %s"
        results = DatabaseConnection.execute_query(query, (id_analisis,))
        return results[0] if results else None
    
    @staticmethod
    def get_all_complete(id_usuario=None, estado=None, limit=50, offset=0):
        """Obtener todos los análisis completos con filtros opcionales"""
        query = "SELECT * FROM vista_analisis_completos WHERE 1=1"
        params = []
        
        if id_usuario:
            query += " AND correo = (SELECT correo FROM usuario WHERE id_usuario = %s)"
            params.append(id_usuario)
        
        if estado:
            query += " AND estado_analisis = %s"
            params.append(estado)
        
        query += " ORDER BY fecha_analisis DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def update_status(id_analisis, estado, duracion_procesamiento=None):
        """Actualizar estado del análisis"""
        if duracion_procesamiento:
            query = """
                UPDATE analisis 
                SET estado_analisis = %s, duracion_procesamiento = %s 
                WHERE id_analisis = %s
            """
            DatabaseConnection.execute_query(query, (estado, duracion_procesamiento, id_analisis), fetch=False)
        else:
            query = "UPDATE analisis SET estado_analisis = %s WHERE id_analisis = %s"
            DatabaseConnection.execute_query(query, (estado, id_analisis), fetch=False)
        return True
    
    @staticmethod
    def delete(id_analisis):
        """Eliminar análisis (soft delete)"""
        query = "UPDATE analisis SET eliminado = 1, activo = 0 WHERE id_analisis = %s"
        DatabaseConnection.execute_query(query, (id_analisis,), fetch=False)
        return True