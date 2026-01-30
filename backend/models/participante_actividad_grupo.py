"""
Modelo: ParticipanteActividadGrupo
Descripción: Gestión de participantes en actividades grupales
"""

from backend.database.connection import DatabaseConnection


class ParticipanteActividadGrupo:
    """Gestión de participantes en actividades"""

    @staticmethod
    def crear(actividad_id, usuario_id):
        """Agregar un participante a una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()

            query = """
            INSERT IGNORE INTO participantes_actividad_grupo 
            (actividad_id, usuario_id, estado)
            VALUES (%s, %s, 'invitado')
            """

            cursor.execute(query, (actividad_id, usuario_id))
            cursor.close()
            conn.close()

            return True

        except Exception as e:
            print(f"[DB] Error agregando participante: {e}")
            return False

    @staticmethod
    def obtener_participantes(actividad_id):
        """Obtener todos los participantes de una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
            SELECT p.id, p.actividad_id, p.usuario_id, p.estado, 
                   p.fecha_conexion, p.fecha_completacion, u.nombre, u.email
            FROM participantes_actividad_grupo p
            JOIN usuario u ON p.usuario_id = u.id
            WHERE p.actividad_id = %s
            ORDER BY p.estado DESC
            """

            cursor.execute(query, (actividad_id,))
            participantes = cursor.fetchall()
            cursor.close()
            conn.close()

            return participantes

        except Exception as e:
            print(f"[DB] Error obteniendo participantes: {e}")
            return []

    @staticmethod
    def actualizar_estado(actividad_id, usuario_id, nuevo_estado):
        """Actualizar estado de un participante"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()

            # Actualizar según el estado
            if nuevo_estado == 'conectado':
                query = """
                UPDATE participantes_actividad_grupo 
                SET estado = 'conectado', fecha_conexion = NOW()
                WHERE actividad_id = %s AND usuario_id = %s
                """
            elif nuevo_estado == 'completado':
                query = """
                UPDATE participantes_actividad_grupo 
                SET estado = 'completado', fecha_completacion = NOW()
                WHERE actividad_id = %s AND usuario_id = %s
                """
            elif nuevo_estado == 'aceptado':
                query = """
                UPDATE participantes_actividad_grupo 
                SET estado = 'aceptado', fecha_aceptacion = NOW()
                WHERE actividad_id = %s AND usuario_id = %s
                """
            else:
                query = """
                UPDATE participantes_actividad_grupo 
                SET estado = %s
                WHERE actividad_id = %s AND usuario_id = %s
                """
                cursor.execute(query, (nuevo_estado, actividad_id, usuario_id))
                cursor.close()
                conn.close()
                return True

            cursor.execute(query, (actividad_id, usuario_id))
            cursor.close()
            conn.close()

            return True

        except Exception as e:
            print(f"[DB] Error actualizando estado: {e}")
            return False

    @staticmethod
    def obtener_estado(actividad_id, usuario_id):
        """Obtener estado de un participante específico"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
            SELECT estado, fecha_conexion, fecha_completacion
            FROM participantes_actividad_grupo
            WHERE actividad_id = %s AND usuario_id = %s
            """

            cursor.execute(query, (actividad_id, usuario_id))
            resultado = cursor.fetchone()
            cursor.close()
            conn.close()

            return resultado

        except Exception as e:
            print(f"[DB] Error obteniendo estado: {e}")
            return None

    @staticmethod
    def contar_completados(actividad_id):
        """Contar cuántos participantes completaron la actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()

            query = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados,
                SUM(CASE WHEN estado = 'conectado' THEN 1 ELSE 0 END) as conectados
            FROM participantes_actividad_grupo
            WHERE actividad_id = %s
            """

            cursor.execute(query, (actividad_id,))
            resultado = cursor.fetchone()
            cursor.close()
            conn.close()

            return {
                'total': resultado[0],
                'completados': resultado[1] or 0,
                'conectados': resultado[2] or 0
            }

        except Exception as e:
            print(f"[DB] Error contando participantes: {e}")
            return None
