# backend/models/actividad_participante.py
"""
Modelo para gestionar el estado de participantes en actividades grupales.
Rastrea quién está "activo", "completado", "ausente", etc.
"""

from backend.database.connection import DatabaseConnection
from datetime import datetime
from typing import List, Dict, Optional


class ActividadParticipante:
    """Modelo para la tabla actividad_participante_estado"""
    
    @staticmethod
    def crear_participantes_actividad(id_actividad: int, id_grupo: int) -> bool:
        """
        Crear registros de participante para todos los miembros activos del grupo.
        Se llama cuando se crea una nueva actividad.
        
        Args:
            id_actividad: ID de la actividad
            id_grupo: ID del grupo
            
        Returns:
            True si se crearon exitosamente
        """
        query = """
            INSERT INTO actividad_participante_estado (id_actividad, id_usuario, estado)
            SELECT %s, gm.id_usuario, 'pendiente'
            FROM grupo_miembros gm
            WHERE gm.id_grupo = %s 
              AND gm.estado = 'activo'
            ON DUPLICATE KEY UPDATE 
              estado = CASE WHEN estado = 'pendiente' THEN 'pendiente' ELSE estado END
        """
        result = DatabaseConnection.execute_query(
            query,
            (id_actividad, id_grupo),
            fetch=False
        )
        return result is not None
    
    @staticmethod
    def marcar_como_activo(id_actividad: int, id_usuario: int) -> bool:
        """
        Marcar un usuario como 'activo' en la actividad.
        
        Args:
            id_actividad: ID de la actividad
            id_usuario: ID del usuario
            
        Returns:
            True si se actualizó exitosamente
        """
        query = """
            UPDATE actividad_participante_estado
            SET estado = 'activo',
                fecha_activacion = NOW()
            WHERE id_actividad = %s 
              AND id_usuario = %s
              AND estado = 'pendiente'
        """
        DatabaseConnection.execute_query(
            query,
            (id_actividad, id_usuario),
            fetch=False
        )
        return True
    
    @staticmethod
    def marcar_como_completado(id_actividad: int, id_usuario: int) -> bool:
        """
        Marcar un usuario como 'completado' (ha enviado su análisis).
        
        Args:
            id_actividad: ID de la actividad
            id_usuario: ID del usuario
            
        Returns:
            True si se actualizó exitosamente
        """
        query = """
            UPDATE actividad_participante_estado
            SET estado = 'completado',
                fecha_completado = NOW()
            WHERE id_actividad = %s 
              AND id_usuario = %s
        """
        DatabaseConnection.execute_query(
            query,
            (id_actividad, id_usuario),
            fetch=False
        )
        return True
    
    @staticmethod
    def obtener_estado_participante(id_actividad: int, id_usuario: int) -> Optional[Dict]:
        """
        Obtener estado actual de un participante en una actividad.
        
        Args:
            id_actividad: ID de la actividad
            id_usuario: ID del usuario
            
        Returns:
            Dict con estado del participante o None
        """
        query = """
            SELECT *
            FROM actividad_participante_estado
            WHERE id_actividad = %s 
              AND id_usuario = %s
              AND activo = 1
        """
        results = DatabaseConnection.execute_query(query, (id_actividad, id_usuario))
        return results[0] if results else None
    
    @staticmethod
    def obtener_participantes_actividad(id_actividad: int) -> List[Dict]:
        """
        Obtener todos los participantes de una actividad con su estado y detalles.
        
        Args:
            id_actividad: ID de la actividad
            
        Returns:
            Lista de participantes con estado
        """
        query = """
            SELECT 
                ape.*,
                u.nombre,
                u.apellido,
                u.correo,
                u.foto_perfil,
                COUNT(aapa.id_analisis_participante) as total_analisis_enviados
            FROM actividad_participante_estado ape
            JOIN usuario u ON ape.id_usuario = u.id_usuario
            LEFT JOIN analisis_participante_actividad aapa 
              ON ape.id_actividad = aapa.id_actividad 
              AND ape.id_usuario = aapa.id_usuario
            WHERE ape.id_actividad = %s 
              AND ape.activo = 1
            GROUP BY ape.id_estado_participante
            ORDER BY 
              CASE ape.estado 
                WHEN 'activo' THEN 0
                WHEN 'completado' THEN 1
                WHEN 'pendiente' THEN 2
                WHEN 'ausente' THEN 3
                ELSE 4
              END,
              u.nombre
        """
        return DatabaseConnection.execute_query(query, (id_actividad,))
    
    @staticmethod
    def obtener_estadisticas_participacion(id_actividad: int) -> Dict:
        """
        Obtener estadísticas de participación en una actividad.
        
        Returns:
            Dict con conteos: total, activos, completados, ausentes, pendientes
        """
        query = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados,
                SUM(CASE WHEN estado = 'ausente' THEN 1 ELSE 0 END) as ausentes,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
            FROM actividad_participante_estado
            WHERE id_actividad = %s 
              AND activo = 1
        """
        results = DatabaseConnection.execute_query(query, (id_actividad,))
        if results:
            return results[0]
        return {
            'total': 0,
            'activos': 0,
            'completados': 0,
            'ausentes': 0,
            'pendientes': 0
        }
    
    @staticmethod
    def todos_activos(id_actividad: int) -> bool:
        """
        Verificar si TODOS los participantes están activos o completados.
        
        Args:
            id_actividad: ID de la actividad
            
        Returns:
            True si todos están activos/completados, False si hay pendientes
        """
        stats = ActividadParticipante.obtener_estadisticas_participacion(id_actividad)
        # Todos activos si no hay pendientes ni ausentes
        return (stats.get('pendientes', 0) == 0 and 
                stats.get('ausentes', 0) == 0)
    
    @staticmethod
    def todos_completados(id_actividad: int) -> bool:
        """
        Verificar si TODOS los participantes completaron su análisis.
        
        Args:
            id_actividad: ID de la actividad
            
        Returns:
            True si todos completaron
        """
        stats = ActividadParticipante.obtener_estadisticas_participacion(id_actividad)
        # Todos completados si completados == total
        return (stats.get('completados', 0) > 0 and 
                stats.get('completados', 0) == stats.get('total', 0))
    
    @staticmethod
    def marcar_ausentes_por_timeout(id_actividad: int, minutos: int = 30) -> int:
        """
        Marcar como 'ausentes' a participantes que no se marcaron activos.
        Se ejecuta después de X minutos sin actividad.
        
        Args:
            id_actividad: ID de la actividad
            minutos: Minutos para considerar timeout (default 30)
            
        Returns:
            Número de registros marcados como ausentes
        """
        query = """
            UPDATE actividad_participante_estado
            SET estado = 'ausente'
            WHERE id_actividad = %s 
              AND estado = 'pendiente'
              AND fecha_creacion < DATE_SUB(NOW(), INTERVAL %s MINUTE)
        """
        result = DatabaseConnection.execute_query(
            query,
            (id_actividad, minutos),
            fetch=False
        )
        return result.get('affected_rows', 0) if result else 0
    
    @staticmethod
    def obtener_participantes_por_estado(id_actividad: int, estado: str) -> List[Dict]:
        """
        Obtener participantes en un estado específico.
        
        Args:
            id_actividad: ID de la actividad
            estado: Estado a filtrar (pendiente, activo, completado, ausente)
            
        Returns:
            Lista de participantes en ese estado
        """
        query = """
            SELECT 
                ape.*,
                u.nombre,
                u.apellido,
                u.correo,
                u.foto_perfil
            FROM actividad_participante_estado ape
            JOIN usuario u ON ape.id_usuario = u.id_usuario
            WHERE ape.id_actividad = %s 
              AND ape.estado = %s
              AND ape.activo = 1
            ORDER BY u.nombre
        """
        return DatabaseConnection.execute_query(query, (id_actividad, estado))
