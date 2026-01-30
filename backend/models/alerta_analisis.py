# backend/models/alerta_analisis.py
from backend.database.connection import DatabaseConnection
from datetime import date

class AlertaAnalisis:
    """Modelo para la tabla alerta_analisis"""
    
    @staticmethod
    def create(id_resultado, tipo_alerta, tipo_recomendacion, titulo, descripcion, contexto=None):
        """Crear alerta"""
        query = """
            INSERT INTO alerta_analisis 
            (id_resultado, tipo_alerta, tipo_recomendacion, titulo, descripcion, contexto, fecha)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        return DatabaseConnection.execute_query(
            query,
            (id_resultado, tipo_alerta, tipo_recomendacion, titulo, descripcion, contexto, date.today()),
            fetch=False
        )
    
    @staticmethod
    def get_by_id(id_alerta):
        """Obtener alerta por ID"""
        query = "SELECT * FROM alerta_analisis WHERE id_alerta = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (id_alerta,))
        return results[0] if results else None
    
    @staticmethod
    def get_active_alerts(tipo_alerta=None):
        """Obtener alertas activas con todos los campos necesarios"""
        query = """
            SELECT 
                al.*,
                u.nombre,
                u.apellido,
                u.correo,
                ra.nivel_estres,
                ra.nivel_ansiedad,
                ra.clasificacion,
                ra.emocion_dominante
            FROM alerta_analisis al
            JOIN resultado_analisis ra ON al.id_resultado = ra.id_resultado
            JOIN analisis an ON ra.id_analisis = an.id_analisis
            JOIN audio au ON an.id_audio = au.id_audio
            JOIN usuario u ON au.id_usuario = u.id_usuario
            WHERE al.activo = 1
        """
        params = []
        
        if tipo_alerta:
            query += " AND al.tipo_alerta = %s"
            params.append(tipo_alerta)
        
        query += " ORDER BY al.fecha DESC"
        
        if params:
            return DatabaseConnection.execute_query(query, tuple(params))
        return DatabaseConnection.execute_query(query)
    
    @staticmethod
    def get_critical_alerts():
        """Obtener solo alertas críticas con todos los campos necesarios"""
        query = """
            SELECT 
                al.*,
                u.nombre,
                u.apellido,
                u.correo,
                ra.nivel_estres,
                ra.nivel_ansiedad,
                ra.clasificacion,
                ra.emocion_dominante
            FROM alerta_analisis al
            JOIN resultado_analisis ra ON al.id_resultado = ra.id_resultado
            JOIN analisis an ON ra.id_analisis = an.id_analisis
            JOIN audio au ON an.id_audio = au.id_audio
            JOIN usuario u ON au.id_usuario = u.id_usuario
            WHERE al.activo = 1 AND al.tipo_alerta = 'critica'
            ORDER BY al.fecha DESC
        """
        return DatabaseConnection.execute_query(query)
    
    @staticmethod
    def get_user_alerts(id_usuario, tipo_alerta=None, limit=50):
        """Obtener alertas de un usuario"""
        query = """
            SELECT al.* FROM alerta_analisis al
            JOIN resultado_analisis ra ON al.id_resultado = ra.id_resultado
            JOIN analisis an ON ra.id_analisis = an.id_analisis
            JOIN audio au ON an.id_audio = au.id_audio
            WHERE au.id_usuario = %s AND al.activo = 1
        """
        params = [id_usuario]
        
        if tipo_alerta:
            query += " AND al.tipo_alerta = %s"
            params.append(tipo_alerta)
        
        # ordenar por la columna `fecha` de la alerta
        query += " ORDER BY al.fecha DESC LIMIT %s"
        params.append(limit)
        
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def mark_reviewed(id_alerta):
        """Marcar alerta como revisada"""
        query = "UPDATE alerta_analisis SET fecha_revision = NOW() WHERE id_alerta = %s"
        DatabaseConnection.execute_query(query, (id_alerta,), fetch=False)
        return True
    
    @staticmethod
    def delete(id_alerta):
        """Eliminar alerta (soft delete)"""
        query = "UPDATE alerta_analisis SET activo = 0 WHERE id_alerta = %s"
        DatabaseConnection.execute_query(query, (id_alerta,), fetch=False)
        return True

    @staticmethod
    def assign_alert(id_alerta, id_admin=None):
        """Intentar marcar alerta como asignada. Si la columna no existe, lanzar excepción.

        Nota: el esquema actual no define columna 'asignado' ni 'id_admin_asigna'.
        Este método intenta actualizar 'asignado' si existe y devolver True.
        """
        # Preferir columnas modernas añadidas por la migración
        try:
            query = """
                UPDATE alerta_analisis
                SET id_usuario_asignado = %s,
                    estado_alerta = 'en_proceso'
                WHERE id_alerta = %s
            """
            DatabaseConnection.execute_query(query, (id_admin, id_alerta), fetch=False)
            return True
        except Exception:
            # Fallback: intentar columnas antiguas conocidas
            possible_cols = ["asignado", "id_admin_asigna", "admin_asigna"]
            for col in possible_cols:
                try:
                    query = f"UPDATE alerta_analisis SET {col} = %s WHERE id_alerta = %s"
                    DatabaseConnection.execute_query(query, (id_admin, id_alerta), fetch=False)
                    return True
                except Exception:
                    continue
        return False

    @staticmethod
    def resolve_alert(id_alerta, id_usuario_resuelve=None, notas: str = None):
        """Marcar una alerta como resuelta y registrar metadata de resolución."""
        try:
            query = """
                UPDATE alerta_analisis
                SET estado_alerta = 'resuelta',
                    fecha_resolucion = NOW(),
                    id_usuario_asignado = COALESCE(id_usuario_asignado, %s),
                    notas_resolucion = %s
                WHERE id_alerta = %s
            """
            DatabaseConnection.execute_query(query, (id_usuario_resuelve, notas, id_alerta), fetch=False)
            return True
        except Exception:
            # intentar versiones alternativas de columnas
            try:
                query = "UPDATE alerta_analisis SET fecha_revision = NOW() WHERE id_alerta = %s"
                DatabaseConnection.execute_query(query, (id_alerta,), fetch=False)
                return True
            except Exception:
                return False
    
    @staticmethod
    def count_unreviewed(id_usuario=None):
        """Contar alertas no revisadas"""
        if id_usuario:
            query = """
                SELECT COUNT(*) as total FROM alerta_analisis al
                JOIN resultado_analisis ra ON al.id_resultado = ra.id_resultado
                JOIN analisis an ON ra.id_analisis = an.id_analisis
                JOIN audio au ON an.id_audio = au.id_audio
                WHERE au.id_usuario = %s 
                  AND al.activo = 1 
                  AND al.fecha_revision IS NULL
                  AND al.tipo_alerta IN ('alta', 'critica')
            """
            result = DatabaseConnection.execute_query(query, (id_usuario,))
        else:
            query = """
                SELECT COUNT(*) as total FROM alerta_analisis
                WHERE activo = 1 
                  AND fecha_revision IS NULL
                  AND tipo_alerta IN ('alta', 'critica')
            """
            result = DatabaseConnection.execute_query(query)
        
        return result[0]['total'] if result else 0