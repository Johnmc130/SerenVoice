# backend/models/resultado_analisis.py
from backend.database.connection import DatabaseConnection

class ResultadoAnalisis:
    """Modelo para la tabla Resultado_analisis"""
    
    @staticmethod
    def create(id_analisis, nivel_estres, nivel_ansiedad, clasificacion, confianza_modelo,
               emocion_dominante=None, nivel_felicidad=None, nivel_tristeza=None,
               nivel_miedo=None, nivel_neutral=None, nivel_enojo=None, nivel_sorpresa=None):
        """Crear resultado de análisis con niveles emocionales.
        
        Args:
            id_analisis: ID del análisis
            nivel_estres: Nivel de estrés (0-100)
            nivel_ansiedad: Nivel de ansiedad (0-100)
            clasificacion: Clasificación del resultado
            confianza_modelo: Confianza del modelo (0-100)
            emocion_dominante: Emoción dominante detectada
            nivel_felicidad: Nivel de felicidad (0-100) - se guarda en emociones_json
            nivel_tristeza: Nivel de tristeza (0-100) - se guarda en emociones_json
            nivel_miedo: Nivel de miedo (0-100) - se guarda en emociones_json
            nivel_neutral: Nivel neutral (0-100) - se guarda en emociones_json
            nivel_enojo: Nivel de enojo (0-100) - se guarda en emociones_json
            nivel_sorpresa: Nivel de sorpresa (0-100) - se guarda en emociones_json
        
        Returns:
            int: ID del resultado creado
        """
        # Preparar JSON con todas las emociones
        import json
        emociones = {
            'felicidad': nivel_felicidad,
            'tristeza': nivel_tristeza,
            'miedo': nivel_miedo,
            'neutral': nivel_neutral,
            'enojo': nivel_enojo,
            'sorpresa': nivel_sorpresa
        }
        emociones_json = json.dumps(emociones)
        
        query = """
            INSERT INTO resultado_analisis 
            (id_analisis, nivel_estres, nivel_ansiedad, clasificacion, confianza,
             emocion_dominante, emociones_json)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        res = DatabaseConnection.execute_update(
            query,
            (id_analisis, nivel_estres, nivel_ansiedad, clasificacion, confianza_modelo,
             emocion_dominante, emociones_json)
        )
        return res.get('last_id')
    
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