# backend/models/grupo_miembro.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class GrupoMiembro:
    """Modelo para la tabla grupo_miembros - Corregido para coincidir con esquema Railway"""
    
    @staticmethod
    def add_member(id_grupo, id_usuario, rol_grupo='miembro', permisos_especiales=None):
        """Agregar un miembro a un grupo"""
        # La tabla Railway usa ENUM('admin', 'moderador', 'miembro', 'participante', 'facilitador')
        # Mantener facilitador como rol válido (no convertir a admin)
        # Solo normalizar participante a miembro
        if rol_grupo == 'participante':
            rol_grupo = 'miembro'
        
        # Roles válidos: admin, moderador, miembro, facilitador, co_facilitador
        valid_roles = ['admin', 'moderador', 'miembro', 'facilitador', 'co_facilitador']
        if rol_grupo not in valid_roles:
            rol_grupo = 'miembro'
        
        query = """
            INSERT INTO grupo_miembros 
            (id_grupo, id_usuario, rol_grupo, fecha_ingreso, estado)
            VALUES (%s, %s, %s, NOW(), 'activo')
        """
        return DatabaseConnection.execute_query(
            query,
            (id_grupo, id_usuario, rol_grupo),
            fetch=False
        )
    
    @staticmethod
    def get_by_id(id_grupo_miembro):
        """Obtener miembro por ID"""
        query = "SELECT * FROM grupo_miembros WHERE id_grupo_miembro = %s"
        results = DatabaseConnection.execute_query(query, (id_grupo_miembro,))
        return results[0] if results else None
    
    @staticmethod
    def get_group_members(id_grupo, estado='activo'):
        """Obtener todos los miembros de un grupo"""
        query = """
            SELECT gm.*, u.nombre, u.apellido, u.correo, u.foto_perfil
            FROM grupo_miembros gm
            JOIN usuario u ON gm.id_usuario = u.id_usuario
            WHERE gm.id_grupo = %s AND gm.estado = 'activo'
        """
        params = [id_grupo]
        
        query += " ORDER BY gm.fecha_ingreso DESC"
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def get_user_groups(id_usuario, estado='activo'):
        """Obtener grupos de un usuario con información completa"""
        query = """
            SELECT 
                g.id_grupo,
                g.nombre_grupo,
                g.descripcion,
                g.id_creador,
                g.codigo_invitacion as codigo_acceso,
                g.es_privado,
                g.max_miembros as max_participantes,
                g.fecha_creacion,
                g.activo,
                gm.id_grupo_miembro,
                gm.rol_grupo,
                gm.estado as estado_miembro,
                gm.fecha_ingreso,
                u.nombre as nombre_creador,
                u.apellido as apellido_creador,
                (SELECT COUNT(*) FROM grupo_miembros gm2 WHERE gm2.id_grupo = g.id_grupo AND gm2.estado = 'activo') as total_miembros
            FROM grupo_miembros gm
            JOIN grupos g ON gm.id_grupo = g.id_grupo
            LEFT JOIN usuario u ON g.id_creador = u.id_usuario
            WHERE gm.id_usuario = %s AND g.activo = 1
        """
        params = [id_usuario]
        
        if estado:
            query += " AND gm.estado = %s"
            params.append(estado)
        
        query += " ORDER BY gm.fecha_ingreso DESC"
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def is_member(id_grupo, id_usuario):
        """Verificar si un usuario es miembro del grupo"""
        query = """
            SELECT * FROM grupo_miembros 
            WHERE id_grupo = %s AND id_usuario = %s AND estado = 'activo'
        """
        results = DatabaseConnection.execute_query(query, (id_grupo, id_usuario))
        return results[0] if results else None
    
    @staticmethod
    def update_rol(id_grupo_miembro, nuevo_rol):
        """Actualizar rol de un miembro"""
        query = "UPDATE grupo_miembros SET rol_grupo = %s WHERE id_grupo_miembro = %s"
        DatabaseConnection.execute_query(query, (nuevo_rol, id_grupo_miembro), fetch=False)
        return True
    
    @staticmethod
    def update_estado(id_grupo_miembro, nuevo_estado):
        """Actualizar estado de un miembro"""
        query = "UPDATE grupo_miembros SET estado = %s WHERE id_grupo_miembro = %s"
        DatabaseConnection.execute_query(query, (nuevo_estado, id_grupo_miembro), fetch=False)
        return True
    
    @staticmethod
    def remove_member(id_grupo, id_usuario):
        """Remover miembro de un grupo (soft delete)"""
        query = """
            UPDATE grupo_miembros 
            SET estado = 'inactivo', fecha_salida = NOW()
            WHERE id_grupo = %s AND id_usuario = %s
        """
        DatabaseConnection.execute_query(query, (id_grupo, id_usuario), fetch=False)
        return True
    
    @staticmethod
    def get_member_stats(id_grupo, id_usuario):
        """Obtener estadísticas de participación de un miembro"""
        query = """
            SELECT * FROM vista_participacion_grupos 
            WHERE id_grupo = %s AND id_usuario = %s
        """
        results = DatabaseConnection.execute_query(query, (id_grupo, id_usuario))
        return results[0] if results else None
    
    @staticmethod
    def count_active_members(id_grupo):
        """Contar miembros activos en un grupo"""
        query = """
            SELECT COUNT(*) as total 
            FROM grupo_miembros 
            WHERE id_grupo = %s AND estado = 'activo'
        """
        result = DatabaseConnection.execute_query(query, (id_grupo,))
        return result[0]['total'] if result else 0
