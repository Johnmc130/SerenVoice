# backend/models/juego_terapeutico.py
from backend.database.connection import DatabaseConnection

class JuegoTerapeutico:
    """Modelo para la tabla juegos_terapeuticos"""
    
    @staticmethod
    def get_by_id(id_juego):
        """Obtener juego por ID"""
        query = "SELECT * FROM juegos_terapeuticos WHERE id_juego = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (id_juego,))
        return results[0] if results else None
    
    @staticmethod
    def get_all(tipo_juego=None, objetivo_emocional=None):
        """Obtener todos los juegos con filtros opcionales"""
        query = "SELECT * FROM juegos_terapeuticos WHERE activo = 1"
        params = []
        
        if tipo_juego:
            query += " AND tipo_juego = %s"
            params.append(tipo_juego)
        
        if objetivo_emocional:
            query += " AND objetivo_emocional = %s"
            params.append(objetivo_emocional)
        
        query += " ORDER BY nombre"
        
        if params:
            return DatabaseConnection.execute_query(query, tuple(params))
        return DatabaseConnection.execute_query(query)
    
    @staticmethod
    def get_by_tipo(tipo_juego):
        """Obtener juegos por tipo"""
        query = "SELECT * FROM juegos_terapeuticos WHERE tipo_juego = %s AND activo = 1"
        return DatabaseConnection.execute_query(query, (tipo_juego,))
    
    @staticmethod
    def get_by_objetivo(objetivo_emocional):
        """Obtener juegos por objetivo emocional"""
        query = "SELECT * FROM juegos_terapeuticos WHERE objetivo_emocional = %s AND activo = 1"
        return DatabaseConnection.execute_query(query, (objetivo_emocional,))
    
    @staticmethod
    def create(nombre, tipo_juego, descripcion=None, objetivo_emocional=None, 
               duracion_recomendada=None, icono=None):
        """Crear nuevo juego terapéutico"""
        query = """
            INSERT INTO juegos_terapeuticos 
            (nombre, tipo_juego, descripcion, objetivo_emocional, duracion_recomendada, icono)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        return DatabaseConnection.execute_query(
            query, 
            (nombre, tipo_juego, descripcion, objetivo_emocional, duracion_recomendada, icono),
            fetch=False
        )
    
    @staticmethod
    def update(id_juego, **kwargs):
        """Actualizar juego"""
        allowed_fields = ['nombre', 'tipo_juego', 'descripcion', 'objetivo_emocional', 
                         'duracion_recomendada', 'icono', 'activo']
        
        updates = []
        values = []
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                updates.append(f"{field} = %s")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(id_juego)
        query = f"UPDATE juegos_terapeuticos SET {', '.join(updates)} WHERE id_juego = %s"
        DatabaseConnection.execute_query(query, tuple(values), fetch=False)
        return True
    
    @staticmethod
    def delete(id_juego):
        """Eliminar juego (soft delete)"""
        query = "UPDATE juegos_terapeuticos SET activo = 0 WHERE id_juego = %s"
        DatabaseConnection.execute_query(query, (id_juego,), fetch=False)
        return True
