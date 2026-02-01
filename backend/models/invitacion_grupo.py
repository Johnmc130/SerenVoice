# backend/models/invitacion_grupo.py
"""Modelo para la tabla invitacion_grupo - Sistema de invitaciones a grupos"""
from database.connection import DatabaseConnection
from datetime import datetime, timedelta


class InvitacionGrupo:
    """Modelo para gestionar invitaciones a grupos"""
    
    @staticmethod
    def crear_invitacion(id_grupo, id_usuario_invitado, id_usuario_invita, 
                         mensaje=None, rol_propuesto='participante', dias_expiracion=7):
        """
        Crear una nueva invitación a un grupo.
        """
        # La tabla invitacion_grupo tiene: id_invitacion, id_grupo, id_invitador, id_invitado, estado, fecha_invitacion, fecha_respuesta
        query = """
            INSERT INTO invitacion_grupo 
            (id_grupo, id_invitado, id_invitador, estado)
            VALUES (%s, %s, %s, 'pendiente')
        """
        result = DatabaseConnection.execute_query(
            query,
            (id_grupo, id_usuario_invitado, id_usuario_invita),
            fetch=False
        )
        return result.get('last_id') if result else None
    
    @staticmethod
    def get_by_id(id_invitacion):
        """Obtener invitación por ID"""
        query = """
            SELECT * FROM vista_invitaciones_grupo 
            WHERE id_invitacion = %s
        """
        results = DatabaseConnection.execute_query(query, (id_invitacion,))
        return results[0] if results else None
    
    @staticmethod
    def get_invitaciones_pendientes_usuario(id_usuario, limit=50):
        """
        Obtener invitaciones pendientes para un usuario.
        Vista tiene: id_invitado (no id_usuario_invitado), estado_invitacion (no estado)
        """
        query = """
            SELECT * FROM vista_invitaciones_grupo 
            WHERE id_invitado = %s 
              AND estado_invitacion = 'pendiente'
            ORDER BY fecha_invitacion DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def get_invitaciones_enviadas_grupo(id_grupo, estado=None, limit=50):
        """
        Obtener invitaciones enviadas por un grupo.
        """
        query = """
            SELECT * FROM vista_invitaciones_grupo 
            WHERE id_grupo = %s
        """
        params = [id_grupo]
        
        if estado:
            query += " AND estado_invitacion = %s"
            params.append(estado)
        
        query += " ORDER BY fecha_invitacion DESC LIMIT %s"
        params.append(limit)
        
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def get_historial_usuario(id_usuario, limit=50):
        """
        Obtener historial de invitaciones de un usuario (todas, no solo pendientes).
        Vista tiene id_invitado (no id_usuario_invitado)
        """
        query = """
            SELECT * FROM vista_invitaciones_grupo 
            WHERE id_invitado = %s
            ORDER BY fecha_invitacion DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def tiene_invitacion_pendiente(id_grupo, id_usuario):
        """
        Verificar si un usuario ya tiene una invitación pendiente para un grupo.
        Tabla tiene: id_invitado (no id_usuario_invitado)
        """
        query = """
            SELECT * FROM invitacion_grupo 
            WHERE id_grupo = %s 
              AND id_invitado = %s 
              AND estado = 'pendiente'
        """
        results = DatabaseConnection.execute_query(query, (id_grupo, id_usuario))
        return results[0] if results else None
    
    @staticmethod
    def aceptar_invitacion(id_invitacion, id_usuario):
        """
        Aceptar una invitación.
        """
        try:
            # Primero verificar que la invitación existe y pertenece al usuario
            query_check = """
                SELECT * FROM invitacion_grupo 
                WHERE id_invitacion = %s AND id_invitado = %s AND estado = 'pendiente'
            """
            invitacion = DatabaseConnection.execute_query(query_check, (id_invitacion, id_usuario))
            
            if not invitacion:
                return {'success': False, 'error': 'Invitación no encontrada o no válida'}
            
            inv = invitacion[0]
            
            # Actualizar estado de la invitación
            query_update = """
                UPDATE invitacion_grupo 
                SET estado = 'aceptada', fecha_respuesta = NOW()
                WHERE id_invitacion = %s
            """
            DatabaseConnection.execute_query(query_update, (id_invitacion,), fetch=False)
            
            # Agregar usuario al grupo
            query_insert = """
                INSERT INTO grupo_miembros (id_grupo, id_usuario, rol_grupo, activo)
                VALUES (%s, %s, 'miembro', 1)
                ON DUPLICATE KEY UPDATE activo = 1
            """
            DatabaseConnection.execute_query(query_insert, (inv['id_grupo'], id_usuario), fetch=False)
            
            return {'success': True, 'data': {'message': 'Invitación aceptada correctamente'}}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def rechazar_invitacion(id_invitacion, id_usuario):
        """
        Rechazar una invitación.
        """
        try:
            query = """
                UPDATE invitacion_grupo 
                SET estado = 'rechazada', fecha_respuesta = NOW()
                WHERE id_invitacion = %s AND id_invitado = %s AND estado = 'pendiente'
            """
            result = DatabaseConnection.execute_query(query, (id_invitacion, id_usuario), fetch=False)
            
            if result.get('rowcount', 0) > 0:
                return {'success': True, 'data': {'message': 'Invitación rechazada'}}
            else:
                return {'success': False, 'error': 'Invitación no encontrada'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def cancelar_invitacion(id_invitacion, id_usuario_cancela):
        """
        Cancelar una invitación (solo el invitador puede cancelar).
        """
        query = """
            UPDATE invitacion_grupo 
            SET estado = 'cancelada', fecha_respuesta = NOW()
            WHERE id_invitacion = %s 
              AND estado = 'pendiente'
              AND id_invitador = %s
        """
        result = DatabaseConnection.execute_query(
            query, 
            (id_invitacion, id_usuario_cancela), 
            fetch=False
        )
        return result.get('rowcount', 0) > 0
    
    @staticmethod
    def contar_invitaciones_pendientes(id_usuario):
        """
        Contar invitaciones pendientes de un usuario.
        Tabla tiene id_invitado (no id_usuario_invitado)
        """
        query = """
            SELECT COUNT(*) as total 
            FROM invitacion_grupo 
            WHERE id_invitado = %s 
              AND estado = 'pendiente'
        """
        result = DatabaseConnection.execute_query(query, (id_usuario,))
        return result[0]['total'] if result else 0
    
    @staticmethod
    def expirar_invitaciones_antiguas():
        """
        Marcar como expiradas las invitaciones antiguas (más de 30 días).
        """
        query = """
            UPDATE invitacion_grupo 
            SET estado = 'expirada'
            WHERE estado = 'pendiente'
              AND fecha_invitacion < DATE_SUB(NOW(), INTERVAL 30 DAY)
        """
        result = DatabaseConnection.execute_query(query, fetch=False)
        return result.get('rowcount', 0)

