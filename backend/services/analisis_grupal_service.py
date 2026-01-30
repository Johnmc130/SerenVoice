# backend/services/analisis_grupal_service.py
"""
Servicio para gestionar análisis grupales de actividades.
Calcula promedios de emociones, maneja notificaciones, etc.
"""

import json
from typing import Dict, List, Optional, Tuple
from backend.models.actividad_participante import ActividadParticipante
from backend.models.resultado_actividad_grupal import (
    ResultadoActividadGrupal, 
    AnalisisParticipanteActividad
)
from backend.models.actividad_grupo import ActividadGrupo
from backend.models.notificacion import Notificacion


class AnalisisGrupalService:
    """Servicio para análisis grupales"""
    
    @staticmethod
    def notificar_inicio_actividad(id_actividad: int) -> Tuple[bool, str]:
        """
        Enviar notificaciones a todos los miembros del grupo
        indicando que la actividad inició.
        
        Args:
            id_actividad: ID de la actividad a iniciar
            
        Returns:
            Tupla (éxito, mensaje)
        """
        try:
            # Obtener info de la actividad
            actividad = ActividadGrupo.get_by_id(id_actividad)
            if not actividad:
                return False, "Actividad no encontrada"
            
            id_grupo = actividad['id_grupo']
            titulo = actividad['titulo']
            descripcion = actividad['descripcion'] or 'Nueva actividad grupal iniciada'
            
            # Obtener todos los miembros activos del grupo
            from backend.models.grupo import Grupo
            miembros = Grupo.get_miembros(id_grupo)
            
            # Crear participantes para cada miembro
            ActividadParticipante.crear_participantes_actividad(id_actividad, id_grupo)
            
            # Enviar notificación a cada miembro
            notificaciones_enviadas = 0
            for miembro in miembros:
                if miembro['id_usuario'] != actividad['id_creador']:  # No notificar al creador
                    notif = Notificacion.create(
                        id_usuario=miembro['id_usuario'],
                        tipo_notificacion='actividad_grupo_iniciada',
                        titulo=f"Actividad grupal: {titulo}",
                        mensaje=descripcion,
                        icono='📢',
                        url_accion=f"/grupos/{id_grupo}/actividades/{id_actividad}",
                        id_referencia=id_actividad,
                        tipo_referencia='actividad_grupal',
                        prioridad='alta'
                    )
                    if notif:
                        notificaciones_enviadas += 1
            
            return True, f"Notificaciones enviadas a {notificaciones_enviadas} miembros"
            
        except Exception as e:
            return False, f"Error notificando: {str(e)}"
    
    @staticmethod
    def obtener_estado_actividad(id_actividad: int) -> Dict:
        """
        Obtener el estado actual de una actividad grupal.
        Incluye participantes, su estado, procentaje de completitud.
        
        Args:
            id_actividad: ID de la actividad
            
        Returns:
            Dict con estado completo
        """
        stats = ActividadParticipante.obtener_estadisticas_participacion(id_actividad)
        participantes = ActividadParticipante.obtener_participantes_actividad(id_actividad)
        resultado = ResultadoActividadGrupal.obtener_por_actividad(id_actividad)
        
        return {
            'id_actividad': id_actividad,
            'estadisticas': stats,
            'todos_activos': ActividadParticipante.todos_activos(id_actividad),
            'todos_completados': ActividadParticipante.todos_completados(id_actividad),
            'participantes': participantes,
            'resultado': resultado,
            'puede_iniciar': (stats.get('activos', 0) == stats.get('total', 0))
        }
    
    @staticmethod
    def calcular_promedios_emociones(id_actividad: int) -> Dict:
        """
        Calcular promedios de emociones de todos los participantes.
        Se llama cuando todos completaron su análisis.
        
        Args:
            id_actividad: ID de la actividad
            
        Returns:
            Dict con promedios calculados
        """
        # Obtener todos los análisis
        analisis_lista = AnalisisParticipanteActividad.obtener_analisis_actividad(id_actividad)
        
        if not analisis_lista:
            return {}
        
        total_participantes = len(analisis_lista)
        
        # Acumular valores
        suma_estres = 0
        suma_ansiedad = 0
        suma_confianza = 0
        emociones_acumuladas = {}
        
        for analisis in analisis_lista:
            suma_estres += analisis.get('nivel_estres', 0)
            suma_ansiedad += analisis.get('nivel_ansiedad', 0)
            suma_confianza += analisis.get('confianza_modelo', 0)
            
            # Acumular emociones
            if analisis.get('emociones_json'):
                emociones = analisis['emociones_json']
                if isinstance(emociones, str):
                    emociones = json.loads(emociones)
                
                for emocion_nombre, emocion_valor in emociones.items():
                    if emocion_nombre not in emociones_acumuladas:
                        emociones_acumuladas[emocion_nombre] = {'suma': 0, 'contar': 0}
                    
                    # Manejar tanto valor simple como dict
                    valor = emocion_valor.get('value', emocion_valor) if isinstance(emocion_valor, dict) else emocion_valor
                    emociones_acumuladas[emocion_nombre]['suma'] += valor
                    emociones_acumuladas[emocion_nombre]['contar'] += 1
        
        # Calcular promedios
        promedio_estres = suma_estres / total_participantes if total_participantes > 0 else 0
        promedio_ansiedad = suma_ansiedad / total_participantes if total_participantes > 0 else 0
        promedio_confianza = suma_confianza / total_participantes if total_participantes > 0 else 0
        
        # Promedios de emociones
        emociones_promediadas = {}
        for emocion_nombre, acumulado in emociones_acumuladas.items():
            promedio = acumulado['suma'] / acumulado['contar'] if acumulado['contar'] > 0 else 0
            emociones_promediadas[emocion_nombre] = {
                'promedio': round(promedio, 2),
                'minimo': acumulado['suma'],  # Simplificado, se puede mejorar
                'maximo': acumulado['suma']   # Simplificado, se puede mejorar
            }
        
        # Encontrar emoción predominante
        emocion_predominante = max(
            emociones_promediadas.items(),
            key=lambda x: x[1]['promedio']
        ) if emociones_promediadas else (None, {'promedio': 0})
        
        # Evaluar bienestar grupal basado en indicadores
        bienestar = AnalisisGrupalService._evaluar_bienestar_grupal(
            promedio_estres,
            promedio_ansiedad
        )
        
        return {
            'total_participantes': total_participantes,
            'promedio_estres': round(promedio_estres, 2),
            'promedio_ansiedad': round(promedio_ansiedad, 2),
            'promedio_confianza': round(promedio_confianza, 2),
            'emocion_predominante': emocion_predominante[0] if emocion_predominante[0] else 'Neutral',
            'promedio_emocion_predominante': round(emocion_predominante[1]['promedio'], 2),
            'emociones_detalle': emociones_promediadas,
            'bienestar_grupal': bienestar
        }
    
    @staticmethod
    def registrar_resultado_final(id_actividad: int) -> Tuple[bool, str, Optional[Dict]]:
        """
        Registrar resultado final cuando todos completaron.
        Calcula y guarda promedios en la BD.
        
        Args:
            id_actividad: ID de la actividad
            
        Returns:
            Tupla (éxito, mensaje, resultado_dict)
        """
        try:
            # Obtener info de actividad
            actividad = ActividadGrupo.get_by_id(id_actividad)
            if not actividad:
                return False, "Actividad no encontrada", None
            
            # Calcular promedios
            promedios = AnalisisGrupalService.calcular_promedios_emociones(id_actividad)
            if not promedios:
                return False, "No hay análisis para procesar", None
            
            # Guardar resultado
            id_resultado = ResultadoActividadGrupal.crear(
                id_actividad=id_actividad,
                id_grupo=actividad['id_grupo'],
                total_participantes=promedios['total_participantes'],
                promedio_estres=promedios['promedio_estres'],
                promedio_ansiedad=promedios['promedio_ansiedad'],
                promedio_confianza=promedios['promedio_confianza'],
                emocion_predominante=promedios['emocion_predominante'],
                promedio_emocion_predominante=promedios['promedio_emocion_predominante'],
                emociones_detalle=promedios['emociones_detalle'],
                bienestar_grupal=promedios['bienestar_grupal']
            )
            
            if not id_resultado:
                return False, "Error guardando resultado", None
            
            # Notificar a todos los participantes que está completado
            AnalisisGrupalService._notificar_resultado(id_actividad, promedios)
            
            return True, "Resultado registrado exitosamente", promedios
            
        except Exception as e:
            return False, f"Error registrando resultado: {str(e)}", None
    
    @staticmethod
    def _evaluar_bienestar_grupal(promedio_estres: float, promedio_ansiedad: float) -> str:
        """
        Evaluar el bienestar grupal basado en indicadores.
        
        Args:
            promedio_estres: Promedio de estrés (0-100)
            promedio_ansiedad: Promedio de ansiedad (0-100)
            
        Returns:
            Evaluación (bajo, normal, alto)
        """
        promedio_indicadores = (promedio_estres + promedio_ansiedad) / 2
        
        if promedio_indicadores < 40:
            return "alto"  # Baja activación = bienestar alto
        elif promedio_indicadores < 70:
            return "normal"
        else:
            return "bajo"  # Alta activación = bienestar bajo
    
    @staticmethod
    def _notificar_resultado(id_actividad: int, promedios: Dict) -> None:
        """
        Notificar a todos los participantes sobre el resultado final.
        
        Args:
            id_actividad: ID de la actividad
            promedios: Dict con promedios calculados
        """
        try:
            participantes = ActividadParticipante.obtener_participantes_actividad(id_actividad)
            
            emocion = promedios.get('emocion_predominante', 'Neutral')
            bienestar = promedios.get('bienestar_grupal', 'normal')
            
            mensaje = f"Análisis grupal completado. Emoción predominante: {emocion}. Bienestar: {bienestar}"
            
            for participante in participantes:
                Notificacion.create(
                    id_usuario=participante['id_usuario'],
                    tipo_notificacion='resultado_actividad_grupal',
                    titulo='Resultado de Actividad Grupal',
                    mensaje=mensaje,
                    icono='✅',
                    url_accion=f"/actividades/{id_actividad}/resultado",
                    id_referencia=id_actividad,
                    tipo_referencia='resultado_actividad',
                    prioridad='media'
                )
        except Exception as e:
            print(f"[analisis_grupal_service] Error notificando resultado: {str(e)}")
