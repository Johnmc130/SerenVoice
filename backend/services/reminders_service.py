# backend/services/reminders_service.py
"""
Servicio de Reminders para SerenVoice
- Recordatorios de análisis de voz
- Recordatorios de actividades próximas a vencer
- Recordatorios de sesiones grupales activas
"""
from backend.database.connection import DatabaseConnection
from backend.services.notificaciones_service import NotificacionesService
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class RemindersService:
    """Servicio para gestionar recordatorios automáticos"""
    
    # ==================================================
    # REMINDER DE ANÁLISIS DE VOZ
    # ==================================================
    
    @staticmethod
    def get_users_needing_voice_reminder(days_since_analysis: int = 2) -> List[Dict]:
        """
        Obtener usuarios que no han hecho análisis en X días
        y no han recibido reminder en las últimas 24 horas
        
        Args:
            days_since_analysis: Días desde el último análisis para enviar reminder
            
        Returns:
            Lista de usuarios con id_usuario, nombre, correo, dias_sin_analisis
        """
        query = """
            SELECT 
                u.id_usuario,
                u.nombre,
                u.correo,
                DATEDIFF(NOW(), COALESCE(ula.fecha_ultimo_analisis, u.fecha_registro)) as dias_sin_analisis,
                ula.fecha_ultimo_analisis
            FROM usuario u
            LEFT JOIN user_last_analysis ula ON u.id_usuario = ula.id_usuario
            WHERE u.activo = 1
              AND u.notificaciones = 1
              AND (
                  ula.fecha_ultimo_analisis IS NULL 
                  OR DATEDIFF(NOW(), ula.fecha_ultimo_analisis) >= %s
              )
              AND (
                  ula.ultimo_reminder_enviado IS NULL 
                  OR TIMESTAMPDIFF(HOUR, ula.ultimo_reminder_enviado, NOW()) >= 24
              )
            ORDER BY dias_sin_analisis DESC
        """
        
        try:
            return DatabaseConnection.execute_query(query, (days_since_analysis,))
        except Exception as e:
            logger.error(f"Error obteniendo usuarios para voice reminder: {e}")
            return []
    
    @staticmethod
    def send_voice_analysis_reminders(days_threshold: int = 2) -> Dict:
        """
        Enviar recordatorios de análisis de voz a usuarios inactivos
        
        Args:
            days_threshold: Días sin análisis para considerar inactivo
            
        Returns:
            Dict con estadísticas de envío
        """
        users = RemindersService.get_users_needing_voice_reminder(days_threshold)
        
        sent = 0
        failed = 0
        
        for user in users:
            try:
                dias = user.get('dias_sin_analisis', 0)
                
                # Personalizar mensaje según tiempo sin análisis
                if dias >= 7:
                    mensaje = f"¡Hola {user['nombre']}! Ha pasado más de una semana desde tu último análisis de voz. Tomarte unos minutos para analizar tu estado emocional puede ayudarte a entenderte mejor. 🎙️"
                    prioridad = 'alta'
                elif dias >= 3:
                    mensaje = f"¡Hola {user['nombre']}! Han pasado {dias} días desde tu último análisis de voz. ¿Cómo te sientes hoy? Te recomendamos hacer un análisis para monitorear tu bienestar. 🎙️"
                    prioridad = 'media'
                else:
                    mensaje = f"¡Hola {user['nombre']}! ¿Ya realizaste tu análisis de voz hoy? Mantén el hábito de monitorear tu bienestar emocional. 🎙️"
                    prioridad = 'baja'
                
                result = NotificacionesService.crear_notificacion(
                    id_usuario=user['id_usuario'],
                    tipo_notificacion='reminder_voz',
                    titulo='🎙️ Es hora de tu análisis de voz',
                    mensaje=mensaje,
                    icono='🎙️',
                    url_accion='/analizar-voz',
                    prioridad=prioridad
                )
                
                if result:
                    # Actualizar fecha de último reminder
                    RemindersService._update_last_reminder(user['id_usuario'])
                    sent += 1
                else:
                    failed += 1
                    
            except Exception as e:
                logger.error(f"Error enviando reminder a usuario {user['id_usuario']}: {e}")
                failed += 1
        
        return {
            'total_usuarios': len(users),
            'enviados': sent,
            'fallidos': failed
        }
    
    @staticmethod
    def _update_last_reminder(id_usuario: int):
        """Actualizar timestamp del último reminder enviado"""
        query = """
            INSERT INTO user_last_analysis (id_usuario, ultimo_reminder_enviado)
            VALUES (%s, NOW())
            ON DUPLICATE KEY UPDATE ultimo_reminder_enviado = NOW()
        """
        try:
            DatabaseConnection.execute_query(query, (id_usuario,), fetch=False)
        except Exception as e:
            logger.error(f"Error actualizando último reminder: {e}")
    
    # ==================================================
    # REMINDER DE ACTIVIDADES PRÓXIMAS A VENCER
    # ==================================================
    
    @staticmethod
    def get_activities_expiring_soon(days_until_expiry: int = 1) -> List[Dict]:
        """
        Obtener actividades que vencen en X días
        
        Args:
            days_until_expiry: Días hasta el vencimiento
            
        Returns:
            Lista de actividades con info del grupo y miembros
        """
        query = """
            SELECT 
                ag.id_actividad,
                ag.id_grupo,
                ag.titulo,
                ag.descripcion,
                ag.fecha_fin,
                DATEDIFF(ag.fecha_fin, CURDATE()) as dias_restantes,
                g.nombre_grupo,
                gm.id_usuario
            FROM actividades_grupo ag
            JOIN grupos g ON ag.id_grupo = g.id_grupo
            JOIN grupo_miembros gm ON g.id_grupo = gm.id_grupo
            WHERE ag.activo = 1
              AND ag.completada = 0
              AND g.activo = 1
              AND gm.estado = 'activo'
              AND DATEDIFF(ag.fecha_fin, CURDATE()) BETWEEN 0 AND %s
              AND NOT EXISTS (
                  -- No enviar si ya se envió hoy
                  SELECT 1 FROM notificaciones n
                  WHERE n.id_usuario = gm.id_usuario
                    AND n.id_referencia = ag.id_actividad
                    AND n.tipo_referencia = 'actividad_reminder'
                    AND DATE(n.fecha_creacion) = CURDATE()
              )
            ORDER BY ag.fecha_fin ASC, g.id_grupo
        """
        
        try:
            return DatabaseConnection.execute_query(query, (days_until_expiry,))
        except Exception as e:
            logger.error(f"Error obteniendo actividades próximas a vencer: {e}")
            return []
    
    @staticmethod
    def send_activity_deadline_reminders(days_before: int = 1) -> Dict:
        """
        Enviar recordatorios de actividades próximas a vencer
        
        Args:
            days_before: Días antes del vencimiento para enviar reminder
            
        Returns:
            Dict con estadísticas de envío
        """
        activities = RemindersService.get_activities_expiring_soon(days_before)
        
        sent = 0
        failed = 0
        
        for activity in activities:
            try:
                dias = activity.get('dias_restantes', 0)
                
                if dias == 0:
                    titulo = '⚠️ ¡Actividad vence hoy!'
                    mensaje = f'La actividad "{activity["titulo"]}" del grupo "{activity["nombre_grupo"]}" vence hoy. ¡Es tu última oportunidad para participar!'
                    prioridad = 'alta'
                else:
                    titulo = f'📅 Actividad vence en {dias} día(s)'
                    mensaje = f'La actividad "{activity["titulo"]}" del grupo "{activity["nombre_grupo"]}" vence en {dias} día(s). ¡No olvides completarla!'
                    prioridad = 'media'
                
                result = NotificacionesService.crear_notificacion(
                    id_usuario=activity['id_usuario'],
                    tipo_notificacion='actividad_deadline',
                    titulo=titulo,
                    mensaje=mensaje,
                    icono='📅',
                    url_accion=f'/grupos/{activity["id_grupo"]}/actividad/{activity["id_actividad"]}',
                    id_referencia=activity['id_actividad'],
                    tipo_referencia='actividad_reminder',
                    prioridad=prioridad
                )
                
                if result:
                    sent += 1
                else:
                    failed += 1
                    
            except Exception as e:
                logger.error(f"Error enviando reminder de actividad {activity['id_actividad']}: {e}")
                failed += 1
        
        return {
            'total_actividades': len(activities),
            'enviados': sent,
            'fallidos': failed
        }
    
    # ==================================================
    # REMINDER DE SESIONES GRUPALES ACTIVAS
    # ==================================================
    
    @staticmethod
    def get_active_sessions_needing_reminder() -> List[Dict]:
        """
        Obtener sesiones grupales activas con miembros que no han participado
        """
        query = """
            SELECT 
                sag.id_sesion,
                sag.id_grupo,
                sag.titulo,
                sag.estado,
                sag.fecha_inicio,
                TIMESTAMPDIFF(HOUR, sag.fecha_inicio, NOW()) as horas_activa,
                g.nombre_grupo,
                gm.id_usuario
            FROM sesion_actividad_grupal sag
            JOIN grupos g ON sag.id_grupo = g.id_grupo
            JOIN grupo_miembros gm ON g.id_grupo = gm.id_grupo
            LEFT JOIN participacion_sesion_grupal psg ON sag.id_sesion = psg.id_sesion AND gm.id_usuario = psg.id_usuario
            WHERE sag.estado = 'activa'
              AND g.activo = 1
              AND gm.estado = 'activo'
              AND (psg.completada IS NULL OR psg.completada = 0)
              AND NOT EXISTS (
                  -- No enviar si ya se envió en las últimas 2 horas
                  SELECT 1 FROM notificaciones n
                  WHERE n.id_usuario = gm.id_usuario
                    AND n.id_referencia = sag.id_sesion
                    AND n.tipo_referencia = 'sesion_reminder'
                    AND TIMESTAMPDIFF(HOUR, n.fecha_creacion, NOW()) < 2
              )
            ORDER BY sag.fecha_inicio DESC
        """
        
        try:
            return DatabaseConnection.execute_query(query, ())
        except Exception as e:
            logger.error(f"Error obteniendo sesiones activas: {e}")
            return []
    
    @staticmethod
    def send_session_participation_reminders() -> Dict:
        """
        Enviar recordatorios de participación en sesiones grupales activas
        
        Returns:
            Dict con estadísticas de envío
        """
        sessions = RemindersService.get_active_sessions_needing_reminder()
        
        sent = 0
        failed = 0
        
        for session in sessions:
            try:
                horas = session.get('horas_activa', 0)
                
                if horas >= 12:
                    titulo = '⏰ ¡No te pierdas la sesión grupal!'
                    mensaje = f'La sesión "{session.get("titulo", "Análisis grupal")}" en "{session["nombre_grupo"]}" sigue activa. ¡Aún puedes participar!'
                    prioridad = 'alta'
                else:
                    titulo = '🎙️ Sesión grupal en curso'
                    mensaje = f'Hay una sesión de análisis activa en "{session["nombre_grupo"]}". ¡Graba tu audio para participar!'
                    prioridad = 'media'
                
                result = NotificacionesService.crear_notificacion(
                    id_usuario=session['id_usuario'],
                    tipo_notificacion='sesion_reminder',
                    titulo=titulo,
                    mensaje=mensaje,
                    icono='🎙️',
                    url_accion=f'/grupos/{session["id_grupo"]}',
                    id_referencia=session['id_sesion'],
                    tipo_referencia='sesion_reminder',
                    prioridad=prioridad
                )
                
                if result:
                    sent += 1
                else:
                    failed += 1
                    
            except Exception as e:
                logger.error(f"Error enviando reminder de sesión {session['id_sesion']}: {e}")
                failed += 1
        
        return {
            'total_sesiones': len(sessions),
            'enviados': sent,
            'fallidos': failed
        }
    
    # ==================================================
    # EJECUTAR TODOS LOS REMINDERS
    # ==================================================
    
    @staticmethod
    def run_all_reminders() -> Dict:
        """
        Ejecutar todos los tipos de reminders
        
        Returns:
            Dict con resultados de cada tipo de reminder
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'voice_reminders': {},
            'activity_reminders': {},
            'session_reminders': {}
        }
        
        try:
            # Reminders de análisis de voz (usuarios sin análisis en 2+ días)
            results['voice_reminders'] = RemindersService.send_voice_analysis_reminders(
                days_threshold=2
            )
        except Exception as e:
            logger.error(f"Error en voice reminders: {e}")
            results['voice_reminders'] = {'error': str(e)}
        
        try:
            # Reminders de actividades que vencen hoy o mañana
            results['activity_reminders'] = RemindersService.send_activity_deadline_reminders(
                days_before=1
            )
        except Exception as e:
            logger.error(f"Error en activity reminders: {e}")
            results['activity_reminders'] = {'error': str(e)}
        
        try:
            # Reminders de sesiones grupales activas
            results['session_reminders'] = RemindersService.send_session_participation_reminders()
        except Exception as e:
            logger.error(f"Error en session reminders: {e}")
            results['session_reminders'] = {'error': str(e)}
        
        logger.info(f"Reminders ejecutados: {results}")
        return results


# Función para ejecutar desde cron job o manualmente
def run_scheduled_reminders():
    """Función para ejecutar desde scheduler o cron"""
    return RemindersService.run_all_reminders()
