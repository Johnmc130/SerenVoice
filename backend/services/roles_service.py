# backend/services/roles_service.py
from backend.models.rol import Rol
from backend.models.rol_usuario import RolUsuario

class RolesService:
    """Servicio de gestión de roles"""
    
    @staticmethod
    def get_all_roles():
        """Obtener todos los roles"""
        return Rol.get_all()
    
    @staticmethod
    def get_role_by_id(id_rol):
        """Obtener rol por ID"""
        return Rol.get_by_id(id_rol)
    
    @staticmethod
    def get_role_by_name(nombre_rol):
        """Obtener rol por nombre"""
        return Rol.get_by_name(nombre_rol)
    
    @staticmethod
    def create_role(nombre_rol, descripcion=None):
        """
        Crear nuevo rol
        
        Args:
            nombre_rol: Nombre del rol
            descripcion: Descripción del rol
        
        Returns:
            dict: Resultado de la operación
        """
        # Verificar si el rol ya existe
        existing_rol = Rol.get_by_name(nombre_rol)
        if existing_rol:
            return {'success': False, 'error': 'El rol ya existe'}
        
        id_rol = Rol.create(nombre_rol, descripcion)
        
        if id_rol:
            return {
                'success': True,
                'message': 'Rol creado exitosamente',
                'id_rol': id_rol
            }
        
        return {'success': False, 'error': 'Error al crear rol'}
    
    @staticmethod
    def update_role(id_rol, nombre_rol=None, descripcion=None):
        """
        Actualizar rol
        
        Args:
            id_rol: ID del rol
            nombre_rol: Nuevo nombre del rol (opcional)
            descripcion: Nueva descripción (opcional)
        
        Returns:
            dict: Resultado de la operación
        """
        rol = Rol.get_by_id(id_rol)
        if not rol:
            return {'success': False, 'error': 'Rol no encontrado'}
        
        if Rol.update(id_rol, nombre_rol, descripcion):
            return {'success': True, 'message': 'Rol actualizado exitosamente'}
        
        return {'success': False, 'error': 'Error al actualizar rol'}
    
    @staticmethod
    def delete_role(id_rol):
        """
        Eliminar rol
        
        Args:
            id_rol: ID del rol
        
        Returns:
            dict: Resultado de la operación
        """
        # Verificar que no sea un rol del sistema (admin o usuario)
        rol = Rol.get_by_id(id_rol)
        if not rol:
            return {'success': False, 'error': 'Rol no encontrado'}
        
        if rol['nombre_rol'] in ['admin', 'usuario']:
            return {'success': False, 'error': 'No se pueden eliminar roles del sistema'}
        
        if Rol.delete(id_rol):
            return {'success': True, 'message': 'Rol eliminado exitosamente'}
        
        return {'success': False, 'error': 'Error al eliminar rol'}
    
    @staticmethod
    def assign_role_to_user(id_usuario, id_rol):
        """
        Asignar rol a usuario
        
        Args:
            id_usuario: ID del usuario
            id_rol: ID del rol
        
        Returns:
            dict: Resultado de la operación
        """
        try:
            RolUsuario.assign_role(id_usuario, id_rol)
            return {'success': True, 'message': 'Rol asignado exitosamente'}
        except Exception as e:
            return {'success': False, 'error': f'Error al asignar rol: {str(e)}'}
    
    @staticmethod
    def remove_role_from_user(id_usuario, id_rol):
        """
        Remover rol de usuario
        
        Args:
            id_usuario: ID del usuario
            id_rol: ID del rol
        
        Returns:
            dict: Resultado de la operación
        """
        if RolUsuario.remove_role(id_usuario, id_rol):
            return {'success': True, 'message': 'Rol removido exitosamente'}
        
        return {'success': False, 'error': 'Error al remover rol'}
    
    @staticmethod
    def get_user_roles(id_usuario):
        """Obtener roles de un usuario"""
        return RolUsuario.get_user_roles(id_usuario)
    
    @staticmethod
    def get_users_by_role(id_rol):
        """Obtener usuarios con un rol específico"""
        return RolUsuario.get_users_by_role(id_rol)
    
    @staticmethod
    def get_role_statistics():
        """
        Obtener estadísticas de roles
        
        Returns:
            dict: Estadísticas de roles
        """
        from database.connection import DatabaseConnection
        
        query = """
            SELECT r.nombre_rol, r.descripcion, COUNT(ru.id_usuario) as total_usuarios
            FROM rol r
            LEFT JOIN rol_usuario ru ON r.id_rol = ru.id_rol
            GROUP BY r.id_rol, r.nombre_rol, r.descripcion
        """
        
        return DatabaseConnection.execute_query(query)