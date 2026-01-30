"""
Modelo: NotificacionActividad
Descripción: Control de notificaciones enviadas a usuarios para actividades grupales
"""

from backend.database.connection import DatabaseConnection


class NotificacionActividad:
    """Gestión de notificaciones de actividades grupales"""

    @staticmethod
    def crear(usuario_id, tipo_notificacion, titulo, mensaje, icono=None, url_accion=None, 
              id_referencia=None, tipo_referencia=None, prioridad='media', metadata=None):
        """
        Crear una notificación
        
        Args:
            usuario_id: ID del usuario que recibe la notificación
            tipo_notificacion: Tipo de notificación (invitacion_grupo, actividad_grupo, etc)
            titulo: Título de la notificación
            mensaje: Texto del mensaje
            icono: Emoji o clase CSS (opcional)
            url_accion: URL para redirigir (opcional)
            id_referencia: ID del objeto relacionado (opcional)
            tipo_referencia: Tipo del objeto relacionado (grupo, actividad, etc)
            prioridad: Prioridad (baja, media, alta, urgente)
            metadata: JSON con datos adicionales (opcional)
            
        Returns:
            ID de la notificación creada o None
        """
        try:
            query = """
            INSERT INTO notificaciones 
            (id_usuario, tipo_notificacion, titulo, mensaje, icono, url_accion, 
             id_referencia, tipo_referencia, prioridad, metadata, leida, activo)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, 1)
            """

            result = DatabaseConnection.execute_query(
                query, 
                (usuario_id, tipo_notificacion, titulo, mensaje, icono, url_accion,
                 id_referencia, tipo_referencia, prioridad, metadata),
                fetch=False
            )
            
            return result.get('last_id')

        except Exception as e:
            print(f"[DB] Error creando notificación: {e}")
            raise

    @staticmethod
    def obtener_sin_leer(usuario_id):
        """Obtener notificaciones no leídas de un usuario"""
        try:
            query = """
            SELECT id_notificacion, id_usuario, tipo_notificacion, titulo, mensaje,
                   icono, url_accion, id_referencia, tipo_referencia, prioridad,
                   fecha_creacion, leida, archivada
            FROM notificaciones
            WHERE id_usuario = %s AND leida = 0 AND archivada = 0 AND activo = 1
            ORDER BY fecha_creacion DESC
            LIMIT 50
            """

            notificaciones = DatabaseConnection.execute_query(query, (usuario_id,))
            return notificaciones if notificaciones else []

        except Exception as e:
            print(f"[DB] Error obteniendo notificaciones: {e}")
            return []

    @staticmethod
    def marcar_leida(notificacion_id, usuario_id=None):
        """Marcar una notificación como leída"""
        try:
            query = """
            UPDATE notificaciones
            SET leida = 1, fecha_leida = NOW()
            WHERE id_notificacion = %s AND activo = 1
            """

            DatabaseConnection.execute_query(query, (notificacion_id,), fetch=False)
            return True

        except Exception as e:
            print(f"[DB] Error marcando notificación como leída: {e}")
            return False

    @staticmethod
    def marcar_todas_leidas(usuario_id):
        """Marcar todas las notificaciones como leídas"""
        try:
            query = """
            UPDATE notificaciones
            SET leida = 1, fecha_leida = NOW()
            WHERE id_usuario = %s AND leida = 0 AND activo = 1
            """

            DatabaseConnection.execute_query(query, (usuario_id,), fetch=False)
            return True

        except Exception as e:
            print(f"[DB] Error marcando notificaciones como leídas: {e}")
            return False
    
    @staticmethod
    def archivar(notificacion_id):
        """Archivar una notificación"""
        try:
            query = """
            UPDATE notificaciones
            SET archivada = 1, fecha_archivado = NOW()
            WHERE id_notificacion = %s AND activo = 1
            """

            DatabaseConnection.execute_query(query, (notificacion_id,), fetch=False)
            return True

        except Exception as e:
            print(f"[DB] Error archivando notificación: {e}")
            return False
