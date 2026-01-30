# backend/models/sesion_juego.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class SesionJuego:
    """Modelo para la tabla sesiones_juego"""
    
    @staticmethod
    def create(id_usuario, id_juego, estado_antes=None, notas=None):
        """Crear nueva sesión de juego"""
        query = """
            INSERT INTO sesiones_juego 
            (id_usuario, id_juego, fecha_inicio, estado_antes, notas)
            VALUES (%s, %s, %s, %s, %s)
        """
        res = DatabaseConnection.execute_update(
            query, 
            (id_usuario, id_juego, datetime.now(), estado_antes, notas)
        )
        return res.get('last_id')
    
    @staticmethod
    def get_by_id(id_sesion):
        """Obtener sesión de juego por ID"""
        query = "SELECT * FROM sesiones_juego WHERE id = %s"
        results = DatabaseConnection.execute_query(query, (id_sesion,))
        return results[0] if results else None
    
    @staticmethod
    def get_complete(id_sesion):
        """Obtener sesión completa con información del juego usando vista"""
        query = "SELECT * FROM vista_sesiones_completas WHERE sesion_id = %s"
        results = DatabaseConnection.execute_query(query, (id_sesion,))
        return results[0] if results else None
    
    @staticmethod
    def get_user_sessions(id_usuario, limit=20, offset=0):
        """Obtener sesiones de un usuario usando vista optimizada"""
        query = """
            SELECT * FROM vista_sesiones_completas 
            WHERE id_usuario = %s 
            ORDER BY fecha_inicio DESC
            LIMIT %s OFFSET %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit, offset))
    
    @staticmethod
    def get_by_juego(id_juego, limit=50):
        """Obtener sesiones de un juego específico"""
        query = """
            SELECT * FROM vista_sesiones_completas 
            WHERE id_juego = %s 
            ORDER BY fecha_inicio DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_juego, limit))
    
    @staticmethod
    def complete_session(id_sesion, duracion_segundos, puntuacion=0, nivel_alcanzado=1,
                        estado_despues=None, mejora_percibida=None, notas_finales=None):
        """Completar una sesión de juego"""
        query = """
            UPDATE sesiones_juego 
            SET fecha_fin = NOW(),
                duracion_segundos = %s,
                puntuacion = %s,
                nivel_alcanzado = %s,
                completado = 1,
                estado_despues = %s,
                mejora_percibida = %s,
                notas = COALESCE(%s, notas)
            WHERE id = %s
        """
        DatabaseConnection.execute_query(
            query, 
            (duracion_segundos, puntuacion, nivel_alcanzado, estado_despues, 
             mejora_percibida, notas_finales, id_sesion),
            fetch=False
        )
        return True
    
    @staticmethod
    def update_progress(id_sesion, puntuacion=None, nivel_alcanzado=None):
        """Actualizar progreso de sesión en curso"""
        updates = []
        values = []
        
        if puntuacion is not None:
            updates.append("puntuacion = %s")
            values.append(puntuacion)
        
        if nivel_alcanzado is not None:
            updates.append("nivel_alcanzado = %s")
            values.append(nivel_alcanzado)
        
        if not updates:
            return False
        
        values.append(id_sesion)
        query = f"UPDATE sesiones_juego SET {', '.join(updates)} WHERE id = %s"
        DatabaseConnection.execute_query(query, tuple(values), fetch=False)
        return True
    
    @staticmethod
    def get_statistics(id_usuario, id_juego=None):
        """Obtener estadísticas de sesiones"""
        query = """
            SELECT 
                COUNT(*) as total_sesiones,
                SUM(completado) as sesiones_completadas,
                AVG(puntuacion) as puntuacion_promedio,
                AVG(duracion_segundos) as duracion_promedio,
                MAX(nivel_alcanzado) as nivel_maximo
            FROM sesiones_juego
            WHERE id_usuario = %s
        """
        params = [id_usuario]
        
        if id_juego:
            query += " AND id_juego = %s"
            params.append(id_juego)
        
        results = DatabaseConnection.execute_query(query, tuple(params))
        return results[0] if results else None
    
    @staticmethod
    def get_mejora_emocional(id_usuario, dias=30):
        """Obtener análisis de mejora emocional en los últimos N días"""
        query = """
            SELECT 
                estado_antes,
                estado_despues,
                mejora_percibida,
                COUNT(*) as cantidad
            FROM sesiones_juego
            WHERE id_usuario = %s 
              AND fecha_inicio >= DATE_SUB(NOW(), INTERVAL %s DAY)
              AND completado = 1
              AND mejora_percibida IS NOT NULL
            GROUP BY estado_antes, estado_despues, mejora_percibida
            ORDER BY fecha_inicio DESC
        """
        return DatabaseConnection.execute_query(query, (id_usuario, dias))
