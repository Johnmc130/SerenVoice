"""
Modelo: AnalisisVozParticipante
Descripción: Almacena los análisis de voz individual de cada participante en actividades grupales
"""

from backend.database.connection import DatabaseConnection


class AnalisisVozParticipante:
    """Gestión de análisis de voz individuales"""

    @staticmethod
    def crear(actividad_id, usuario_id, ruta_archivo, emocion, emocion_confianza,
              energia_voz, frecuencia_promedio, duracion_segundos, estres_nivel, 
              ansiedad_nivel, bienestar_nivel, observaciones=""):
        """Guardar análisis de voz de un participante"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()

            query = """
            INSERT INTO analisis_voz_participante 
            (actividad_id, usuario_id, ruta_archivo_audio, emocion, emocion_confianza,
             energia_voz, frecuencia_promedio, duracion_segundos, estres_nivel,
             ansiedad_nivel, bienestar_nivel, observaciones)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            cursor.execute(query, (
                actividad_id, usuario_id, ruta_archivo, emocion, emocion_confianza,
                energia_voz, frecuencia_promedio, duracion_segundos, estres_nivel,
                ansiedad_nivel, bienestar_nivel, observaciones
            ))

            analisis_id = cursor.lastrowid
            cursor.close()
            conn.close()

            return analisis_id

        except Exception as e:
            print(f"[DB] Error guardando análisis: {e}")
            raise

    @staticmethod
    def obtener_por_actividad(actividad_id):
        """Obtener todos los análisis de una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
            SELECT a.*, u.nombre as usuario_nombre, u.email
            FROM analisis_voz_participante a
            JOIN usuario u ON a.usuario_id = u.id
            WHERE a.actividad_id = %s
            ORDER BY a.fecha_analisis DESC
            """

            cursor.execute(query, (actividad_id,))
            analisis = cursor.fetchall()
            cursor.close()
            conn.close()

            return analisis

        except Exception as e:
            print(f"[DB] Error obteniendo análisis: {e}")
            return []

    @staticmethod
    def obtener_por_usuario_actividad(actividad_id, usuario_id):
        """Obtener análisis específico de un usuario en una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
            SELECT * FROM analisis_voz_participante
            WHERE actividad_id = %s AND usuario_id = %s
            """

            cursor.execute(query, (actividad_id, usuario_id))
            analisis = cursor.fetchone()
            cursor.close()
            conn.close()

            return analisis

        except Exception as e:
            print(f"[DB] Error obteniendo análisis: {e}")
            return None

    @staticmethod
    def calcular_promedios(actividad_id):
        """Calcular promedios de emociones y métricas para una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
            SELECT 
                emocion,
                COUNT(*) as cantidad,
                AVG(CAST(emocion_confianza AS DECIMAL(10,2))) as confianza_promedio,
                AVG(CAST(energia_voz AS DECIMAL(10,2))) as energia_promedio,
                AVG(CAST(frecuencia_promedio AS DECIMAL(10,2))) as frecuencia_promedio,
                AVG(CAST(estres_nivel AS DECIMAL(10,2))) as estres_promedio,
                AVG(CAST(ansiedad_nivel AS DECIMAL(10,2))) as ansiedad_promedio,
                AVG(CAST(bienestar_nivel AS DECIMAL(10,2))) as bienestar_promedio
            FROM analisis_voz_participante
            WHERE actividad_id = %s
            GROUP BY emocion
            ORDER BY cantidad DESC
            """

            cursor.execute(query, (actividad_id,))
            promedios = cursor.fetchall()
            cursor.close()
            conn.close()

            return promedios

        except Exception as e:
            print(f"[DB] Error calculando promedios: {e}")
            return []

    @staticmethod
    def obtener_estadisticas_globales(actividad_id):
        """Obtener estadísticas globales de todos los análisis de una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
            SELECT 
                COUNT(DISTINCT usuario_id) as total_participantes,
                AVG(CAST(emocion_confianza AS DECIMAL(10,2))) as emocion_confianza_prom,
                AVG(CAST(energia_voz AS DECIMAL(10,2))) as energia_promedio,
                AVG(CAST(estres_nivel AS DECIMAL(10,2))) as estres_promedio,
                AVG(CAST(ansiedad_nivel AS DECIMAL(10,2))) as ansiedad_promedio,
                AVG(CAST(bienestar_nivel AS DECIMAL(10,2))) as bienestar_promedio,
                MIN(CAST(estres_nivel AS DECIMAL(10,2))) as estres_minimo,
                MAX(CAST(estres_nivel AS DECIMAL(10,2))) as estres_maximo,
                MIN(CAST(ansiedad_nivel AS DECIMAL(10,2))) as ansiedad_minima,
                MAX(CAST(ansiedad_nivel AS DECIMAL(10,2))) as ansiedad_maxima
            FROM analisis_voz_participante
            WHERE actividad_id = %s
            """

            cursor.execute(query, (actividad_id,))
            estadisticas = cursor.fetchone()
            cursor.close()
            conn.close()

            return estadisticas

        except Exception as e:
            print(f"[DB] Error obteniendo estadísticas: {e}")
            return None
