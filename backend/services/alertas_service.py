# backend/services/alertas_service.py
from backend.models.alerta_analisis import AlertaAnalisis
from backend.models.historial_alerta import HistorialAlerta
from backend.services.notificaciones_service import NotificacionesService

class AlertasService:
    """Servicio de alertas"""
    
    @staticmethod
    def get_user_alerts(id_usuario):
        """Obtener alertas de un usuario"""
        return AlertaAnalisis.get_user_alerts(id_usuario)
    
    @staticmethod
    def get_active_alerts():
        """Obtener todas las alertas activas del sistema"""
        return AlertaAnalisis.get_active_alerts()

    @staticmethod
    def get_critical_alerts():
        """Obtener solo alertas críticas"""
        return AlertaAnalisis.get_critical_alerts()
    
    @staticmethod
    def get_alert_by_id(id_alerta):
        """Obtener alerta por ID"""
        return AlertaAnalisis.get_by_id(id_alerta)

    @staticmethod
    def assign_alert(id_alerta, id_admin=None):
        """Marcar una alerta como asignada a un admin (intenta persistir en DB)."""
        try:
            ok = AlertaAnalisis.assign_alert(id_alerta, id_admin)
            # Registrar en historial
            try:
                HistorialAlerta.create(id_alerta, 'asignada', usuario_responsable=id_admin, detalles=f'Asignada por admin {id_admin}')
            except Exception:
                pass
            return ok
        except Exception:
            # Si falla la persistencia, devolvemos False pero no lanzamos
            return False

    @staticmethod
    def resolve_alert(id_alerta, id_admin=None, notas: str = None):
        """Resolver una alerta: persistir resolución y registrar historial; notificar si es crítico."""
        try:
            ok = AlertaAnalisis.resolve_alert(id_alerta, id_admin, notas)
            # Registrar en historial
            try:
                HistorialAlerta.create(id_alerta, 'resuelta', usuario_responsable=id_admin, detalles=notas)
            except Exception:
                pass

            # Intentar notificar al usuario (si es crítico, el trigger DB puede ya haberlo hecho)
            try:
                alerta = AlertaAnalisis.get_by_id(id_alerta)
                if alerta and alerta.get('tipo_alerta') == 'critica':
                    # obtener id de usuario desde joins en vista o consulta directa
                    id_usuario = alerta.get('id_usuario') or alerta.get('id_usuario_afectado')
                    titulo = alerta.get('titulo')
                    descripcion = alerta.get('descripcion')
                    if id_usuario:
                        NotificacionesService.notificar_alerta_critica(id_usuario, id_alerta, titulo, 'Alerta resuelta: ' + (notas or ''))
            except Exception:
                pass

            return ok
        except Exception:
            return False

    @staticmethod
    def get_historial(id_alerta: int, limit: int = 100):
        """Obtener historial de una alerta"""
        try:
            return HistorialAlerta.get_for_alert(id_alerta, limit)
        except Exception:
            return []

    @staticmethod
    def mark_reviewed(id_alerta):
        """Marcar alerta como revisada"""
        return AlertaAnalisis.mark_reviewed(id_alerta)