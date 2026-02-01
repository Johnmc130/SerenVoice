# backend/models/recomendacion.py
from backend.database.connection import DatabaseConnection
from datetime import date

class Recomendacion:
    """Modelo para la tabla Recomendaciones"""
    
    @staticmethod
    def create(id_resultado, tipo, contenido):
        """Crear recomendación"""
        query = """
            INSERT INTO recomendaciones (id_resultado, tipo_recomendacion, descripcion, contenido, fecha_generacion)
            VALUES (%s, %s, %s, %s, %s)
        """
        return DatabaseConnection.execute_query(
            query,
            (id_resultado, tipo, contenido, contenido, date.today()),
            fetch=False
        )
    
    @staticmethod
    def create_multiple(recomendaciones):
        """Crear múltiples recomendaciones"""
        query = """
            INSERT INTO recomendaciones (id_resultado, tipo_recomendacion, descripcion, contenido, fecha_generacion)
            VALUES (%s, %s, %s, %s, %s)
        """
        params_list = [
            (r['id_resultado'], r['tipo_recomendacion'], r['contenido'], r['contenido'], date.today())
            for r in recomendaciones
        ]
        # Usar el pool de conexiones para ejecutar ejecutemany de forma segura
        conn = None
        cursor = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            cursor.executemany(query, params_list)
            conn.commit()
            return cursor.rowcount
        finally:
            if cursor:
                try:
                    cursor.close()
                except Exception:
                    pass
            if conn:
                try:
                    DatabaseConnection.return_connection(conn)
                except Exception:
                    pass
    
    @staticmethod
    def get_by_result(id_resultado):
        """Obtener recomendaciones de un resultado"""
        query = "SELECT * FROM recomendaciones WHERE id_resultado = %s AND activo = 1"
        return DatabaseConnection.execute_query(query, (id_resultado,))
    
    @staticmethod
    def get_by_id(id_recomendacion):
        """Obtener recomendación por ID"""
        query = "SELECT * FROM recomendaciones WHERE id_recomendacion = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (id_recomendacion,))
        return results[0] if results else None
    
    @staticmethod
    def get_recent_by_user(id_usuario, days=7, limit=10):
        """Obtener recomendaciones recientes de un usuario para evitar repetición
        
        Args:
            id_usuario: ID del usuario
            days: Días hacia atrás para buscar
            limit: Máximo de recomendaciones a retornar
        
        Returns:
            list: Recomendaciones recientes del usuario
        """
        # Query a través de la cadena audio -> analisis -> resultado_analisis -> recomendaciones
        query = """
            SELECT r.* FROM recomendaciones r
            JOIN resultado_analisis ra ON r.id_resultado = ra.id_resultado
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s
              AND r.fecha_generacion >= DATE_SUB(NOW(), INTERVAL %s DAY)
              AND r.activo = 1
            ORDER BY r.fecha_generacion DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, days, limit))