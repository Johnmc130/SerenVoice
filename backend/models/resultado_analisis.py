# backend/models/resultado_analisis.py
from backend.database.connection import DatabaseConnection
import json

class ResultadoAnalisis:
    """Modelo para la tabla resultado_analisis
    
    Estructura REAL de la tabla en producción (Railway/Cloud):
    - id_resultado (int, PK)
    - id_analisis (int, FK)
    - emociones_json (json)
    - metricas_adicionales (json)
    - fecha_generacion (timestamp)
    - nivel_estres (decimal 5,2)
    - nivel_ansiedad (decimal 5,2)
    - clasificacion (varchar 50) - NO es ENUM
    - confianza_modelo (decimal 5,2)
    - nivel_felicidad (decimal 5,2)
    - nivel_tristeza (decimal 5,2)
    - nivel_miedo (decimal 5,2)
    - nivel_neutral (decimal 5,2)
    - nivel_enojo (decimal 5,2)
    - nivel_sorpresa (decimal 5,2)
    - emocion_dominante (varchar 50)
    - confianza (decimal 5,2) - duplicado de confianza_modelo
    """
    
    @staticmethod
    def create(id_analisis, nivel_estres, nivel_ansiedad, clasificacion, confianza_modelo,
               emocion_dominante=None, nivel_felicidad=None, nivel_tristeza=None,
               nivel_miedo=None, nivel_neutral=None, nivel_enojo=None, nivel_sorpresa=None):
        """Crear resultado de análisis con niveles emocionales.
        
        Args:
            id_analisis: ID del análisis
            nivel_estres: Nivel de estrés (0-100)
            nivel_ansiedad: Nivel de ansiedad (0-100)
            clasificacion: Clasificación del resultado (normal, leve, moderado, alto, muy_alto)
            confianza_modelo: Confianza del modelo (0-100)
            emocion_dominante: Emoción dominante detectada
            nivel_felicidad: Nivel de felicidad (0-100)
            nivel_tristeza: Nivel de tristeza (0-100)
            nivel_miedo: Nivel de miedo (0-100)
            nivel_neutral: Nivel neutral (0-100)
            nivel_enojo: Nivel de enojo (0-100)
            nivel_sorpresa: Nivel de sorpresa (0-100)
        
        Returns:
            int: ID del resultado creado
        """
        # Crear JSON de emociones para el campo emociones_json
        emociones_dict = {
            'felicidad': nivel_felicidad or 0,
            'tristeza': nivel_tristeza or 0,
            'miedo': nivel_miedo or 0,
            'neutral': nivel_neutral or 0,
            'enojo': nivel_enojo or 0,
            'sorpresa': nivel_sorpresa or 0,
            'estres': nivel_estres or 0,
            'ansiedad': nivel_ansiedad or 0
        }
        emociones_json = json.dumps(emociones_dict)
        
        # Usar las columnas reales de la tabla en producción
        query = """
            INSERT INTO resultado_analisis 
            (id_analisis, nivel_estres, nivel_ansiedad, clasificacion, confianza_modelo,
             emocion_dominante, nivel_felicidad, nivel_tristeza, nivel_miedo,
             nivel_neutral, nivel_enojo, nivel_sorpresa, emociones_json, confianza)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        res = DatabaseConnection.execute_update(
            query,
            (id_analisis, nivel_estres, nivel_ansiedad, clasificacion, confianza_modelo,
             emocion_dominante, nivel_felicidad, nivel_tristeza, nivel_miedo,
             nivel_neutral, nivel_enojo, nivel_sorpresa, emociones_json, confianza_modelo)
        )
        return res.get('last_id') if res else None
    
    @staticmethod
    def get_by_id(id_resultado):
        """Obtener resultado por ID"""
        query = "SELECT * FROM resultado_analisis WHERE id_resultado = %s"
        results = DatabaseConnection.execute_query(query, (id_resultado,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_analysis(id_analisis):
        """Obtener resultado de un análisis"""
        query = "SELECT * FROM resultado_analisis WHERE id_analisis = %s"
        results = DatabaseConnection.execute_query(query, (id_analisis,))
        return results[0] if results else None