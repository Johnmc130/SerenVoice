# backend/services/reportes_service.py
from backend.models.reporte import Reporte
from backend.models.reporte_resultado import ReporteResultado
from backend.database.connection import DatabaseConnection
from datetime import datetime, date
import numpy as np

class ReportesService:
    """Servicio de reportes"""
    
    @staticmethod
    def generate_report(id_usuario, fecha_inicio, fecha_fin, formato='pdf'):
        """
        Generar reporte
        
        Args:
            id_usuario: ID del usuario
            fecha_inicio: Fecha de inicio
            fecha_fin: Fecha de fin
            formato: Formato del reporte (pdf, excel)
        
        Returns:
            dict: Información del reporte generado
        """
        # Obtener análisis del período
        query = """
            SELECT ra.id_resultado, ra.nivel_estres, ra.nivel_ansiedad, 
                   a.fecha_analisis, au.nombre_archivo
            FROM resultado_analisis ra
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s
            AND a.fecha_analisis BETWEEN %s AND %s
            ORDER BY a.fecha_analisis
        """
        
        resultados = DatabaseConnection.execute_query(
            query, 
            (id_usuario, fecha_inicio, fecha_fin)
        )
        
        if not resultados:
            return {'success': False, 'error': 'No hay datos para el período seleccionado'}
        
        # Calcular estadísticas
        scores_estres = [float(r['nivel_estres']) for r in resultados]
        scores_ansiedad = [float(r['nivel_ansiedad']) for r in resultados]
        
        estadisticas = {
            'total_analisis': len(resultados),
            'promedio_estres': round(np.mean(scores_estres), 2),
            'promedio_ansiedad': round(np.mean(scores_ansiedad), 2),
            'max_estres': round(np.max(scores_estres), 2),
            'max_ansiedad': round(np.max(scores_ansiedad), 2),
            'min_estres': round(np.min(scores_estres), 2),
            'min_ansiedad': round(np.min(scores_ansiedad), 2)
        }
        
        # Crear reporte
        titulo = f'Reporte de Bienestar ({fecha_inicio} a {fecha_fin})'
        descripcion = f'Análisis de {len(resultados)} sesiones de voz'
        
        id_reporte = Reporte.create(
            id_usuario=id_usuario,
            titulo=titulo,
            descripcion=descripcion,
            formato=formato
        )
        
        # Vincular resultados
        resultado_ids = [r['id_resultado'] for r in resultados]
        ReporteResultado.add_multiple_results(id_reporte, resultado_ids)
        
        return {
            'success': True,
            'id_reporte': id_reporte,
            'estadisticas': estadisticas,
            'total_analisis': len(resultados)
        }
    
    @staticmethod
    def get_user_reports(id_usuario):
        """Obtener reportes de un usuario"""
        return Reporte.get_user_reports(id_usuario)
    
    @staticmethod
    def get_report_by_id(id_reporte):
        """Obtener reporte por ID"""
        return Reporte.get_by_id(id_reporte)
    
    @staticmethod
    def get_report_with_results(id_reporte):
        """Obtener reporte con sus resultados"""
        reporte = Reporte.get_by_id(id_reporte)
        if not reporte:
            return None
        
        resultados = ReporteResultado.get_report_results(id_reporte)
        
        return {
            'reporte': reporte,
            'resultados': resultados
        }
