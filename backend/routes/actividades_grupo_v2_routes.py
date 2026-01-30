"""
Rutas API para Actividades Grupales con Análisis Completo
Incluye: Crear actividad, invitar participantes, enviar notificaciones,
         análisis individual y grupal, cálculo de resultados
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from backend.models.actividad_grupo import ActividadGrupo
from backend.models.participante_actividad_grupo import ParticipanteActividadGrupo
from backend.models.analisis_voz_participante import AnalisisVozParticipante
from backend.models.resultado_actividad_grupal import ResultadoActividadGrupal
from backend.models.notificacion_actividad import NotificacionActividad
from backend.models.usuario import Usuario
from backend.services.audio_service import AudioService
from backend.services.analisis_grupal_service import AnalisisGrupalService
from backend.utils.security_middleware import secure_log, limiter
import os
from datetime import datetime

bp = Blueprint('actividades_grupo_v2', __name__, url_prefix='/api/v2/actividades_grupo')

# ============================================================
# 1. CREAR Y GESTIONAR ACTIVIDADES
# ============================================================

@bp.route('/<int:grupo_id>/crear', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def crear_actividad(grupo_id):
    """Crear una nueva actividad grupal"""
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json()

        nombre = data.get('nombre')
        descripcion = data.get('descripcion', '')
        tipo = data.get('tipo', 'voz')
        duracion = data.get('duracion_minutos', 5)

        if not nombre:
            return {'success': False, 'error': 'Nombre de actividad requerido'}, 400

        # Crear actividad
        actividad_id = ActividadGrupo.crear(
            grupo_id=grupo_id,
            nombre=nombre,
            descripcion=descripcion,
            tipo=tipo,
            duracion_minutos=duracion
        )

        secure_log('info', f'Actividad creada: {nombre}', {'usuario_id': usuario_id, 'grupo_id': grupo_id})

        return {
            'success': True,
            'data': {
                'actividad_id': actividad_id,
                'mensaje': 'Actividad creada exitosamente'
            }
        }, 201

    except Exception as e:
        secure_log('error', f'Error creando actividad: {str(e)}', {'usuario_id': usuario_id})
        return {'success': False, 'error': 'Error interno'}, 500


@bp.route('/<int:actividad_id>', methods=['GET'])
@jwt_required()
def obtener_actividad(actividad_id):
    """Obtener detalles de una actividad con participantes"""
    try:
        actividad = ActividadGrupo.obtener_con_participantes(actividad_id)

        if not actividad:
            return {'success': False, 'error': 'Actividad no encontrada'}, 404

        return {'success': True, 'data': actividad}, 200

    except Exception as e:
        return {'success': False, 'error': 'Error interno'}, 500


@bp.route('/<int:actividad_id>/iniciar', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def iniciar_actividad(actividad_id):
    """
    Iniciar una actividad y enviar notificaciones a todos los participantes
    """
    try:
        usuario_id = get_jwt_identity()
        
        # Obtener actividad
        actividad = ActividadGrupo.obtener(actividad_id)
        if not actividad:
            return {'success': False, 'error': 'Actividad no encontrada'}, 404

        # Cambiar estado a 'en_progreso'
        ActividadGrupo.iniciar(actividad_id)

        # Obtener participantes
        participantes = ParticipanteActividadGrupo.obtener_participantes(actividad_id)

        # Enviar notificaciones
        notificaciones_enviadas = 0
        for participante in participantes:
            try:
                NotificacionActividad.crear(
                    usuario_id=participante['usuario_id'],
                    tipo_notificacion='actividad_grupo',
                    titulo=f"Actividad iniciada: {actividad['titulo']}",
                    mensaje=f"La actividad '{actividad['titulo']}' ha iniciado. ¡Prepárate para analizar tu voz!",
                    icono='🎯',
                    url_accion=f'/actividades/grupo/{actividad_id}',
                    id_referencia=actividad_id,
                    tipo_referencia='actividad',
                    prioridad='alta'
                )
                notificaciones_enviadas += 1
            except:
                pass

        secure_log('info', f'Actividad iniciada: {actividad_id}', {'usuario_id': usuario_id, 'notificaciones': notificaciones_enviadas})

        return {
            'success': True,
            'data': {
                'actividad_id': actividad_id,
                'estado': 'en_progreso',
                'notificaciones_enviadas': notificaciones_enviadas
            }
        }, 200

    except Exception as e:
        secure_log('error', f'Error iniciando actividad: {str(e)}')
        return {'success': False, 'error': 'Error interno'}, 500


# ============================================================
# 2. GESTIONAR PARTICIPANTES
# ============================================================

@bp.route('/<int:actividad_id>/agregar_participante', methods=['POST'])
@jwt_required()
@limiter.limit("20 per minute")
def agregar_participante(actividad_id):
    """Agregar un participante a la actividad"""
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json()
        
        usuario_id_nuevo = data.get('usuario_id')
        
        if not usuario_id_nuevo:
            return {'success': False, 'error': 'Usuario ID requerido'}, 400

        # Agregar participante
        ParticipanteActividadGrupo.crear(actividad_id, usuario_id_nuevo)

        # Enviar notificación
        actividad = ActividadGrupo.obtener(actividad_id)
        NotificacionActividad.crear(
            usuario_id=usuario_id_nuevo,
            tipo_notificacion='invitacion_grupo',
            titulo='Invitación a actividad grupal',
            mensaje=f"Fuiste invitado a participar en la actividad: {actividad['titulo']}",
            icono='📌',
            url_accion=f'/actividades/grupo/{actividad_id}',
            id_referencia=actividad_id,
            tipo_referencia='actividad',
            prioridad='media'
        )

        return {
            'success': True,
            'data': {'mensaje': 'Participante agregado exitosamente'}
        }, 201

    except Exception as e:
        return {'success': False, 'error': 'Error interno'}, 500


@bp.route('/<int:actividad_id>/estado', methods=['GET'])
@jwt_required()
def obtener_estado_participante(actividad_id):
    """Obtener estado del participante actual en la actividad"""
    try:
        usuario_id = get_jwt_identity()
        
        estado = ParticipanteActividadGrupo.obtener_estado(actividad_id, usuario_id)
        
        if not estado:
            return {'success': False, 'error': 'No eres participante de esta actividad'}, 403

        return {'success': True, 'data': estado}, 200

    except Exception as e:
        return {'success': False, 'error': 'Error interno'}, 500


@bp.route('/<int:actividad_id>/me/conectado', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def marcar_conectado(actividad_id):
    """Marcar al usuario actual como conectado a la actividad"""
    try:
        usuario_id = get_jwt_identity()
        
        ParticipanteActividadGrupo.actualizar_estado(actividad_id, usuario_id, 'conectado')
        
        return {
            'success': True,
            'data': {'mensaje': 'Estado actualizado a conectado'}
        }, 200

    except Exception as e:
        return {'success': False, 'error': 'Error interno'}, 500


# ============================================================
# 3. ANÁLISIS DE VOZ INDIVIDUAL
# ============================================================

@bp.route('/<int:actividad_id>/me/analizar', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def enviar_analisis_voz(actividad_id):
    """Enviar análisis de voz del usuario actual"""
    try:
        usuario_id = get_jwt_identity()
        
        # Validar que el usuario sea participante
        estado = ParticipanteActividadGrupo.obtener_estado(actividad_id, usuario_id)
        if not estado:
            return {'success': False, 'error': 'No eres participante'}, 403

        # Obtener el archivo de audio
        if 'audio' not in request.files:
            return {'success': False, 'error': 'No se proporcionó archivo de audio'}, 400

        audio_file = request.files['audio']
        
        if audio_file.filename == '':
            return {'success': False, 'error': 'Archivo vacío'}, 400

        # Guardar archivo
        filename = secure_filename(f"actividad_{actividad_id}_user_{usuario_id}_{datetime.now().timestamp()}.wav")
        filepath = os.path.join('uploads/audios', filename)
        audio_file.save(filepath)

        # Analizar audio con AudioService
        audio_service = AudioService()
        resultado_analisis = audio_service.analyze_audio(filepath)

        # Guardar análisis en BD
        analisis_id = AnalisisVozParticipante.crear(
            actividad_id=actividad_id,
            usuario_id=usuario_id,
            ruta_archivo=filepath,
            emocion=resultado_analisis.get('emotion', 'neutral'),
            emocion_confianza=float(resultado_analisis.get('emotion_confidence', 0)),
            energia_voz=float(resultado_analisis.get('energy', 0)),
            frecuencia_promedio=float(resultado_analisis.get('avg_frequency', 0)),
            duracion_segundos=float(resultado_analisis.get('duration', 0)),
            estres_nivel=float(resultado_analisis.get('stress_level', 0)),
            ansiedad_nivel=float(resultado_analisis.get('anxiety_level', 0)),
            bienestar_nivel=float(resultado_analisis.get('wellness_level', 0)),
            observaciones=resultado_analisis.get('observations', '')
        )

        # Actualizar estado de participante
        ParticipanteActividadGrupo.actualizar_estado(actividad_id, usuario_id, 'completado')

        secure_log('info', f'Análisis completado', {'usuario_id': usuario_id, 'actividad_id': actividad_id})

        return {
            'success': True,
            'data': {
                'analisis_id': analisis_id,
                'emocion': resultado_analisis.get('emotion'),
                'mensaje': 'Análisis guardado exitosamente'
            }
        }, 201

    except Exception as e:
        secure_log('error', f'Error en análisis: {str(e)}')
        return {'success': False, 'error': 'Error procesando análisis'}, 500


# ============================================================
# 4. CÁLCULO DE RESULTADOS GRUPALES
# ============================================================

@bp.route('/<int:actividad_id>/finalizar', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def finalizar_actividad(actividad_id):
    """
    Finalizar actividad y calcular resultado grupal
    """
    try:
        usuario_id = get_jwt_identity()
        
        # Cambiar estado
        ActividadGrupo.finalizar(actividad_id)

        # Calcular resultado final
        resultado = AnalisisGrupalService.calcular_resultado_final(actividad_id)

        if not resultado:
            return {'success': False, 'error': 'No hay análisis para calcular'}, 400

        # Enviar notificaciones de finalización
        participantes = ParticipanteActividadGrupo.obtener_participantes(actividad_id)
        actividad = ActividadGrupo.obtener(actividad_id)
        for participante in participantes:
            NotificacionActividad.crear(
                usuario_id=participante['usuario_id'],
                tipo_notificacion='actividad_grupo',
                titulo=f"Actividad finalizada: {actividad['titulo']}",
                mensaje=f"Actividad completada. Emoción dominante del grupo: {resultado.get('emocion_dominante', 'sin datos')}",
                icono='✅',
                url_accion=f'/actividades/grupo/{actividad_id}/resultados',
                id_referencia=actividad_id,
                tipo_referencia='actividad',
                prioridad='media'
            )

        secure_log('info', f'Actividad finalizada y calculada', {'usuario_id': usuario_id, 'actividad_id': actividad_id})

        return {
            'success': True,
            'data': resultado
        }, 200

    except Exception as e:
        secure_log('error', f'Error finalizando: {str(e)}')
        return {'success': False, 'error': 'Error interno'}, 500


@bp.route('/<int:actividad_id>/resultado', methods=['GET'])
@jwt_required()
def obtener_resultado(actividad_id):
    """Obtener resultado final de una actividad grupal"""
    try:
        resultado = ResultadoActividadGrupal.obtener(actividad_id)
        
        if not resultado:
            return {'success': False, 'error': 'Resultado no disponible'}, 404

        return {'success': True, 'data': resultado}, 200

    except Exception as e:
        return {'success': False, 'error': 'Error interno'}, 500


# ============================================================
# 5. NOTIFICACIONES
# ============================================================

@bp.route('/notificaciones', methods=['GET'])
@jwt_required()
@limiter.limit("20 per minute")
def obtener_notificaciones():
    """Obtener notificaciones sin leer del usuario"""
    try:
        usuario_id = get_jwt_identity()
        
        notificaciones = NotificacionActividad.obtener_sin_leer(usuario_id)
        
        return {
            'success': True,
            'data': {
                'notificaciones': notificaciones,
                'total': len(notificaciones)
            }
        }, 200

    except Exception as e:
        return {'success': False, 'error': 'Error interno'}, 500


@bp.route('/notificaciones/<int:notificacion_id>/leer', methods=['POST'])
@jwt_required()
@limiter.limit("20 per minute")
def marcar_notificacion_leida(notificacion_id):
    """Marcar una notificación como leída"""
    try:
        usuario_id = get_jwt_identity()
        
        NotificacionActividad.marcar_leida(notificacion_id)
        
        return {
            'success': True,
            'data': {'mensaje': 'Notificación marcada como leída'}
        }, 200

    except Exception as e:
        return {'success': False, 'error': 'Error interno'}, 500


# ============================================================
# 6. HISTORIAL Y ESTADÍSTICAS
# ============================================================

@bp.route('/<int:grupo_id>/historial', methods=['GET'])
@jwt_required()
@limiter.limit("20 per minute")
def obtener_historial_grupo(grupo_id):
    """Obtener historial de actividades y resultados de un grupo"""
    try:
        actividades = ActividadGrupo.obtener_por_grupo(grupo_id)
        
        # Obtener resultados para cada actividad
        resultados = ResultadoActividadGrupal.obtener_por_grupo(grupo_id)
        
        return {
            'success': True,
            'data': {
                'actividades': actividades,
                'resultados': resultados,
                'total_actividades': len(actividades)
            }
        }, 200

    except Exception as e:
        return {'success': False, 'error': 'Error interno'}, 500


@bp.route('/<int:grupo_id>/emociones', methods=['GET'])
@jwt_required()
@limiter.limit("20 per minute")
def obtener_historial_emociones(grupo_id):
    """Obtener historial de emociones dominantes del grupo"""
    try:
        limite = request.args.get('limite', 10, type=int)
        
        historial = ResultadoActividadGrupal.obtener_historial_emociones(grupo_id, limite)
        
        return {
            'success': True,
            'data': {
                'historial': historial,
                'total': len(historial)
            }
        }, 200

    except Exception as e:
        return {'success': False, 'error': 'Error interno'}, 500
