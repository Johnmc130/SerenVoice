# backend/services/analisis_service.py
from backend.models.analisis import Analisis
from backend.models.resultado_analisis import ResultadoAnalisis
from backend.models.recomendacion import Recomendacion
from backend.database.connection import DatabaseConnection

class AnalisisService:
    """Servicio de análisis"""
    
    @staticmethod
    def get_analysis_detail(id_analisis):
        """Obtener detalle completo de un análisis"""
        analisis = Analisis.get_complete_analysis(id_analisis)
        
        if not analisis:
            return None
        
        # Obtener resultado
        resultado = ResultadoAnalisis.get_by_analysis(id_analisis)
        
        # Obtener recomendaciones
        recomendaciones = []
        if resultado:
            recomendaciones = Recomendacion.get_by_result(resultado['id_resultado'])
        
        return {
            'analisis': analisis,
            'resultado': resultado,
            'recomendaciones': recomendaciones
        }
    
    @staticmethod
    def get_user_history(id_usuario, limit=10):
        """Obtener historial de análisis de un usuario"""
        query = """
            SELECT a.id_analisis, a.fecha_analisis, a.estado_analisis,
                   au.nombre_archivo, au.duracion, au.fecha_grabacion,
                   ra.id_resultado, ra.nivel_estres, ra.nivel_ansiedad, 
                   ra.clasificacion, ra.confianza_modelo,
                   ra.nivel_felicidad, ra.nivel_tristeza, ra.nivel_miedo,
                   ra.nivel_neutral, ra.nivel_enojo, ra.nivel_sorpresa,
                   ra.emocion_dominante
            FROM analisis a
            JOIN audio au ON a.id_audio = au.id_audio
            LEFT JOIN resultado_analisis ra ON a.id_analisis = ra.id_analisis
            WHERE au.id_usuario = %s
            ORDER BY au.fecha_grabacion DESC
            LIMIT %s
        """
        
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
