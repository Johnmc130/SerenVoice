# backend/services/notificaciones_service.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class NotificacionesService:
    
    @staticmethod
    def crear_notificacion(id_usuario, tipo_notificacion, titulo, mensaje, 
                          prioridad='media', url_accion=None, 
                          id_referencia=None, tipo_referencia=None):
        """
        Crear una nueva notificación para un usuario
        """
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            print(f"\n{'='*50}")
            print(f"📝 CREANDO NOTIFICACIÓN:")
            print(f"   Usuario ID: {id_usuario}")
            print(f"   Tipo: {tipo_notificacion}")
            print(f"   Título: {titulo}")
            print(f"   Mensaje: {mensaje}")
            print(f"   Prioridad: {prioridad}")
            print(f"{'='*50}\n")
            
            cursor.execute("""
                INSERT INTO notificaciones 
                (id_usuario, tipo_notificacion, titulo, mensaje, prioridad, 
                 url_accion, id_referencia, tipo_referencia, leida, fecha_creacion)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, FALSE, NOW())
            """, (
                id_usuario, 
                tipo_notificacion, 
                titulo, 
                mensaje, 
                prioridad,
                url_accion,
                id_referencia,
                tipo_referencia
            ))
            
            conn.commit()
            notificacion_id = cursor.lastrowid
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            print(f"✅ Notificación creada con ID: {notificacion_id}\n")
            
            return notificacion_id
            
        except Exception as e:
            print(f"❌ ERROR creando notificación: {str(e)}\n")
            import traceback
            print(traceback.format_exc())
            return None
    
    @staticmethod
    def obtener_notificaciones_usuario(id_usuario, tipo=None, limit=50, only_unread=False):
        """
        Obtener notificaciones de un usuario
        """
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = "SELECT * FROM notificaciones WHERE id_usuario = %s"
            params = [id_usuario]
            
            if tipo:
                query += " AND tipo_notificacion = %s"
                params.append(tipo)
            
            if only_unread:
                query += " AND leida = FALSE"
            
            query += " ORDER BY fecha_creacion DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            notificaciones = cursor.fetchall()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return notificaciones
            
        except Exception as e:
            print(f"Error obteniendo notificaciones: {e}")
            return []
    
    @staticmethod
    def obtener_contador_no_leidas(id_usuario):
        """
        Obtener contador de notificaciones no leídas
        """
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM notificaciones 
                WHERE id_usuario = %s AND leida = FALSE
            """, (id_usuario,))
            
            result = cursor.fetchone()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return result[0] if result else 0
            
        except Exception as e:
            print(f"Error contando notificaciones: {e}")
            return 0
    
    @staticmethod
    def marcar_como_leida(id_notificacion, id_usuario):
        """
        Marcar notificación como leída
        """
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE notificaciones 
                SET leida = TRUE, fecha_lectura = NOW()
                WHERE id_notificacion = %s AND id_usuario = %s
            """, (id_notificacion, id_usuario))
            
            conn.commit()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return True
            
        except Exception as e:
            print(f"Error marcando como leída: {e}")
            return False
    
    @staticmethod
    def marcar_todas_como_leidas(id_usuario):
        """
        Marcar todas las notificaciones como leídas
        """
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE notificaciones 
                SET leida = TRUE, fecha_lectura = NOW()
                WHERE id_usuario = %s AND leida = FALSE
            """, (id_usuario,))
            
            conn.commit()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return True
            
        except Exception as e:
            print(f"Error marcando todas como leídas: {e}")
            return False
    
    @staticmethod
    def eliminar_notificacion(id_notificacion, id_usuario):
        """
        Eliminar una notificación
        """
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                DELETE FROM notificaciones 
                WHERE id_notificacion = %s AND id_usuario = %s
            """, (id_notificacion, id_usuario))
            
            conn.commit()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return True
            
        except Exception as e:
            print(f"Error eliminando notificación: {e}")
            return False