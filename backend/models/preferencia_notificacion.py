# backend/models/preferencia_notificacion.py
from backend.database.connection import DatabaseConnection

class PreferenciaNotificacion:
    """Modelo para la tabla preferencias_notificacion"""
    
    @staticmethod
    def get_by_user(id_usuario):
        """Obtener preferencias de notificación de un usuario"""
        query = "SELECT * FROM preferencias_notificacion WHERE id_usuario = %s"
        results = DatabaseConnection.execute_query(query, (id_usuario,))
        return results[0] if results else None
    
    @staticmethod
    def create_default(id_usuario):
        """Crear preferencias por defecto para un usuario nuevo"""
        query = """
            INSERT INTO preferencias_notificacion (id_usuario)
            VALUES (%s)
        """
        return DatabaseConnection.execute_query(query, (id_usuario,), fetch=False)
    
    @staticmethod
    def update(id_usuario, preferences):
        """Actualizar preferencias de notificación"""
        # Construir la query dinámicamente basado en las preferencias enviadas
        fields = []
        values = []
        
        allowed_fields = [
            'invitacion_grupo_app', 'invitacion_grupo_email', 'invitacion_grupo_push',
            'actividad_grupo_app', 'actividad_grupo_email', 'actividad_grupo_push',
            'recomendacion_app', 'recomendacion_email', 'recomendacion_push',
            'alerta_critica_app', 'alerta_critica_email', 'alerta_critica_push',
            'recordatorio_app', 'recordatorio_email', 'recordatorio_push',
            'horario_inicio', 'horario_fin', 'pausar_notificaciones', 'fecha_pausa_hasta'
        ]
        
        for field in allowed_fields:
            if field in preferences:
                fields.append(f"{field} = %s")
                values.append(preferences[field])
        
        if not fields:
            return False
        
        query = f"""
            UPDATE preferencias_notificacion 
            SET {', '.join(fields)}, fecha_modificacion = NOW()
            WHERE id_usuario = %s
        """
        values.append(id_usuario)
        
        return DatabaseConnection.execute_query(query, tuple(values), fetch=False)
    
    @staticmethod
    def can_send_notification(id_usuario, tipo_notificacion, canal='app'):
        """Verificar si se puede enviar una notificación según las preferencias del usuario"""
        preferences = PreferenciaNotificacion.get_by_user(id_usuario)
        
        if not preferences:
            # Si no hay preferencias, crear valores por defecto y permitir
            PreferenciaNotificacion.create_default(id_usuario)
            return True
        
        # Si las notificaciones están pausadas
        if preferences.get('pausar_notificaciones'):
            from datetime import datetime
            fecha_pausa = preferences.get('fecha_pausa_hasta')
            if fecha_pausa and datetime.now() < fecha_pausa:
                return False
        
        # Verificar horario
        from datetime import datetime, time
        now = datetime.now().time()
        horario_inicio = preferences.get('horario_inicio', time(8, 0))
        horario_fin = preferences.get('horario_fin', time(22, 0))
        
        if not (horario_inicio <= now <= horario_fin):
            # Permitir solo notificaciones urgentes fuera del horario
            return tipo_notificacion == 'alerta_critica' and canal in ['app', 'push']
        
        # Verificar preferencia específica del tipo y canal
        pref_key = f"{tipo_notificacion}_{canal}"
        
        # Mapear algunos tipos a las preferencias disponibles
        tipo_map = {
            'invitacion_grupo': 'invitacion_grupo',
            'actividad_grupo': 'actividad_grupo',
            'recordatorio_actividad': 'recordatorio',
            'recomendacion': 'recomendacion',
            'alerta_critica': 'alerta_critica',
            'mensaje_facilitador': 'actividad_grupo',
            'logro_desbloqueado': 'recordatorio',
            'recordatorio_analisis': 'recordatorio',
            'actualizacion_grupo': 'actividad_grupo',
            'sistema': 'alerta_critica'
        }
        
        tipo_mapped = tipo_map.get(tipo_notificacion, 'recordatorio')
        pref_key = f"{tipo_mapped}_{canal}"
        
        return preferences.get(pref_key, True)
    
    @staticmethod
    def pause_notifications(id_usuario, pause_until=None):
        """Pausar notificaciones temporalmente"""
        query = """
            UPDATE preferencias_notificacion 
            SET pausar_notificaciones = 1, fecha_pausa_hasta = %s, fecha_modificacion = NOW()
            WHERE id_usuario = %s
        """
        return DatabaseConnection.execute_query(query, (pause_until, id_usuario), fetch=False)
    
    @staticmethod
    def resume_notifications(id_usuario):
        """Reanudar notificaciones"""
        query = """
            UPDATE preferencias_notificacion 
            SET pausar_notificaciones = 0, fecha_pausa_hasta = NULL, fecha_modificacion = NOW()
            WHERE id_usuario = %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario,), fetch=False)
