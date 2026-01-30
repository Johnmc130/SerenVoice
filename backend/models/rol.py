# backend/models/rol.py
from backend.database.connection import DatabaseConnection

class Rol:
    """Modelo para la tabla rol"""
    
    @staticmethod
    def create(nombre_rol, descripcion=None):
        """Crear nuevo rol"""
        query = "INSERT INTO rol (nombre_rol, descripcion) VALUES (%s, %s)"
        return DatabaseConnection.execute_query(query, (nombre_rol, descripcion), fetch=False)
    
    @staticmethod
    def get_all(activo=True):
        """Obtener todos los roles"""
        query = "SELECT * FROM rol"
        if activo is not None:
            query += " WHERE activo = %s"
            return DatabaseConnection.execute_query(query, (activo,))
        return DatabaseConnection.execute_query(query)
    
    @staticmethod
    def get_by_id(id_rol):
        """Obtener rol por ID"""
        query = "SELECT * FROM rol WHERE id_rol = %s"
        results = DatabaseConnection.execute_query(query, (id_rol,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_name(nombre_rol):
        """Obtener rol por nombre"""
        query = "SELECT * FROM rol WHERE nombre_rol = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (nombre_rol,))
        return results[0] if results else None
    
    @staticmethod
    def update(id_rol, nombre_rol=None, descripcion=None):
        """Actualizar rol"""
        updates = []
        params = []
        
        if nombre_rol:
            updates.append("nombre_rol = %s")
            params.append(nombre_rol)
        if descripcion is not None:
            updates.append("descripcion = %s")
            params.append(descripcion)
        
        if not updates:
            return False
        
        params.append(id_rol)
        query = f"UPDATE rol SET {', '.join(updates)} WHERE id_rol = %s"
        DatabaseConnection.execute_query(query, tuple(params), fetch=False)
        return True
    
    @staticmethod
    def delete(id_rol):
        """Eliminar rol (soft delete)"""
        query = "UPDATE rol SET activo = 0 WHERE id_rol = %s"
        DatabaseConnection.execute_query(query, (id_rol,), fetch=False)
        return True