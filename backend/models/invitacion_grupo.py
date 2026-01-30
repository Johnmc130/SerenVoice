# backend/models/invitacion_grupo.py
"""Modelo para la tabla invitaciones_grupo - Sistema de invitaciones a grupos"""
from database.connection import DatabaseConnection
from datetime import datetime, timedelta


class InvitacionGrupo:
    """Modelo para gestionar invitaciones a grupos"""
    
    @staticmethod
    def crear_invitacion(id_grupo, id_usuario_invitado, id_usuario_invita, 
                         mensaje=None, rol_propuesto='participante', dias_expiracion=7):
        """
        Crear una nueva invitación a un grupo.
        
        Args:
            id_grupo: ID del grupo al que se invita
            id_usuario_invitado: ID del usuario que recibe la invitación
            id_usuario_invita: ID del usuario que envía la invitación
            mensaje: Mensaje opcional del invitador
            rol_propuesto: Rol que tendrá si acepta (default: participante)
            dias_expiracion: Días hasta que expire la invitación
            
        Returns:
            ID de la invitación creada o None si falla
        """
        fecha_expiracion = datetime.now() + timedelta(days=dias_expiracion)
        
        query = """
            INSERT INTO invitaciones_grupo 
            (id_grupo, id_usuario_invitado, id_usuario_invita, mensaje, 
             rol_propuesto, fecha_expiracion, activo)
            VALUES (%s, %s, %s, %s, %s, %s, 1)
        """
        result = DatabaseConnection.execute_query(
            query,
            (id_grupo, id_usuario_invitado, id_usuario_invita, mensaje, 
             rol_propuesto, fecha_expiracion),
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
        
        Args:
            id_usuario: ID del usuario
            limit: Límite de resultados
            
        Returns:
            Lista de invitaciones pendientes con información completa
        """
        query = """
            SELECT * FROM vista_invitaciones_grupo 
            WHERE id_usuario_invitado = %s 
              AND estado = 'pendiente'
              AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
            ORDER BY fecha_invitacion DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def get_invitaciones_enviadas_grupo(id_grupo, estado=None, limit=50):
        """
        Obtener invitaciones enviadas por un grupo.
        
        Args:
            id_grupo: ID del grupo
            estado: Filtrar por estado (None = todos)
            limit: Límite de resultados
            
        Returns:
            Lista de invitaciones del grupo
        """
        query = """
            SELECT * FROM vista_invitaciones_grupo 
            WHERE id_grupo = %s
        """
        params = [id_grupo]
        
        if estado:
            query += " AND estado = %s"
            params.append(estado)
        
        query += " ORDER BY fecha_invitacion DESC LIMIT %s"
        params.append(limit)
        
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def get_historial_usuario(id_usuario, limit=50):
        """
        Obtener historial de invitaciones de un usuario (todas, no solo pendientes).
        
        Args:
            id_usuario: ID del usuario
            limit: Límite de resultados
            
        Returns:
            Lista de todas las invitaciones del usuario
        """
        query = """
            SELECT * FROM vista_invitaciones_grupo 
            WHERE id_usuario_invitado = %s
            ORDER BY fecha_invitacion DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def tiene_invitacion_pendiente(id_grupo, id_usuario):
        """
        Verificar si un usuario ya tiene una invitación pendiente para un grupo.
        
        Args:
            id_grupo: ID del grupo
            id_usuario: ID del usuario
            
        Returns:
            La invitación pendiente si existe, None si no
        """
        query = """
            SELECT * FROM invitaciones_grupo 
            WHERE id_grupo = %s 
              AND id_usuario_invitado = %s 
              AND estado = 'pendiente'
              AND activo = 1
              AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
        """
        results = DatabaseConnection.execute_query(query, (id_grupo, id_usuario))
        return results[0] if results else None
    
    @staticmethod
    def aceptar_invitacion(id_invitacion, id_usuario):
        """
        Aceptar una invitación usando el procedimiento almacenado.
        
        Args:
            id_invitacion: ID de la invitación
            id_usuario: ID del usuario que acepta
            
        Returns:
            dict con resultado o error
        """
        try:
            query = "CALL sp_aceptar_invitacion(%s, %s)"
            result = DatabaseConnection.execute_query(query, (id_invitacion, id_usuario))
            return {'success': True, 'data': result[0] if result else None}
        except Exception as e:
            error_msg = str(e)
            return {'success': False, 'error': error_msg}
    
    @staticmethod
    def rechazar_invitacion(id_invitacion, id_usuario):
        """
        Rechazar una invitación usando el procedimiento almacenado.
        
        Args:
            id_invitacion: ID de la invitación
            id_usuario: ID del usuario que rechaza
            
        Returns:
            dict con resultado o error
        """
        try:
            query = "CALL sp_rechazar_invitacion(%s, %s)"
            result = DatabaseConnection.execute_query(query, (id_invitacion, id_usuario))
            return {'success': True, 'data': result[0] if result else None}
        except Exception as e:
            error_msg = str(e)
            return {'success': False, 'error': error_msg}
    
    @staticmethod
    def cancelar_invitacion(id_invitacion, id_usuario_cancela):
        """
        Cancelar una invitación (solo el invitador o facilitador puede cancelar).
        
        Args:
            id_invitacion: ID de la invitación
            id_usuario_cancela: ID del usuario que cancela
            
        Returns:
            True si se canceló, False si no
        """
        query = """
            UPDATE invitaciones_grupo 
            SET estado = 'cancelada', fecha_respuesta = NOW()
            WHERE id_invitacion = %s 
              AND estado = 'pendiente'
              AND (id_usuario_invita = %s OR EXISTS (
                SELECT 1 FROM grupos g 
                WHERE g.id_grupo = invitaciones_grupo.id_grupo 
                  AND g.id_facilitador = %s
              ))
        """
        result = DatabaseConnection.execute_query(
            query, 
            (id_invitacion, id_usuario_cancela, id_usuario_cancela), 
            fetch=False
        )
        return result.get('rowcount', 0) > 0
    
    @staticmethod
    def contar_invitaciones_pendientes(id_usuario):
        """
        Contar invitaciones pendientes de un usuario.
        
        Args:
            id_usuario: ID del usuario
            
        Returns:
            Número de invitaciones pendientes
        """
        query = """
            SELECT COUNT(*) as total 
            FROM invitaciones_grupo 
            WHERE id_usuario_invitado = %s 
              AND estado = 'pendiente'
              AND activo = 1
              AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
        """
        result = DatabaseConnection.execute_query(query, (id_usuario,))
        return result[0]['total'] if result else 0
    
    @staticmethod
    def expirar_invitaciones_antiguas():
        """
        Marcar como expiradas las invitaciones que han pasado su fecha límite.
        Útil para ejecutar en un job programado.
        
        Returns:
            Número de invitaciones expiradas
        """
        query = """
            UPDATE invitaciones_grupo 
            SET estado = 'expirada'
            WHERE estado = 'pendiente'
              AND fecha_expiracion IS NOT NULL
              AND fecha_expiracion < NOW()
        """
        result = DatabaseConnection.execute_query(query, fetch=False)
        return result.get('rowcount', 0)

