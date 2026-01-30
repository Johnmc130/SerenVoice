# backend/services/resultados_service.py
from backend.models.resultado_analisis import ResultadoAnalisis
from backend.models.analisis import Analisis
from backend.models.audio import Audio
from backend.database.connection import DatabaseConnection

class ResultadosService:
    """Servicio de gestión de resultados de análisis"""
    
    @staticmethod
    def get_resultado_by_id(id_resultado):
        """Obtener resultado por ID"""
        return ResultadoAnalisis.get_by_id(id_resultado)
    
    @staticmethod
    def get_resultado_by_analisis(id_analisis):
        """Obtener resultado de un análisis específico"""
        return ResultadoAnalisis.get_by_analysis(id_analisis)
    
    @staticmethod
    def get_user_resultados(id_usuario, limit=20):
        """
        Obtener todos los resultados de un usuario
        
        Args:
            id_usuario: ID del usuario
            limit: Número máximo de resultados
        
        Returns:
            list: Lista de resultados del usuario
        """
        query = """
            SELECT ra.*, a.fecha_analisis, au.nombre_archivo
            FROM resultado_analisis ra
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s
            ORDER BY a.fecha_analisis DESC
            LIMIT %s
        """
        
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def get_resultados_by_clasificacion(id_usuario, clasificacion):
        """
        Obtener resultados filtrados por clasificación
        
        Args:
            id_usuario: ID del usuario
            clasificacion: Clasificación (normal, leve, moderado, alto, muy_alto)
        
        Returns:
            list: Resultados con la clasificación especificada
        """
        query = """
            SELECT ra.*, a.fecha_analisis, au.nombre_archivo
            FROM resultado_analisis ra
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s AND ra.clasificacion = %s
            ORDER BY a.fecha_analisis DESC
        """
        
        return DatabaseConnection.execute_query(query, (id_usuario, clasificacion))
    
    @staticmethod
    def get_estadisticas_usuario(id_usuario):
        """
        Obtener estadísticas generales de resultados del usuario
        
        Args:
            id_usuario: ID del usuario
        
        Returns:
            dict: Estadísticas de los resultados
        """
        import numpy as np
        
        query = """
            SELECT ra.nivel_estres, ra.nivel_ansiedad, ra.clasificacion
            FROM resultado_analisis ra
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s
        """
        
        resultados = DatabaseConnection.execute_query(query, (id_usuario,))
        
        if not resultados:
            return {
                'total': 0,
                'promedio_estres': 0,
                'promedio_ansiedad': 0,
                'max_estres': 0,
                'max_ansiedad': 0,
                'min_estres': 0,
                'min_ansiedad': 0,
                'distribucion_clasificacion': {}
            }
        
        scores_estres = [float(r['nivel_estres']) for r in resultados]
        scores_ansiedad = [float(r['nivel_ansiedad']) for r in resultados]
        
        # Contar clasificaciones
        clasificaciones = {}
        for r in resultados:
            clas = r['clasificacion']
            clasificaciones[clas] = clasificaciones.get(clas, 0) + 1
        
        estadisticas = {
            'total': len(resultados),
            'promedio_estres': round(np.mean(scores_estres), 2),
            'promedio_ansiedad': round(np.mean(scores_ansiedad), 2),
            'max_estres': round(np.max(scores_estres), 2),
            'max_ansiedad': round(np.max(scores_ansiedad), 2),
            'min_estres': round(np.min(scores_estres), 2),
            'min_ansiedad': round(np.min(scores_ansiedad), 2),
            'distribucion_clasificacion': clasificaciones
        }
        
        return estadisticas
    
    @staticmethod
    def get_tendencia_mensual(id_usuario, meses=6):
        """
        Obtener tendencia de resultados por mes
        
        Args:
            id_usuario: ID del usuario
            meses: Número de meses hacia atrás
        
        Returns:
            list: Promedios mensuales
        """
        query = """
            SELECT 
                DATE_FORMAT(a.fecha_analisis, '%Y-%m') as mes,
                AVG(ra.nivel_estres) as promedio_estres,
                AVG(ra.nivel_ansiedad) as promedio_ansiedad,
                COUNT(*) as total_analisis
            FROM resultado_analisis ra
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s
            AND a.fecha_analisis >= DATE_SUB(CURDATE(), INTERVAL %s MONTH)
            GROUP BY DATE_FORMAT(a.fecha_analisis, '%Y-%m')
            ORDER BY mes DESC
        """
        
        return DatabaseConnection.execute_query(query, (id_usuario, meses))
    
    @staticmethod
    def get_ultimos_resultados(id_usuario, cantidad=5):
        """
        Obtener los últimos N resultados del usuario
        
        Args:
            id_usuario: ID del usuario
            cantidad: Cantidad de resultados a retornar
        
        Returns:
            list: Últimos resultados
        """
        query = """
            SELECT ra.*, a.fecha_analisis, au.nombre_archivo
            FROM resultado_analisis ra
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s
            ORDER BY a.fecha_analisis DESC
            LIMIT %s
        """
        
        return DatabaseConnection.execute_query(query, (id_usuario, cantidad))
    
    @staticmethod
    def comparar_resultados(id_resultado1, id_resultado2):
        """
        Comparar dos resultados
        
        Args:
            id_resultado1: ID del primer resultado
            id_resultado2: ID del segundo resultado
        
        Returns:
            dict: Comparación de resultados
        """
        resultado1 = ResultadoAnalisis.get_by_id(id_resultado1)
        resultado2 = ResultadoAnalisis.get_by_id(id_resultado2)
        
        if not resultado1 or not resultado2:
            return None
        
        comparacion = {
            'resultado1': resultado1,
            'resultado2': resultado2,
            'diferencias': {
                'estres': float(resultado2['nivel_estres']) - float(resultado1['nivel_estres']),
                'ansiedad': float(resultado2['nivel_ansiedad']) - float(resultado1['nivel_ansiedad'])
            },
            'mejora': {
                'estres': float(resultado2['nivel_estres']) < float(resultado1['nivel_estres']),
                'ansiedad': float(resultado2['nivel_ansiedad']) < float(resultado1['nivel_ansiedad'])
            }
        }
        
        return comparacion