# backend/models/sesion_actividad_grupal.py
"""
Modelo para sesiones de actividades grupales con análisis de voz.
Gestiona las sesiones donde todos los miembros de un grupo graban 
audio para análisis emocional conjunto.
"""

from backend.database.connection import DatabaseConnection
from datetime import datetime, timedelta
from typing import List, Dict, Optional


class SesionActividadGrupal:
    """Modelo para la tabla sesion_actividad_grupal"""
    
    @staticmethod
    def create(
        id_actividad: int,
        id_grupo: int,
        id_iniciador: int,
        titulo: str,
        descripcion: Optional[str] = None,
        fecha_limite: Optional[datetime] = None
    ) -> Optional[int]:
        """
        Crear una nueva sesión de actividad grupal.
        
        Args:
            id_actividad: ID de la actividad padre
            id_grupo: ID del grupo
            id_iniciador: ID del usuario que inicia la sesión
            titulo: Título de la sesión
            descripcion: Descripción opcional
            fecha_limite: Fecha límite para completar
            
        Returns:
            ID de la sesión creada o None si falla
        """
        # Si no hay fecha límite, establecer 24 horas desde ahora
        if not fecha_limite:
            fecha_limite = datetime.now() + timedelta(hours=24)
            
        query = """
            INSERT INTO sesion_actividad_grupal 
            (id_actividad, id_grupo, id_iniciador, titulo, descripcion, 
             estado, fecha_limite)
            VALUES (%s, %s, %s, %s, %s, 'en_progreso', %s)
        """
        result = DatabaseConnection.execute_query(
            query, 
            (id_actividad, id_grupo, id_iniciador, titulo, descripcion, fecha_limite),
            fetch=False
        )
        
        # El trigger creará automáticamente las participaciones para todos los miembros
        return result.get('last_id') if result else None
    
    @staticmethod
    def get_by_id(id_sesion: int) -> Optional[Dict]:
        """Obtener sesión por ID con información completa"""
        query = """
            SELECT 
                sag.*,
                g.nombre_grupo,
                u.nombre as iniciador_nombre,
                u.apellido as iniciador_apellido,
                CASE 
                    WHEN sag.total_participantes > 0 
                    THEN ROUND((sag.participantes_completados * 100.0) / sag.total_participantes, 1)
                    ELSE 0 
                END as porcentaje_completado
            FROM sesion_actividad_grupal sag
            JOIN grupos g ON sag.id_grupo = g.id_grupo
            JOIN usuario u ON sag.id_iniciador = u.id_usuario
            WHERE sag.id_sesion = %s AND sag.activo = 1
        """
        results = DatabaseConnection.execute_query(query, (id_sesion,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_grupo(id_grupo: int, estado: Optional[str] = None, limit: int = 20) -> List[Dict]:
        """Obtener sesiones de un grupo"""
        query = """
            SELECT 
                sag.*,
                u.nombre as iniciador_nombre,
                u.apellido as iniciador_apellido,
                CASE 
                    WHEN sag.total_participantes > 0 
                    THEN ROUND((sag.participantes_completados * 100.0) / sag.total_participantes, 1)
                    ELSE 0 
                END as porcentaje_completado,
                rg.id_resultado_grupal,
                rg.emocion_predominante,
                rg.nivel_bienestar_grupal
            FROM sesion_actividad_grupal sag
            JOIN usuario u ON sag.id_iniciador = u.id_usuario
            LEFT JOIN resultado_grupal rg ON sag.id_sesion = rg.id_sesion
            WHERE sag.id_grupo = %s AND sag.activo = 1
        """
        params = [id_grupo]
        
        if estado:
            query += " AND sag.estado = %s"
            params.append(estado)
            
        query += " ORDER BY sag.fecha_inicio DESC LIMIT %s"
        params.append(limit)
        
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def get_by_actividad(id_actividad: int) -> List[Dict]:
        """Obtener todas las sesiones de una actividad específica"""
        query = """
            SELECT sag.*, 
                   u.nombre as iniciador_nombre,
                   u.apellido as iniciador_apellido
            FROM sesion_actividad_grupal sag
            JOIN usuario u ON sag.id_iniciador = u.id_usuario
            WHERE sag.id_actividad = %s AND sag.activo = 1
            ORDER BY sag.fecha_inicio DESC
        """
        return DatabaseConnection.execute_query(query, (id_actividad,))
    
    @staticmethod
    def get_active_session_for_grupo(id_grupo: int) -> Optional[Dict]:
        """Obtener la sesión activa actual de un grupo (si existe)"""
        query = """
            SELECT sag.*, 
                   CASE 
                       WHEN sag.total_participantes > 0 
                       THEN ROUND((sag.participantes_completados * 100.0) / sag.total_participantes, 1)
                       ELSE 0 
                   END as porcentaje_completado
            FROM sesion_actividad_grupal sag
            WHERE sag.id_grupo = %s 
              AND sag.activo = 1 
              AND sag.estado = 'en_progreso'
            ORDER BY sag.fecha_inicio DESC
            LIMIT 1
        """
        results = DatabaseConnection.execute_query(query, (id_grupo,))
        return results[0] if results else None
    
    @staticmethod
    def get_user_pending_sessions(id_usuario: int) -> List[Dict]:
        """Obtener sesiones pendientes donde el usuario no ha completado"""
        query = """
            SELECT 
                sag.*,
                g.nombre_grupo,
                psg.estado as mi_estado,
                psg.id_participacion,
                u.nombre as iniciador_nombre,
                sag.total_participantes,
                sag.participantes_completados
            FROM sesion_actividad_grupal sag
            JOIN grupos g ON sag.id_grupo = g.id_grupo
            JOIN participacion_sesion_grupal psg ON sag.id_sesion = psg.id_sesion
            JOIN usuario u ON sag.id_iniciador = u.id_usuario
            WHERE psg.id_usuario = %s 
              AND sag.activo = 1
              AND sag.estado = 'en_progreso'
              AND psg.estado IN ('pendiente', 'grabando')
            ORDER BY sag.fecha_inicio DESC
        """
        return DatabaseConnection.execute_query(query, (id_usuario,))
    
    @staticmethod
    def update_estado(id_sesion: int, estado: str) -> bool:
        """Actualizar estado de la sesión"""
        query = """
            UPDATE sesion_actividad_grupal 
            SET estado = %s,
                fecha_completada = CASE WHEN %s = 'completada' THEN NOW() ELSE fecha_completada END
            WHERE id_sesion = %s
        """
        DatabaseConnection.execute_query(query, (estado, estado, id_sesion), fetch=False)
        return True
    
    @staticmethod
    def update_contadores(id_sesion: int) -> Dict:
        """Actualizar contadores de participación y verificar si completó"""
        # Contar completados
        query_count = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados
            FROM participacion_sesion_grupal
            WHERE id_sesion = %s
        """
        results = DatabaseConnection.execute_query(query_count, (id_sesion,))
        counts = results[0] if results else {'total': 0, 'completados': 0}
        
        # Actualizar sesión
        query_update = """
            UPDATE sesion_actividad_grupal 
            SET participantes_completados = %s,
                total_participantes = %s
            WHERE id_sesion = %s
        """
        DatabaseConnection.execute_query(
            query_update, 
            (counts['completados'], counts['total'], id_sesion),
            fetch=False
        )
        
        # Verificar si todos completaron
        if counts['completados'] >= counts['total'] and counts['total'] > 0:
            SesionActividadGrupal.update_estado(id_sesion, 'completada')
            return {'completada': True, **counts}
        
        return {'completada': False, **counts}
    
    @staticmethod
    def cancel(id_sesion: int) -> bool:
        """Cancelar una sesión"""
        query = "UPDATE sesion_actividad_grupal SET estado = 'cancelada' WHERE id_sesion = %s"
        DatabaseConnection.execute_query(query, (id_sesion,), fetch=False)
        return True
    
    @staticmethod
    def delete(id_sesion: int) -> bool:
        """Soft delete de sesión"""
        query = "UPDATE sesion_actividad_grupal SET activo = 0 WHERE id_sesion = %s"
        DatabaseConnection.execute_query(query, (id_sesion,), fetch=False)
        return True


class ParticipacionSesionGrupal:
    """Modelo para la tabla participacion_sesion_grupal"""
    
    @staticmethod
    def get_by_id(id_participacion: int) -> Optional[Dict]:
        """Obtener participación por ID"""
        query = """
            SELECT psg.*, u.nombre, u.apellido, u.correo
            FROM participacion_sesion_grupal psg
            JOIN usuario u ON psg.id_usuario = u.id_usuario
            WHERE psg.id_participacion = %s
        """
        results = DatabaseConnection.execute_query(query, (id_participacion,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_sesion(id_sesion: int) -> List[Dict]:
        """Obtener todas las participaciones de una sesión"""
        query = """
            SELECT 
                psg.*,
                u.nombre,
                u.apellido,
                u.foto_perfil,
                ra.emocion_predominante,
                ra.nivel_estres,
                ra.nivel_ansiedad,
                ra.nivel_felicidad,
                ra.confianza
            FROM participacion_sesion_grupal psg
            JOIN usuario u ON psg.id_usuario = u.id_usuario
            LEFT JOIN resultado_analisis ra ON psg.id_resultado = ra.id_resultado
            WHERE psg.id_sesion = %s
            ORDER BY psg.fecha_completado DESC, psg.id_participacion
        """
        return DatabaseConnection.execute_query(query, (id_sesion,))
    
    @staticmethod
    def get_user_participation(id_sesion: int, id_usuario: int) -> Optional[Dict]:
        """Obtener la participación de un usuario en una sesión"""
        query = """
            SELECT psg.*, 
                   ra.emocion_predominante,
                   ra.nivel_estres,
                   ra.nivel_ansiedad,
                   ra.nivel_felicidad
            FROM participacion_sesion_grupal psg
            LEFT JOIN resultado_analisis ra ON psg.id_resultado = ra.id_resultado
            WHERE psg.id_sesion = %s AND psg.id_usuario = %s
        """
        results = DatabaseConnection.execute_query(query, (id_sesion, id_usuario))
        return results[0] if results else None
    
    @staticmethod
    def update_estado(id_participacion: int, estado: str) -> bool:
        """Actualizar estado de participación"""
        query = "UPDATE participacion_sesion_grupal SET estado = %s WHERE id_participacion = %s"
        DatabaseConnection.execute_query(query, (estado, id_participacion), fetch=False)
        return True
    
    @staticmethod
    def registrar_audio(
        id_participacion: int, 
        id_audio: int
    ) -> bool:
        """Registrar audio grabado por el participante"""
        query = """
            UPDATE participacion_sesion_grupal 
            SET id_audio = %s, estado = 'analizando'
            WHERE id_participacion = %s
        """
        DatabaseConnection.execute_query(query, (id_audio, id_participacion), fetch=False)
        return True
    
    @staticmethod
    def completar(
        id_participacion: int,
        id_analisis: int,
        id_resultado: int,
        notas: Optional[str] = None
    ) -> bool:
        """Marcar participación como completada con resultado de análisis"""
        query = """
            UPDATE participacion_sesion_grupal 
            SET id_analisis = %s,
                id_resultado = %s,
                estado = 'completado',
                fecha_completado = NOW(),
                notas = COALESCE(%s, notas)
            WHERE id_participacion = %s
        """
        DatabaseConnection.execute_query(
            query, 
            (id_analisis, id_resultado, notas, id_participacion),
            fetch=False
        )
        return True
    
    @staticmethod
    def marcar_visto(id_participacion: int) -> bool:
        """Marcar que el usuario vio la invitación"""
        query = "UPDATE participacion_sesion_grupal SET visto = 1 WHERE id_participacion = %s"
        DatabaseConnection.execute_query(query, (id_participacion,), fetch=False)
        return True
    
    @staticmethod
    def marcar_error(id_participacion: int, notas: str) -> bool:
        """Marcar participación con error"""
        query = """
            UPDATE participacion_sesion_grupal 
            SET estado = 'error', notas = %s
            WHERE id_participacion = %s
        """
        DatabaseConnection.execute_query(query, (notas, id_participacion), fetch=False)
        return True


class ResultadoGrupal:
    """Modelo para la tabla resultado_grupal"""
    
    @staticmethod
    def create(id_sesion: int, id_grupo: int, datos: Dict) -> Optional[int]:
        """
        Crear resultado grupal agregado.
        
        Args:
            id_sesion: ID de la sesión
            id_grupo: ID del grupo
            datos: Diccionario con promedios y estadísticas
            
        Returns:
            ID del resultado creado
        """
        query = """
            INSERT INTO resultado_grupal (
                id_sesion, id_grupo,
                promedio_felicidad, promedio_tristeza, promedio_enojo,
                promedio_miedo, promedio_sorpresa, promedio_neutral,
                promedio_estres, promedio_ansiedad,
                emocion_predominante, nivel_bienestar_grupal,
                desviacion_estandar, confianza_promedio,
                total_participantes, resumen_ia, recomendacion_grupal
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        result = DatabaseConnection.execute_query(
            query,
            (
                id_sesion, id_grupo,
                datos.get('promedio_felicidad', 0),
                datos.get('promedio_tristeza', 0),
                datos.get('promedio_enojo', 0),
                datos.get('promedio_miedo', 0),
                datos.get('promedio_sorpresa', 0),
                datos.get('promedio_neutral', 0),
                datos.get('promedio_estres', 0),
                datos.get('promedio_ansiedad', 0),
                datos.get('emocion_predominante'),
                datos.get('nivel_bienestar_grupal', 0),
                datos.get('desviacion_estandar', 0),
                datos.get('confianza_promedio', 0),
                datos.get('total_participantes', 0),
                datos.get('resumen_ia'),
                datos.get('recomendacion_grupal')
            ),
            fetch=False
        )
        return result.get('last_id') if result else None
    
    @staticmethod
    def get_by_sesion(id_sesion: int) -> Optional[Dict]:
        """Obtener resultado grupal de una sesión"""
        query = """
            SELECT rg.*, 
                   g.nombre_grupo,
                   sag.titulo as sesion_titulo,
                   sag.fecha_inicio,
                   sag.fecha_completada
            FROM resultado_grupal rg
            JOIN grupos g ON rg.id_grupo = g.id_grupo
            JOIN sesion_actividad_grupal sag ON rg.id_sesion = sag.id_sesion
            WHERE rg.id_sesion = %s AND rg.activo = 1
        """
        results = DatabaseConnection.execute_query(query, (id_sesion,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_grupo(id_grupo: int, limit: int = 10) -> List[Dict]:
        """Obtener historial de resultados grupales"""
        query = """
            SELECT rg.*, sag.titulo as sesion_titulo, sag.fecha_inicio
            FROM resultado_grupal rg
            JOIN sesion_actividad_grupal sag ON rg.id_sesion = sag.id_sesion
            WHERE rg.id_grupo = %s AND rg.activo = 1
            ORDER BY rg.fecha_calculo DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_grupo, limit))
    
    @staticmethod
    def update_resumen_ia(id_resultado_grupal: int, resumen: str, recomendacion: str) -> bool:
        """Actualizar resumen generado por IA"""
        query = """
            UPDATE resultado_grupal 
            SET resumen_ia = %s, recomendacion_grupal = %s
            WHERE id_resultado_grupal = %s
        """
        DatabaseConnection.execute_query(query, (resumen, recomendacion, id_resultado_grupal), fetch=False)
        return True
