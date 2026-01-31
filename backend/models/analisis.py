# backend/models/analisis.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class Analisis:
    """Modelo para la tabla analisis
    
    Estructura REAL de la tabla en producción (Railway/Cloud):
    - id_analisis (int, PK)
    - id_usuario (int, FK) - SÍ existe en la tabla real
    - id_audio (int, FK)
    - modelo_usado (varchar 50)
    - version_modelo (varchar 20)
    - emocion_detectada (varchar 50)
    - nivel_estres (decimal 5,2)
    - nivel_ansiedad (decimal 5,2)
    - confianza_prediccion (decimal 5,2)
    - fecha_analisis (timestamp)
    - metadata (json)
    - estado_analisis (varchar 20) - NO es ENUM, es varchar
    - confianza (decimal 5,2)
    - notas (text)
    """
    
    @staticmethod
    def create(id_audio, id_usuario=None, modelo_usado='modelo_v1.0', estado='completado',
               nivel_estres=None, nivel_ansiedad=None, emocion_detectada=None, confianza=None):
        """Crear nuevo análisis y devolver su ID
        
        Args:
            id_audio: ID del audio analizado
            id_usuario: ID del usuario (SÍ existe en la tabla real)
            modelo_usado: Nombre/versión del modelo usado
            estado: Estado del análisis (procesando, completado, error)
            nivel_estres: Nivel de estrés detectado
            nivel_ansiedad: Nivel de ansiedad detectado
            emocion_detectada: Emoción dominante detectada
            confianza: Nivel de confianza del modelo
        """
        query = """
            INSERT INTO analisis 
            (id_audio, id_usuario, modelo_usado, fecha_analisis, estado_analisis,
             nivel_estres, nivel_ansiedad, emocion_detectada, confianza)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        res = DatabaseConnection.execute_update(
            query,
            (id_audio, id_usuario, modelo_usado, datetime.now(), estado,
             nivel_estres, nivel_ansiedad, emocion_detectada, confianza)
        )
        return res.get('last_id') if res else None
    
    @staticmethod
    def get_by_id(id_analisis):
        """Obtener análisis por ID"""
        # La tabla real NO tiene columna 'activo'
        query = "SELECT * FROM analisis WHERE id_analisis = %s"
        results = DatabaseConnection.execute_query(query, (id_analisis,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_audio(id_audio):
        """Obtener análisis de un audio"""
        # La tabla real NO tiene columna 'activo'
        query = "SELECT * FROM analisis WHERE id_audio = %s ORDER BY fecha_analisis DESC LIMIT 1"
        results = DatabaseConnection.execute_query(query, (id_audio,))
        return results[0] if results else None
    
    @staticmethod
    def get_complete_analysis(id_analisis):
        """Obtener análisis completo con resultado
        
        NOTA: La vista 'vista_analisis_completos' puede no existir en producción.
        Usar un JOIN directo como fallback.
        """
        try:
            query = "SELECT * FROM vista_analisis_completos WHERE id_analisis = %s"
            results = DatabaseConnection.execute_query(query, (id_analisis,))
            return results[0] if results else None
        except Exception:
            # Fallback: JOIN directo si la vista no existe
            query = """
                SELECT a.*, ra.nivel_estres, ra.nivel_ansiedad, ra.clasificacion,
                       ra.emocion_dominante, ra.confianza_modelo
                FROM analisis a
                LEFT JOIN resultado_analisis ra ON a.id_analisis = ra.id_analisis
                WHERE a.id_analisis = %s
            """
            results = DatabaseConnection.execute_query(query, (id_analisis,))
            return results[0] if results else None
    
    @staticmethod
    def get_all_complete(id_usuario=None, estado=None, limit=50, offset=0):
        """Obtener todos los análisis completos con filtros opcionales"""
        # Usar JOIN directo en lugar de depender de vista
        query = """
            SELECT a.*, ra.nivel_estres, ra.nivel_ansiedad, ra.clasificacion,
                   ra.emocion_dominante, ra.confianza_modelo
            FROM analisis a
            LEFT JOIN resultado_analisis ra ON a.id_analisis = ra.id_analisis
            WHERE 1=1
        """
        params = []
        
        if id_usuario:
            query += " AND a.id_usuario = %s"
            params.append(id_usuario)
        
        if estado:
            query += " AND a.estado_analisis = %s"
            params.append(estado)
        
        query += " ORDER BY a.fecha_analisis DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def update_status(id_analisis, estado):
        """Actualizar estado del análisis"""
        # La tabla real NO tiene columna 'duracion_procesamiento'
        query = "UPDATE analisis SET estado_analisis = %s WHERE id_analisis = %s"
        DatabaseConnection.execute_query(query, (estado, id_analisis), fetch=False)
        return True
    
    @staticmethod
    def delete(id_analisis):
        """Eliminar análisis (hard delete ya que no hay columnas activo/eliminado)"""
        query = "DELETE FROM analisis WHERE id_analisis = %s"
        DatabaseConnection.execute_query(query, (id_analisis,), fetch=False)
        return True