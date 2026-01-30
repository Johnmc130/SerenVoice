"""
Modelo: ResultadoActividadGrupal
Descripción: Resultado final agregado de una actividad grupal
"""

from backend.database.connection import DatabaseConnection


class ResultadoActividadGrupal:
    """Gestión de resultados finales de actividades grupales"""

    @staticmethod
    def crear(actividad_id, emocion_dominante, emocion_promedio, emocion_varianza,
              estres_promedio, ansiedad_promedio, bienestar_promedio, energia_promedio,
              total_participantes, participantes_completados, porcentaje_completacion,
              patron_grupal="", recomendaciones="", fortalezas="", areas_mejora=""):
        """Crear registro de resultado final"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()

            query = """
            INSERT INTO resultado_actividad_grupal
            (actividad_id, emocion_dominante, emocion_promedio_grupo, emocion_varianza,
             estres_promedio, ansiedad_promedio, bienestar_promedio, energia_promedio,
             total_participantes, participantes_completados, porcentaje_completacion,
             patron_grupal, recomendaciones_grupo, fortalezas, areas_mejora)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            cursor.execute(query, (
                actividad_id, emocion_dominante, emocion_promedio, emocion_varianza,
                estres_promedio, ansiedad_promedio, bienestar_promedio, energia_promedio,
                total_participantes, participantes_completados, porcentaje_completacion,
                patron_grupal, recomendaciones, fortalezas, areas_mejora
            ))

            resultado_id = cursor.lastrowid
            cursor.close()
            conn.close()

            return resultado_id

        except Exception as e:
            print(f"[DB] Error creando resultado: {e}")
            raise

    @staticmethod
    def obtener(actividad_id):
        """Obtener resultado de una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
            SELECT * FROM resultado_actividad_grupal
            WHERE actividad_id = %s
            """

            cursor.execute(query, (actividad_id,))
            resultado = cursor.fetchone()
            cursor.close()
            conn.close()

            return resultado

        except Exception as e:
            print(f"[DB] Error obteniendo resultado: {e}")
            return None

    @staticmethod
    def existe(actividad_id):
        """Verificar si ya existe un resultado para una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()

            query = "SELECT id FROM resultado_actividad_grupal WHERE actividad_id = %s"
            cursor.execute(query, (actividad_id,))
            existe = cursor.fetchone() is not None
            cursor.close()
            conn.close()

            return existe

        except Exception as e:
            print(f"[DB] Error verificando resultado: {e}")
            return False

    @staticmethod
    def actualizar(actividad_id, **kwargs):
        """Actualizar resultado existente"""
        try:
            if not kwargs:
                return False

            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()

            campos = []
            valores = []

            for clave, valor in kwargs.items():
                campos.append(f"{clave} = %s")
                valores.append(valor)

            valores.append(actividad_id)

            query = f"""
            UPDATE resultado_actividad_grupal
            SET {', '.join(campos)}
            WHERE actividad_id = %s
            """

            cursor.execute(query, valores)
            cursor.close()
            conn.close()

            return True

        except Exception as e:
            print(f"[DB] Error actualizando resultado: {e}")
            return False

    @staticmethod
    def obtener_por_grupo(grupo_id):
        """Obtener todos los resultados de un grupo"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
            SELECT r.*, ag.nombre as actividad_nombre, ag.fecha_creacion
            FROM resultado_actividad_grupal r
            JOIN actividades_grupo ag ON r.actividad_id = ag.id
            WHERE ag.grupo_id = %s
            ORDER BY r.fecha_calculo DESC
            """

            cursor.execute(query, (grupo_id,))
            resultados = cursor.fetchall()
            cursor.close()
            conn.close()

            return resultados

        except Exception as e:
            print(f"[DB] Error obteniendo resultados: {e}")
            return []

    @staticmethod
    def obtener_historial_emociones(grupo_id, limite=10):
        """Obtener historial de emociones dominantes de un grupo"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
            SELECT 
                ag.nombre as actividad,
                r.emocion_dominante,
                r.emocion_promedio_grupo,
                r.estres_promedio,
                r.ansiedad_promedio,
                r.bienestar_promedio,
                r.fecha_calculo
            FROM resultado_actividad_grupal r
            JOIN actividades_grupo ag ON r.actividad_id = ag.id
            WHERE ag.grupo_id = %s
            ORDER BY r.fecha_calculo DESC
            LIMIT %s
            """

            cursor.execute(query, (grupo_id, limite))
            historial = cursor.fetchall()
            cursor.close()
            conn.close()

            return historial

        except Exception as e:
            print(f"[DB] Error obteniendo historial: {e}")
            return []
"""
Modelo para almacenar y recuperar resultados de análisis grupal.
Maneja promedios de emociones y estadísticas de actividades grupales.
"""

from backend.database.connection import DatabaseConnection
from datetime import datetime
from typing import List, Dict, Optional
import json


class ResultadoActividadGrupal:
    """Modelo para la tabla resultado_analisis_actividad"""
    
    @staticmethod
    def crear(
        id_actividad: int,
        id_grupo: int,
        total_participantes: int,
        promedio_estres: float,
        promedio_ansiedad: float,
        promedio_confianza: float,
        emocion_predominante: str,
        promedio_emocion_predominante: float,
        emociones_detalle: Dict,
        bienestar_grupal: str = "normal",
        observaciones: str = None
    ) -> Optional[int]:
        """
        Crear un registro de resultado de actividad grupal.
        
        Args:
            id_actividad: ID de la actividad
            id_grupo: ID del grupo
            total_participantes: Total de participantes que analizaron
            promedio_estres: Promedio de nivel de estrés (0-100)
            promedio_ansiedad: Promedio de nivel de ansiedad (0-100)
            promedio_confianza: Promedio de confianza del modelo
            emocion_predominante: Emoción dominante (Miedo, Tristeza, etc)
            promedio_emocion_predominante: Valor promedio de la emoción dominante
            emociones_detalle: Dict con detalles de todas las emociones
            bienestar_grupal: Evaluación general (bajo, normal, alto)
            observaciones: Notas adicionales
            
        Returns:
            ID del resultado creado o None si falla
        """
        query = """
            INSERT INTO resultado_analisis_actividad 
            (id_actividad, id_grupo, total_participantes, total_procesados,
             promedio_estres, promedio_ansiedad, promedio_confianza,
             emocion_predominante, promedio_emocion_predominante,
             emociones_detalle, bienestar_grupal, observaciones)
            VALUES 
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              total_procesados = %s,
              promedio_estres = %s,
              promedio_ansiedad = %s,
              promedio_confianza = %s,
              emocion_predominante = %s,
              promedio_emocion_predominante = %s,
              emociones_detalle = %s,
              bienestar_grupal = %s,
              observaciones = %s,
              fecha_analisis = NOW()
        """
        
        emociones_json = json.dumps(emociones_detalle) if isinstance(emociones_detalle, dict) else emociones_detalle
        
        result = DatabaseConnection.execute_query(
            query,
            (
                id_actividad, id_grupo, total_participantes, total_participantes,
                promedio_estres, promedio_ansiedad, promedio_confianza,
                emocion_predominante, promedio_emocion_predominante,
                emociones_json, bienestar_grupal, observaciones,
                # ON DUPLICATE KEY UPDATE values
                total_participantes, promedio_estres, promedio_ansiedad,
                promedio_confianza, emocion_predominante,
                promedio_emocion_predominante, emociones_json,
                bienestar_grupal, observaciones
            ),
            fetch=False
        )
        
        return result.get('last_id') if result else None
    
    @staticmethod
    def obtener_por_actividad(id_actividad: int) -> Optional[Dict]:
        """
        Obtener resultado de una actividad específica.
        
        Args:
            id_actividad: ID de la actividad
            
        Returns:
            Dict con resultado o None
        """
        query = """
            SELECT *
            FROM resultado_analisis_actividad
            WHERE id_actividad = %s 
              AND activo = 1
        """
        results = DatabaseConnection.execute_query(query, (id_actividad,))
        if results:
            resultado = results[0]
            # Parsear JSON
            if resultado.get('emociones_detalle'):
                try:
                    resultado['emociones_detalle'] = json.loads(resultado['emociones_detalle'])
                except:
                    pass
            return resultado
        return None
    
    @staticmethod
    def obtener_por_grupo(id_grupo: int, limit: int = 20) -> List[Dict]:
        """
        Obtener resultados recientes de un grupo.
        
        Args:
            id_grupo: ID del grupo
            limit: Límite de resultados
            
        Returns:
            Lista de resultados
        """
        query = """
            SELECT 
                rag.*,
                ag.titulo as actividad_titulo,
                ag.descripcion as actividad_descripcion,
                ag.fecha_inicio,
                ag.fecha_fin
            FROM resultado_analisis_actividad rag
            JOIN actividades_grupo ag ON rag.id_actividad = ag.id_actividad
            WHERE rag.id_grupo = %s 
              AND rag.activo = 1
            ORDER BY rag.fecha_analisis DESC
            LIMIT %s
        """
        results = DatabaseConnection.execute_query(query, (id_grupo, limit))
        
        # Parsear JSONs
        for resultado in results:
            if resultado.get('emociones_detalle'):
                try:
                    resultado['emociones_detalle'] = json.loads(resultado['emociones_detalle'])
                except:
                    pass
        
        return results
    
    @staticmethod
    def obtener_estadisticas_grupo(id_grupo: int) -> Optional[Dict]:
        """
        Obtener estadísticas agregadas de todas las actividades de un grupo.
        
        Args:
            id_grupo: ID del grupo
            
        Returns:
            Dict con estadísticas
        """
        query = """
            SELECT 
                COUNT(*) as total_actividades,
                AVG(total_participantes) as promedio_participantes,
                AVG(promedio_estres) as promedio_estres_general,
                AVG(promedio_ansiedad) as promedio_ansiedad_general,
                MAX(promedio_estres) as max_estres,
                MIN(promedio_estres) as min_estres,
                MAX(fecha_analisis) as ultima_actividad
            FROM resultado_analisis_actividad
            WHERE id_grupo = %s 
              AND activo = 1
        """
        results = DatabaseConnection.execute_query(query, (id_grupo,))
        return results[0] if results else None


class AnalisisParticipanteActividad:
    """Modelo para la tabla analisis_participante_actividad"""
    
    @staticmethod
    def crear(
        id_actividad: int,
        id_usuario: int,
        emocion_predominante: str,
        nivel_estres: float,
        nivel_ansiedad: float,
        confianza_modelo: float,
        emociones_json: Dict,
        duracion_audio: int = None,
        id_audio: int = None
    ) -> Optional[int]:
        """
        Registrar análisis de un participante en una actividad grupal.
        
        Args:
            id_actividad: ID de la actividad
            id_usuario: ID del usuario
            emocion_predominante: Emoción principal detectada
            nivel_estres: Nivel de estrés (0-100)
            nivel_ansiedad: Nivel de ansiedad (0-100)
            confianza_modelo: Confianza del modelo (0-1)
            emociones_json: Dict con todas las emociones y valores
            duracion_audio: Duración del audio en ms
            id_audio: ID del audio grabado
            
        Returns:
            ID del análisis creado o None si falla
        """
        emociones_str = json.dumps(emociones_json) if isinstance(emociones_json, dict) else emociones_json
        
        query = """
            INSERT INTO analisis_participante_actividad
            (id_actividad, id_usuario, emocion_predominante, 
             nivel_estres, nivel_ansiedad, confianza_modelo,
             emociones_json, duracion_audio, id_audio)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        result = DatabaseConnection.execute_query(
            query,
            (
                id_actividad, id_usuario, emocion_predominante,
                nivel_estres, nivel_ansiedad, confianza_modelo,
                emociones_str, duracion_audio, id_audio
            ),
            fetch=False
        )
        
        return result.get('last_id') if result else None
    
    @staticmethod
    def obtener_analisis_actividad(id_actividad: int) -> List[Dict]:
        """
        Obtener todos los análisis de una actividad.
        
        Args:
            id_actividad: ID de la actividad
            
        Returns:
            Lista de análisis con detalles
        """
        query = """
            SELECT 
                apa.*,
                u.nombre,
                u.apellido,
                u.correo,
                u.foto_perfil
            FROM analisis_participante_actividad apa
            JOIN usuario u ON apa.id_usuario = u.id_usuario
            WHERE apa.id_actividad = %s 
              AND apa.activo = 1
            ORDER BY apa.fecha_analisis DESC
        """
        results = DatabaseConnection.execute_query(query, (id_actividad,))
        
        # Parsear JSONs
        for analisis in results:
            if analisis.get('emociones_json'):
                try:
                    analisis['emociones_json'] = json.loads(analisis['emociones_json'])
                except:
                    pass
        
        return results
    
    @staticmethod
    def obtener_analisis_usuario_actividad(id_actividad: int, id_usuario: int) -> Optional[Dict]:
        """
        Obtener análisis específico de un usuario en una actividad.
        
        Args:
            id_actividad: ID de la actividad
            id_usuario: ID del usuario
            
        Returns:
            Dict con análisis o None
        """
        query = """
            SELECT *
            FROM analisis_participante_actividad
            WHERE id_actividad = %s 
              AND id_usuario = %s
              AND activo = 1
        """
        results = DatabaseConnection.execute_query(query, (id_actividad, id_usuario))
        if results:
            analisis = results[0]
            if analisis.get('emociones_json'):
                try:
                    analisis['emociones_json'] = json.loads(analisis['emociones_json'])
                except:
                    pass
            return analisis
        return None
    
    @staticmethod
    def obtener_estadisticas_usuario(id_actividad: int, id_usuario: int) -> Dict:
        """
        Obtener estadísticas del usuario en actividades.
        
        Args:
            id_actividad: ID de la actividad (opcional)
            id_usuario: ID del usuario
            
        Returns:
            Dict con estadísticas
        """
        query = """
            SELECT 
                COUNT(*) as total_analisis,
                AVG(nivel_estres) as promedio_estres,
                AVG(nivel_ansiedad) as promedio_ansiedad,
                MAX(nivel_estres) as max_estres,
                MIN(nivel_estres) as min_estres,
                AVG(confianza_modelo) as promedio_confianza
            FROM analisis_participante_actividad
            WHERE id_actividad = %s 
              AND id_usuario = %s
              AND activo = 1
        """
        results = DatabaseConnection.execute_query(query, (id_actividad, id_usuario))
        return results[0] if results else {}
