# backend/services/recomendaciones_service.py
from backend.models.recomendacion import Recomendacion
from backend.models.resultado_analisis import ResultadoAnalisis
from backend.models.analisis import Analisis
from backend.models.audio import Audio

class RecomendacionesService:
    """Servicio de gestión de recomendaciones"""
    
    @staticmethod
    def get_recomendacion_by_id(id_recomendacion):
        """Obtener recomendación por ID"""
        return Recomendacion.get_by_id(id_recomendacion)
    
    @staticmethod
    def get_recomendaciones_by_resultado(id_resultado):
        """Obtener recomendaciones de un resultado específico"""
        return Recomendacion.get_by_result(id_resultado)
    
    @staticmethod
    def get_user_recomendaciones(id_usuario, limit=20):
        """
        Obtener todas las recomendaciones de un usuario
        
        Args:
            id_usuario: ID del usuario
            limit: Número máximo de recomendaciones
        
        Returns:
            list: Lista de recomendaciones del usuario
        """
        from database.connection import DatabaseConnection
        
        query = """
            SELECT r.*, ra.nivel_estres, ra.nivel_ansiedad, a.fecha_analisis
            FROM recomendaciones r
            JOIN resultado_analisis ra ON r.id_resultado = ra.id_resultado
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s
            ORDER BY r.fecha_generacion DESC
            LIMIT %s
        """
        
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def get_recomendaciones_by_tipo(id_usuario, tipo):
        """
        Obtener recomendaciones filtradas por tipo
        
        Args:
            id_usuario: ID del usuario
            tipo: Tipo de recomendación (respiracion, ejercicio, meditacion, profesional, otros)
        
        Returns:
            list: Recomendaciones del tipo especificado
        """
        from database.connection import DatabaseConnection
        
        query = """
            SELECT r.*, ra.nivel_estres, ra.nivel_ansiedad
            FROM recomendaciones r
            JOIN resultado_analisis ra ON r.id_resultado = ra.id_resultado
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s AND r.tipo_recomendacion = %s
            ORDER BY r.fecha_generacion DESC
        """
        
        return DatabaseConnection.execute_query(query, (id_usuario, tipo))
    
    @staticmethod
    def create_recomendacion(id_resultado, tipo, contenido):
        """
        Crear una nueva recomendación
        
        Args:
            id_resultado: ID del resultado
            tipo: Tipo de recomendación
            contenido: Contenido de la recomendación
        
        Returns:
            int: ID de la recomendación creada
        """
        return Recomendacion.create(id_resultado, tipo, contenido)
    
    @staticmethod
    def create_multiple_recomendaciones(recomendaciones):
        """
        Crear múltiples recomendaciones
        
        Args:
            recomendaciones: Lista de diccionarios con los datos de las recomendaciones
        
        Returns:
            int: Número de recomendaciones creadas
        """
        return Recomendacion.create_multiple(recomendaciones)
    
    @staticmethod
    def get_recomendaciones_recientes(id_usuario, dias=7):
        """
        Obtener recomendaciones recientes de los últimos N días
        
        Args:
            id_usuario: ID del usuario
            dias: Número de días hacia atrás
        
        Returns:
            list: Recomendaciones recientes
        """
        from database.connection import DatabaseConnection
        
        query = """
            SELECT r.*, ra.nivel_estres, ra.nivel_ansiedad, a.fecha_analisis
            FROM recomendaciones r
            JOIN resultado_analisis ra ON r.id_resultado = ra.id_resultado
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s 
            AND r.fecha_generacion >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
            ORDER BY r.fecha_generacion DESC
        """
        
        return DatabaseConnection.execute_query(query, (id_usuario, dias))
    
    @staticmethod
    def get_estadisticas_recomendaciones(id_usuario):
        """
        Obtener estadísticas de recomendaciones por tipo
        
        Args:
            id_usuario: ID del usuario
        
        Returns:
            dict: Estadísticas de recomendaciones
        """
        from database.connection import DatabaseConnection
        
        query = """
            SELECT 
                r.tipo_recomendacion,
                COUNT(*) as total,
                COUNT(CASE WHEN ra.nivel_estres >= 70 THEN 1 END) as estres_alto,
                COUNT(CASE WHEN ra.nivel_ansiedad >= 70 THEN 1 END) as ansiedad_alta
            FROM recomendaciones r
            JOIN resultado_analisis ra ON r.id_resultado = ra.id_resultado
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s
            GROUP BY r.tipo_recomendacion
        """
        
        results = DatabaseConnection.execute_query(query, (id_usuario,))
        
        estadisticas = {
            'por_tipo': results,
            'total_recomendaciones': sum(r['total'] for r in results) if results else 0
        }
        
        return estadisticas