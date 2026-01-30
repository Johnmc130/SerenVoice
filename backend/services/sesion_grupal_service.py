# backend/services/sesion_grupal_service.py
"""
Servicio para gestión de sesiones de actividades grupales.
Maneja la lógica de negocio para análisis emocional grupal.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import statistics

from backend.models.sesion_actividad_grupal import (
    SesionActividadGrupal, 
    ParticipacionSesionGrupal, 
    ResultadoGrupal
)
from backend.models.grupo import Grupo
from backend.models.grupo_miembro import GrupoMiembro
from backend.models.actividad_grupo import ActividadGrupo
from backend.models.resultado_analisis import ResultadoAnalisis
from backend.database.connection import DatabaseConnection


class SesionGrupalService:
    """Servicio para sesiones de análisis grupal."""
    
    @staticmethod
    def iniciar_sesion(
        id_grupo: int,
        id_iniciador: int,
        titulo: str,
        descripcion: Optional[str] = None,
        duracion_horas: int = 24,
        id_actividad: Optional[int] = None
    ) -> Tuple[bool, Dict]:
        """
        Iniciar una nueva sesión de análisis grupal.
        
        Args:
            id_grupo: ID del grupo
            id_iniciador: ID del usuario que inicia
            titulo: Título de la sesión
            descripcion: Descripción opcional
            duracion_horas: Horas límite para completar
            id_actividad: ID de la actividad padre (opcional)
            
        Returns:
            Tupla (éxito, datos/error)
        """
        try:
            # Verificar que el grupo existe
            grupo = Grupo.get_by_id(id_grupo)
            if not grupo:
                return False, {'error': 'Grupo no encontrado'}
            
            # Verificar que el usuario es miembro
            miembro = GrupoMiembro.is_member(id_grupo, id_iniciador)
            if not miembro:
                return False, {'error': 'No eres miembro de este grupo'}
            
            # Verificar que no hay sesión activa
            sesion_activa = SesionActividadGrupal.get_active_session_for_grupo(id_grupo)
            if sesion_activa:
                return False, {
                    'error': 'Ya hay una sesión activa en este grupo',
                    'sesion_activa': sesion_activa
                }
            
            # Si no se especifica actividad, crear una nueva
            if not id_actividad:
                result = ActividadGrupo.create(
                    id_grupo=id_grupo,
                    id_creador=id_iniciador,
                    titulo=titulo,
                    descripcion=descripcion,
                    tipo_actividad='voz'  # Tipo de actividad: voz para análisis de audio
                )
                id_actividad = result.get('last_id') if isinstance(result, dict) else result
            
            # Calcular fecha límite
            fecha_limite = datetime.now() + timedelta(hours=duracion_horas)
            
            # Crear la sesión
            id_sesion = SesionActividadGrupal.create(
                id_actividad=id_actividad,
                id_grupo=id_grupo,
                id_iniciador=id_iniciador,
                titulo=titulo,
                descripcion=descripcion,
                fecha_limite=fecha_limite
            )
            
            if not id_sesion:
                return False, {'error': 'No se pudo crear la sesión'}
            
            # Obtener la sesión creada con toda la info
            sesion = SesionActividadGrupal.get_by_id(id_sesion)
            
            return True, {
                'message': 'Sesión iniciada exitosamente',
                'sesion': sesion,
                'id_sesion': id_sesion
            }
            
        except Exception as e:
            print(f"[ERROR] Error al iniciar sesión grupal: {str(e)}")
            return False, {'error': str(e)}
    
    @staticmethod
    def obtener_sesion_detalle(
        id_sesion: int, 
        id_usuario: int
    ) -> Tuple[bool, Dict]:
        """
        Obtener detalle completo de una sesión incluyendo mi participación.
        
        Args:
            id_sesion: ID de la sesión
            id_usuario: ID del usuario consultando
            
        Returns:
            Tupla (éxito, datos)
        """
        try:
            sesion = SesionActividadGrupal.get_by_id(id_sesion)
            if not sesion:
                return False, {'error': 'Sesión no encontrada'}
            
            # Verificar membresía
            miembro = GrupoMiembro.is_member(sesion['id_grupo'], id_usuario)
            if not miembro:
                return False, {'error': 'No tienes acceso a esta sesión'}
            
            # Obtener participaciones
            participaciones = ParticipacionSesionGrupal.get_by_sesion(id_sesion)
            
            # Mi participación
            mi_participacion = ParticipacionSesionGrupal.get_user_participation(
                id_sesion, id_usuario
            )
            
            # Resultado grupal si está completada
            resultado_grupal = None
            if sesion['estado'] == 'completada':
                resultado_grupal = ResultadoGrupal.get_by_sesion(id_sesion)
            
            return True, {
                'sesion': sesion,
                'participaciones': participaciones,
                'mi_participacion': mi_participacion,
                'resultado_grupal': resultado_grupal,
                'puedo_participar': mi_participacion and mi_participacion['estado'] in ['pendiente', 'grabando']
            }
            
        except Exception as e:
            print(f"[ERROR] Error obteniendo detalle de sesión: {str(e)}")
            return False, {'error': str(e)}
    
    @staticmethod
    def registrar_participacion_audio(
        id_sesion: int,
        id_usuario: int,
        id_audio: int,
        id_analisis: int,
        id_resultado: int
    ) -> Tuple[bool, Dict]:
        """
        Registrar la participación de un usuario con su análisis de audio.
        
        Args:
            id_sesion: ID de la sesión
            id_usuario: ID del usuario
            id_audio: ID del audio grabado
            id_analisis: ID del análisis realizado
            id_resultado: ID del resultado del análisis
            
        Returns:
            Tupla (éxito, datos)
        """
        try:
            # Obtener la participación del usuario
            participacion = ParticipacionSesionGrupal.get_user_participation(
                id_sesion, id_usuario
            )
            
            if not participacion:
                return False, {'error': 'No estás registrado en esta sesión'}
            
            if participacion['estado'] == 'completado':
                return False, {'error': 'Ya has completado tu participación'}
            
            # Verificar que la sesión está activa
            sesion = SesionActividadGrupal.get_by_id(id_sesion)
            if not sesion or sesion['estado'] != 'en_progreso':
                return False, {'error': 'La sesión no está activa'}
            
            # Registrar el audio
            ParticipacionSesionGrupal.registrar_audio(
                participacion['id_participacion'],
                id_audio
            )
            
            # Completar la participación
            ParticipacionSesionGrupal.completar(
                participacion['id_participacion'],
                id_analisis,
                id_resultado
            )
            
            # Actualizar contadores de la sesión
            contadores = SesionActividadGrupal.update_contadores(id_sesion)
            
            # Si todos completaron, calcular resultado grupal
            if contadores.get('completada'):
                SesionGrupalService.calcular_resultado_grupal(id_sesion)
            
            return True, {
                'message': 'Participación registrada exitosamente',
                'sesion_completada': contadores.get('completada', False),
                'participantes_completados': contadores.get('completados', 0),
                'total_participantes': contadores.get('total', 0)
            }
            
        except Exception as e:
            print(f"[ERROR] Error registrando participación: {str(e)}")
            return False, {'error': str(e)}
    
    @staticmethod
    def calcular_resultado_grupal(id_sesion: int) -> Optional[Dict]:
        """
        Calcular y guardar el resultado agregado del grupo.
        
        Args:
            id_sesion: ID de la sesión completada
            
        Returns:
            Resultado grupal calculado o None
        """
        try:
            sesion = SesionActividadGrupal.get_by_id(id_sesion)
            if not sesion:
                return None
            
            # Verificar si ya existe resultado
            resultado_existente = ResultadoGrupal.get_by_sesion(id_sesion)
            if resultado_existente:
                return resultado_existente
            
            # Obtener todas las participaciones completadas con sus resultados
            participaciones = ParticipacionSesionGrupal.get_by_sesion(id_sesion)
            participaciones_completadas = [
                p for p in participaciones 
                if p['estado'] == 'completado' and p.get('id_resultado')
            ]
            
            if not participaciones_completadas:
                return None
            
            # Obtener resultados individuales
            resultados = []
            for p in participaciones_completadas:
                resultado = ResultadoAnalisis.get_by_id(p['id_resultado'])
                if resultado:
                    resultados.append(resultado)
            
            if not resultados:
                return None
            
            # Calcular promedios
            def safe_avg(key):
                values = [r.get(key, 0) or 0 for r in resultados]
                return sum(values) / len(values) if values else 0
            
            def safe_stdev(key):
                values = [r.get(key, 0) or 0 for r in resultados]
                if len(values) > 1:
                    return statistics.stdev(values)
                return 0
            
            # Mapeo de campos
            emociones = {
                'felicidad': safe_avg('nivel_felicidad'),
                'tristeza': safe_avg('nivel_tristeza'),
                'enojo': safe_avg('nivel_enojo'),
                'miedo': safe_avg('nivel_miedo'),
                'sorpresa': safe_avg('nivel_sorpresa'),
                'neutral': safe_avg('nivel_neutral'),
            }
            
            # Encontrar emoción predominante
            emocion_predominante = max(emociones, key=emociones.get)
            
            # Calcular nivel de bienestar (inverso de estrés/ansiedad, más felicidad)
            estres_promedio = safe_avg('nivel_estres')
            ansiedad_promedio = safe_avg('nivel_ansiedad')
            felicidad_promedio = emociones['felicidad']
            
            bienestar = max(0, min(100, 
                (100 - estres_promedio * 0.3 - ansiedad_promedio * 0.3 + felicidad_promedio * 0.4)
            ))
            
            # Crear datos del resultado
            datos_resultado = {
                'promedio_felicidad': emociones['felicidad'],
                'promedio_tristeza': emociones['tristeza'],
                'promedio_enojo': emociones['enojo'],
                'promedio_miedo': emociones['miedo'],
                'promedio_sorpresa': emociones['sorpresa'],
                'promedio_neutral': emociones['neutral'],
                'promedio_estres': estres_promedio,
                'promedio_ansiedad': ansiedad_promedio,
                'emocion_predominante': emocion_predominante,
                'nivel_bienestar_grupal': round(bienestar, 1),
                'desviacion_estandar': safe_stdev('nivel_estres'),
                'confianza_promedio': safe_avg('confianza'),
                'total_participantes': len(resultados),
                'resumen_ia': None,  # Se puede agregar después con IA
                'recomendacion_grupal': SesionGrupalService._generar_recomendacion(
                    emocion_predominante, bienestar, estres_promedio, ansiedad_promedio
                )
            }
            
            # Guardar resultado
            id_resultado_grupal = ResultadoGrupal.create(
                id_sesion, 
                sesion['id_grupo'],
                datos_resultado
            )
            
            if id_resultado_grupal:
                datos_resultado['id_resultado_grupal'] = id_resultado_grupal
                
                # Notificar a todos los participantes
                SesionGrupalService._notificar_resultado_disponible(id_sesion, sesion['id_grupo'])
            
            return datos_resultado
            
        except Exception as e:
            print(f"[ERROR] Error calculando resultado grupal: {str(e)}")
            return None
    
    @staticmethod
    def _generar_recomendacion(
        emocion: str, 
        bienestar: float, 
        estres: float, 
        ansiedad: float
    ) -> str:
        """Generar una recomendación básica basada en los resultados grupales."""
        
        if bienestar >= 70:
            return (
                "¡Excelente! El grupo muestra un buen nivel de bienestar emocional. "
                "Continúen con las actividades que están realizando y consideren "
                "compartir técnicas que les funcionan entre ustedes."
            )
        elif bienestar >= 50:
            if estres > 50:
                return (
                    "El grupo presenta niveles moderados de estrés. Se recomienda "
                    "realizar ejercicios de respiración grupal y técnicas de relajación. "
                    "Consideren una sesión de meditación guiada."
                )
            elif ansiedad > 50:
                return (
                    "Se detecta ansiedad moderada en el grupo. Podrían beneficiarse de "
                    "actividades de mindfulness y ejercicios de grounding. "
                    "El apoyo mutuo es fundamental."
                )
            else:
                return (
                    "El grupo tiene un nivel de bienestar aceptable. Para mejorar, "
                    "consideren actividades que fomenten la conexión emocional "
                    "y el apoyo mutuo."
                )
        else:
            return (
                "El grupo podría beneficiarse de atención adicional. Se sugiere "
                "contactar con el facilitador para planificar actividades de apoyo. "
                "Recuerden que están juntos en esto y pueden apoyarse mutuamente."
            )
    
    @staticmethod
    def _notificar_resultado_disponible(id_sesion: int, id_grupo: int):
        """Enviar notificación de que los resultados están disponibles."""
        try:
            query = """
                INSERT INTO notificaciones (
                    id_usuario, tipo_notificacion, titulo, mensaje, 
                    icono, url_accion, id_referencia, tipo_referencia, prioridad
                )
                SELECT 
                    psg.id_usuario,
                    'actividad_grupo',
                    '✅ Resultados Grupales Disponibles',
                    'Todos los miembros completaron la actividad. ¡Mira cómo está el grupo!',
                    '📊',
                    CONCAT('/grupos/', %s, '/sesion/', %s, '/resultados'),
                    %s,
                    'resultado_grupal',
                    'alta'
                FROM participacion_sesion_grupal psg
                WHERE psg.id_sesion = %s
            """
            DatabaseConnection.execute_query(
                query, 
                (id_grupo, id_sesion, id_sesion, id_sesion),
                fetch=False
            )
        except Exception as e:
            print(f"[WARN] Error enviando notificaciones de resultado: {str(e)}")
    
    @staticmethod
    def obtener_sesiones_pendientes_usuario(id_usuario: int) -> List[Dict]:
        """
        Obtener todas las sesiones pendientes donde el usuario debe participar.
        
        Args:
            id_usuario: ID del usuario
            
        Returns:
            Lista de sesiones pendientes
        """
        return SesionActividadGrupal.get_user_pending_sessions(id_usuario)
    
    @staticmethod
    def obtener_historial_grupo(id_grupo: int, limit: int = 20) -> List[Dict]:
        """
        Obtener historial de sesiones de un grupo.
        
        Args:
            id_grupo: ID del grupo
            limit: Límite de resultados
            
        Returns:
            Lista de sesiones
        """
        return SesionActividadGrupal.get_by_grupo(id_grupo, limit=limit)
    
    @staticmethod
    def marcar_visto(id_sesion: int, id_usuario: int) -> bool:
        """Marcar que el usuario vio la invitación a la sesión."""
        participacion = ParticipacionSesionGrupal.get_user_participation(
            id_sesion, id_usuario
        )
        if participacion:
            return ParticipacionSesionGrupal.marcar_visto(participacion['id_participacion'])
        return False
