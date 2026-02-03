# backend/models/grupo.py
from backend.database.connection import DatabaseConnection
from datetime import datetime
import random
import string

class Grupo:
    """Modelo para la tabla grupos"""
    
    @staticmethod
    def create(nombre_grupo, id_facilitador, descripcion=None, tipo_grupo='apoyo', 
               privacidad='privado', max_participantes=None, fecha_inicio=None, fecha_fin=None):
        """Crear un nuevo grupo terapéutico"""
        # Generar código de acceso único
        codigo_acceso = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        # Convertir privacidad a es_privado (1 = privado, 0 = publico)
        es_privado = 1 if privacidad == 'privado' else 0
        
        # La tabla usa id_creador, codigo_invitacion, es_privado, max_miembros
        query = """
            INSERT INTO grupos 
            (nombre_grupo, descripcion, codigo_invitacion, id_creador, tipo_grupo, 
             es_privado, max_miembros)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        return DatabaseConnection.execute_query(
            query, 
            (nombre_grupo, descripcion, codigo_acceso, id_facilitador, tipo_grupo, 
             es_privado, max_participantes),
            fetch=False
        )
    
    @staticmethod
    def get_by_id(id_grupo):
        """Obtener grupo por ID"""
        query = """
            SELECT g.*, g.id_creador AS id_facilitador,
                   g.codigo_invitacion AS codigo_acceso,
                   CASE WHEN g.es_privado = 1 THEN 'privado' ELSE 'publico' END AS privacidad,
                   g.max_miembros AS max_participantes
            FROM grupos g
            WHERE g.id_grupo = %s AND g.activo = 1
        """
        results = DatabaseConnection.execute_query(query, (id_grupo,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_codigo(codigo_acceso):
        """Obtener grupo por código de acceso"""
        query = "SELECT * FROM grupos WHERE codigo_invitacion = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (codigo_acceso,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_facilitador(id_facilitador):
        """Obtener todos los grupos de un facilitador"""
        query = """
            SELECT * FROM grupos 
            WHERE id_facilitador = %s AND activo = 1 
            ORDER BY fecha_creacion DESC
        """
        return DatabaseConnection.execute_query(query, (id_facilitador,))
    
    @staticmethod
    def get_all(tipo_grupo=None, privacidad=None):
        """Obtener todos los grupos con filtros opcionales"""
        query = "SELECT * FROM grupos WHERE activo = 1"
        params = []
        
        if tipo_grupo:
            query += " AND tipo_grupo = %s"
            params.append(tipo_grupo)
        
        if privacidad:
            query += " AND privacidad = %s"
            params.append(privacidad)
        
        query += " ORDER BY fecha_creacion DESC"
        
        if params:
            return DatabaseConnection.execute_query(query, tuple(params))
        return DatabaseConnection.execute_query(query)
    
    @staticmethod
    def get_estadisticas(id_grupo=None):
        """Obtener estadísticas usando la vista optimizada"""
        if id_grupo:
            query = "SELECT * FROM vista_grupos_estadisticas WHERE id_grupo = %s"
            results = DatabaseConnection.execute_query(query, (id_grupo,))
            return results[0] if results else None
        else:
            query = "SELECT * FROM vista_grupos_estadisticas ORDER BY fecha_creacion DESC"
            return DatabaseConnection.execute_query(query)
    
    @staticmethod
    def update(id_grupo, **kwargs):
        """Actualizar grupo"""
        # Mapear campos del request a columnas de la base de datos
        field_mapping = {
            'nombre_grupo': 'nombre_grupo',
            'descripcion': 'descripcion',
            'tipo_grupo': 'tipo_grupo',
            'privacidad': 'es_privado',  # Convertir a booleano
            'max_participantes': 'max_miembros',
        }
        
        updates = []
        values = []
        
        for field, value in kwargs.items():
            if field in field_mapping:
                db_field = field_mapping[field]
                # Convertir privacidad a es_privado (1 = privado, 0 = publico)
                if field == 'privacidad':
                    value = 1 if value == 'privado' else 0
                updates.append(f"{db_field} = %s")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(id_grupo)
        query = f"UPDATE grupos SET {', '.join(updates)} WHERE id_grupo = %s"
        DatabaseConnection.execute_query(query, tuple(values), fetch=False)
        return True
    
    @staticmethod
    def delete(id_grupo):
        """Eliminar grupo (soft delete)"""
        query = "UPDATE grupos SET activo = 0 WHERE id_grupo = %s"
        DatabaseConnection.execute_query(query, (id_grupo,), fetch=False)
        return True
    
    @staticmethod
    def verify_max_participantes(id_grupo):
        """Verificar si el grupo ha alcanzado su límite de participantes"""
        grupo = Grupo.get_by_id(id_grupo)
        if not grupo or not grupo.get('max_miembros'):
            return True  # Sin límite
        
        query = """
            SELECT COUNT(*) as total 
            FROM grupo_miembros 
            WHERE id_grupo = %s AND estado = 'activo'
        """
        result = DatabaseConnection.execute_query(query, (id_grupo,))
        total = result[0]['total'] if result else 0
        
        return total < grupo['max_miembros']
