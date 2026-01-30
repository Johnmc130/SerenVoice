# backend/models/grupo_miembro.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class GrupoMiembro:
    """Modelo para la tabla grupo_miembros"""
    
    @staticmethod
    def add_member(id_grupo, id_usuario, rol_grupo='participante', permisos_especiales=None):
        """Agregar un miembro a un grupo"""
        # Insertar miembro marcándolo como activo y con estado 'activo'
        query = """
            INSERT INTO grupo_miembros 
            (id_grupo, id_usuario, rol_grupo, permisos_especiales, activo, estado, fecha_ingreso)
            VALUES (%s, %s, %s, %s, 1, 'activo', NOW())
        """
        return DatabaseConnection.execute_query(
            query,
            (id_grupo, id_usuario, rol_grupo, permisos_especiales),
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
            WHERE gm.id_grupo = %s AND gm.activo = 1
        """
        params = [id_grupo]
        
        if estado:
            query += " AND gm.estado = %s"
            params.append(estado)
        
        query += " ORDER BY gm.fecha_ingreso DESC"
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def get_user_groups(id_usuario, estado='activo'):
        """Obtener grupos de un usuario usando vista optimizada"""
        query = """
            SELECT * FROM vista_participacion_grupos 
            WHERE id_usuario = %s
        """
        params = [id_usuario]
        
        if estado:
            query += " AND estado = %s"
            params.append(estado)
        
        query += " ORDER BY fecha_ingreso DESC"
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def is_member(id_grupo, id_usuario):
        """Verificar si un usuario es miembro del grupo"""
        query = """
            SELECT * FROM grupo_miembros 
            WHERE id_grupo = %s AND id_usuario = %s AND activo = 1
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
            SET activo = 0, fecha_salida = NOW(), estado = 'inactivo'
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
            WHERE id_grupo = %s AND activo = 1 AND estado = 'activo'
        """
        result = DatabaseConnection.execute_query(query, (id_grupo,))
        return result[0]['total'] if result else 0
