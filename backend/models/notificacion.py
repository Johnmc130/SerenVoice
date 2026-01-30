# backend/models/notificacion.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class Notificacion:
    """Modelo para la tabla notificaciones"""
    
    @staticmethod
    def create(id_usuario, tipo_notificacion, titulo, mensaje, **kwargs):
        """Crear una nueva notificación"""
        query = """
            INSERT INTO notificaciones 
            (id_usuario, tipo_notificacion, titulo, mensaje, icono, url_accion, 
             id_referencia, tipo_referencia, metadata, prioridad, fecha_expiracion,
             enviada_push, enviada_email)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            id_usuario,
            tipo_notificacion,
            titulo,
            mensaje,
            kwargs.get('icono'),
            kwargs.get('url_accion'),
            kwargs.get('id_referencia'),
            kwargs.get('tipo_referencia'),
            kwargs.get('metadata'),
            kwargs.get('prioridad', 'media'),
            kwargs.get('fecha_expiracion'),
            kwargs.get('enviada_push', 0),
            kwargs.get('enviada_email', 0)
        )
        return DatabaseConnection.execute_query(query, params, fetch=False)
    
    @staticmethod
    def get_by_id(id_notificacion):
        """Obtener notificación por ID"""
        query = "SELECT * FROM notificaciones WHERE id_notificacion = %s"
        results = DatabaseConnection.execute_query(query, (id_notificacion,))
        return results[0] if results else None
    
    @staticmethod
    def get_user_notifications(id_usuario, limit=50, include_read=False, only_unread=False):
        """Obtener notificaciones de un usuario"""
        conditions = ["id_usuario = %s"]
        params = [id_usuario]
        
        if only_unread:
            conditions.append("leida = 0")
        elif not include_read:
            # Usar la columna `fecha_leida` (nombre en la base de datos)
            conditions.append("(leida = 0 OR fecha_leida >= DATE_SUB(NOW(), INTERVAL 7 DAY))")
        
        conditions.append("(fecha_expiracion IS NULL OR fecha_expiracion > NOW())")
        conditions.append("archivada = 0")
        
        query = f"""
            SELECT * FROM notificaciones 
            WHERE {' AND '.join(conditions)}
            ORDER BY prioridad DESC, fecha_creacion DESC
            LIMIT %s
        """
        params.append(limit)
        
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def get_unread_count(id_usuario):
        """Contar notificaciones no leídas"""
        query = """
            SELECT COUNT(*) as count 
            FROM notificaciones 
            WHERE id_usuario = %s 
              AND leida = 0 
              AND archivada = 0
              AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
        """
        result = DatabaseConnection.execute_query(query, (id_usuario,))
        return result[0]['count'] if result else 0
    
    @staticmethod
    def mark_as_read(id_notificacion, id_usuario):
        """Marcar notificación como leída"""
        query = """
            UPDATE notificaciones 
            # Marcar como leída y registrar fecha de lectura
            SET leida = 1, fecha_leida = NOW()
            WHERE id_notificacion = %s AND id_usuario = %s
        """
        return DatabaseConnection.execute_query(query, (id_notificacion, id_usuario), fetch=False)
    
    @staticmethod
    def mark_all_as_read(id_usuario):
        """Marcar todas las notificaciones como leídas"""
        query = """
            UPDATE notificaciones 
            # Marcar todas como leídas y registrar fecha de lectura
            SET leida = 1, fecha_leida = NOW()
            WHERE id_usuario = %s AND leida = 0
        """
        return DatabaseConnection.execute_query(query, (id_usuario,), fetch=False)
    
    @staticmethod
    def archive(id_notificacion, id_usuario):
        """Archivar una notificación"""
        query = """
            UPDATE notificaciones 
            SET archivada = 1, fecha_archivado = NOW()
            WHERE id_notificacion = %s AND id_usuario = %s
        """
        return DatabaseConnection.execute_query(query, (id_notificacion, id_usuario), fetch=False)
    
    @staticmethod
    def delete(id_notificacion, id_usuario):
        """Eliminar una notificación"""
        query = """
            DELETE FROM notificaciones 
            WHERE id_notificacion = %s AND id_usuario = %s
        """
        return DatabaseConnection.execute_query(query, (id_notificacion, id_usuario), fetch=False)
    
    @staticmethod
    def get_by_type(id_usuario, tipo_notificacion, limit=20):
        """Obtener notificaciones por tipo"""
        query = """
            SELECT * FROM notificaciones 
            WHERE id_usuario = %s 
              AND tipo_notificacion = %s
              AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
            ORDER BY fecha_creacion DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, tipo_notificacion, limit))
    
    @staticmethod
    def get_urgent_notifications(id_usuario):
        """Obtener notificaciones urgentes no leídas"""
        query = """
            SELECT * FROM notificaciones 
            WHERE id_usuario = %s 
              AND leida = 0
              AND prioridad = 'urgente'
              AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
            ORDER BY fecha_creacion DESC
        """
        return DatabaseConnection.execute_query(query, (id_usuario,))
