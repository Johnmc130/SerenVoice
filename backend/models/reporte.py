# backend/models/reporte.py
from backend.database.connection import DatabaseConnection
from datetime import date

class Reporte:
    """Modelo para la tabla Reporte"""
    
    @staticmethod
    def create(id_usuario, titulo, descripcion, formato='pdf'):
        """Crear reporte"""
        query = """
            INSERT INTO Reporte (id_usuario, titulo, descripcion, fecha_creacion, formato)
            VALUES (%s, %s, %s, %s, %s)
        """
        return DatabaseConnection.execute_query(
            query,
            (id_usuario, titulo, descripcion, date.today(), formato),
            fetch=False
        )
    
    @staticmethod
    def get_by_id(id_reporte):
        """Obtener reporte por ID"""
        query = "SELECT * FROM Reporte WHERE id_reporte = %s"
        results = DatabaseConnection.execute_query(query, (id_reporte,))
        return results[0] if results else None
    
    @staticmethod
    def get_user_reports(id_usuario):
        """Obtener reportes de un usuario"""
        query = "SELECT * FROM Reporte WHERE id_usuario = %s ORDER BY fecha_creacion DESC"
        return DatabaseConnection.execute_query(query, (id_usuario,))
    
    @staticmethod
    def delete(id_reporte):
        """Eliminar reporte"""
        query = "DELETE FROM Reporte WHERE id_reporte = %s"
        DatabaseConnection.execute_query(query, (id_reporte,), fetch=False)
        return True 
