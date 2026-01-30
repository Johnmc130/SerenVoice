from backend.database.connection import DatabaseConnection


class HistorialAlerta:
    """Modelo para la tabla historial_alerta"""

    @staticmethod
    def create(id_alerta: int, accion: str, usuario_responsable: int = None, detalles: str = None):
        query = """
            INSERT INTO historial_alerta (id_alerta, accion, usuario_responsable, detalles, fecha_accion)
            VALUES (%s, %s, %s, %s, NOW())
        """
        return DatabaseConnection.execute_query(query, (id_alerta, accion, usuario_responsable, detalles), fetch=False)

    @staticmethod
    def get_for_alert(id_alerta: int, limit: int = 100):
        query = "SELECT * FROM historial_alerta WHERE id_alerta = %s ORDER BY fecha_accion DESC LIMIT %s"
        return DatabaseConnection.execute_query(query, (id_alerta, limit))
