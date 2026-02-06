# backend/models/rol_usuario.py
from backend.database.connection import DatabaseConnection
from datetime import datetime

class RolUsuario:
    """Modelo para la tabla rol_usuario"""
    
    @staticmethod
    def assign_role(id_usuario, id_rol, id_admin_asigna=None):
        """Asignar rol a usuario"""
        query = """
            INSERT INTO rol_usuario (id_usuario, id_rol, id_admin_asigna, fecha_creacion)
            VALUES (%s, %s, %s, NOW())
        """
        return DatabaseConnection.execute_query(
            query, 
            (id_usuario, id_rol, id_admin_asigna),
            fetch=False
        )
    
    @staticmethod
    def remove_role(id_usuario, id_rol):
        """Remover rol de usuario"""
        query = "DELETE FROM rol_usuario WHERE id_usuario = %s AND id_rol = %s"
        DatabaseConnection.execute_query(query, (id_usuario, id_rol), fetch=False)
        return True
    
    @staticmethod
    def get_user_roles(id_usuario):
        """Obtener roles de un usuario"""
        query = """
            SELECT r.*, ru.fecha_creacion, ru.fecha_modificacion
            FROM rol r
            JOIN rol_usuario ru ON r.id_rol = ru.id_rol
            WHERE ru.id_usuario = %s AND r.activo = 1
        """
        return DatabaseConnection.execute_query(query, (id_usuario,))
    
    @staticmethod
    def get_users_by_role(id_rol):
        """Obtener usuarios con un rol específico"""
        query = """
            SELECT u.*, ru.fecha_creacion, ru.fecha_modificacion
            FROM usuario u
            JOIN rol_usuario ru ON u.id_usuario = ru.id_usuario
            WHERE ru.id_rol = %s AND u.activo = 1
            ORDER BY ru.fecha_creacion DESC
        """
        return DatabaseConnection.execute_query(query, (id_rol,))
    
    @staticmethod
    def has_role(id_usuario, nombre_rol):
        """Verificar si un usuario tiene un rol específico"""
        query = """
            SELECT COUNT(*) as count
            FROM rol_usuario ru
            JOIN rol r ON ru.id_rol = r.id_rol
            WHERE ru.id_usuario = %s AND r.nombre_rol = %s AND r.activo = 1
        """
        result = DatabaseConnection.execute_query(query, (id_usuario, nombre_rol))
        return result[0]['count'] > 0 if result else False
    
    @staticmethod
    def update_modification_date(id_usuario, id_rol):
        """Actualizar fecha de modificación de una asignación"""
        query = """
            UPDATE rol_usuario 
            SET fecha_modificacion = NOW()
            WHERE id_usuario = %s AND id_rol = %s
        """
        DatabaseConnection.execute_query(query, (id_usuario, id_rol), fetch=False)
        return True
    
    @staticmethod
    def get_all_assignments():
        """Obtener todas las asignaciones de roles con información del usuario y admin"""
        query = """
            SELECT ru.*, 
                   u.nombre as usuario_nombre, u.apellido as usuario_apellido, u.correo as usuario_correo,
                   r.nombre_rol, r.descripcion as rol_descripcion,
                   admin.nombre as admin_nombre, admin.apellido as admin_apellido
            FROM rol_usuario ru
            JOIN usuario u ON ru.id_usuario = u.id_usuario
            JOIN rol r ON ru.id_rol = r.id_rol
            LEFT JOIN usuario admin ON ru.id_admin_asigna = admin.id_usuario
            WHERE r.activo = 1 AND u.activo = 1
            ORDER BY ru.fecha_creacion DESC
        """
        return DatabaseConnection.execute_query(query)
