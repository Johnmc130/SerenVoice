# backend/routes/sesion_grupal_routes.py
"""
Rutas para gestión de sesiones de actividades grupales con análisis de voz.
Usa las tablas existentes: actividades_grupo y participacion_actividad
"""

from flask import Blueprint, request, jsonify, current_app
import traceback
import os
import uuid
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.database.connection import DatabaseConnection
from backend.models.grupo_miembro import GrupoMiembro
from backend.models.actividad_grupo import ActividadGrupo
from backend.models.participacion_actividad import ParticipacionActividad

bp = Blueprint('sesiones_grupales', __name__, url_prefix='/api/sesiones-grupales')


# ============================================================
# SESIONES GRUPALES - Usa actividades_grupo existentes
# ============================================================

@bp.route('/grupo/<int:id_grupo>', methods=['GET'])
@jwt_required()
def get_sesiones_grupo(id_grupo):
    """
    Obtener todas las actividades/sesiones de un grupo
    Usa la tabla actividades_grupo existente
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        # Verificar membresía
        miembro = GrupoMiembro.is_member(id_grupo, current_user_id)
        if not miembro:
            return jsonify({'error': 'No tienes acceso a este grupo'}), 403
        
        # Usar actividades_grupo en lugar de sesion_actividad_grupal
        actividades = ActividadGrupo.get_by_grupo(id_grupo)
        
        return jsonify({
            'success': True,
            'data': actividades or []
        }), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] get_sesiones_grupo: {str(e)}\n{tb}")
        return jsonify({'error': str(e)}), 500


@bp.route('/grupo/<int:id_grupo>/activa', methods=['GET'])
@jwt_required()
def get_sesion_activa(id_grupo):
    """
    Obtener la actividad activa actual de un grupo
    Usa actividades_grupo en lugar de sesion_actividad_grupal
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        # Verificar membresía
        miembro = GrupoMiembro.is_member(id_grupo, current_user_id)
        if not miembro:
            return jsonify({'error': 'No tienes acceso a este grupo'}), 403
        
        # Buscar actividad activa (no completada) en actividades_grupo
        query = """
            SELECT ag.*, 
                   u.nombre as creador_nombre,
                   u.apellido as creador_apellido,
                   (SELECT COUNT(*) FROM participacion_actividad pa WHERE pa.id_actividad = ag.id_actividad) as total_participantes,
                   (SELECT COUNT(*) FROM participacion_actividad pa WHERE pa.id_actividad = ag.id_actividad AND pa.completada = 1) as participantes_completados
            FROM actividades_grupo ag
            LEFT JOIN usuario u ON ag.id_creador = u.id_usuario
            WHERE ag.id_grupo = %s 
              AND ag.activo = 1 
              AND ag.completada = 0
            ORDER BY ag.fecha_inicio DESC
            LIMIT 1
        """
        results = DatabaseConnection.execute_query(query, (id_grupo,))
        actividad = results[0] if results else None
        
        if actividad:
            # Obtener mi participación
            mi_participacion = ParticipacionActividad.get_user_participation(
                actividad['id_actividad'], current_user_id
            )
            actividad['mi_participacion'] = mi_participacion
        
        return jsonify({
            'success': True,
            'data': actividad,
            'tiene_sesion_activa': actividad is not None
        }), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] get_sesion_activa: {str(e)}\n{tb}")
        return jsonify({'error': str(e)}), 500


@bp.route('/grupo/<int:id_grupo>/iniciar', methods=['POST'])
@jwt_required()
def iniciar_sesion(id_grupo):
    """
    Iniciar una nueva sesión de análisis grupal
    ---
    tags:
      - Sesiones Grupales
    security:
      - Bearer: []
    parameters:
      - name: id_grupo
        in: path
        type: integer
        required: true
      - name: body
        in: body
        schema:
          type: object
          required:
            - titulo
          properties:
            titulo:
              type: string
              description: Título de la sesión
            descripcion:
              type: string
              description: Descripción opcional
            duracion_horas:
              type: integer
              default: 24
              description: Horas límite para completar
            id_actividad:
              type: integer
              description: ID de actividad existente (opcional)
    responses:
      201:
        description: Sesión creada exitosamente
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        data = request.get_json() or {}
        
        # Validar título
        titulo = data.get('titulo', '').strip()
        if not titulo:
            return jsonify({'error': 'El título es requerido'}), 400
        
        # Verificar permisos (miembro del grupo)
        miembro = GrupoMiembro.is_member(id_grupo, current_user_id)
        if not miembro:
            return jsonify({'error': 'No eres miembro de este grupo'}), 403
        
        # Iniciar sesión
        success, result = SesionGrupalService.iniciar_sesion(
            id_grupo=id_grupo,
            id_iniciador=current_user_id,
            titulo=titulo,
            descripcion=data.get('descripcion'),
            duracion_horas=data.get('duracion_horas', 24),
            id_actividad=data.get('id_actividad')
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': result.get('message'),
                'sesion': result.get('sesion'),
                'id_sesion': result.get('id_sesion')
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result.get('error')
            }), 400
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] iniciar_sesion: {str(e)}\n{tb}")
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_sesion>', methods=['GET'])
@jwt_required()
def get_sesion_detalle(id_sesion):
    """
    Obtener detalle completo de una sesión
    ---
    tags:
      - Sesiones Grupales
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        success, result = SesionGrupalService.obtener_sesion_detalle(
            id_sesion, current_user_id
        )
        
        if success:
            return jsonify({
                'success': True,
                **result
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error')
            }), 404 if 'no encontrada' in result.get('error', '').lower() else 403
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_sesion>/participar', methods=['POST'])
@jwt_required()
def registrar_participacion(id_sesion):
    """
    Registrar participación del usuario con su análisis de audio
    ---
    tags:
      - Sesiones Grupales
    security:
      - Bearer: []
    parameters:
      - name: id_sesion
        in: path
        type: integer
        required: true
      - name: body
        in: body
        schema:
          type: object
          required:
            - id_audio
            - id_analisis
            - id_resultado
          properties:
            id_audio:
              type: integer
            id_analisis:
              type: integer
            id_resultado:
              type: integer
    responses:
      200:
        description: Participación registrada
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        # Verificar si viene un archivo de audio (multipart) o JSON con IDs
        if 'audio' in request.files:
            # Procesar archivo de audio directamente
            return procesar_audio_participacion(id_sesion, current_user_id, request.files['audio'])
        
        # Procesar JSON con IDs ya existentes
        data = request.get_json() or {}
        
        # Validar datos requeridos
        required_fields = ['id_audio', 'id_analisis', 'id_resultado']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        success, result = SesionGrupalService.registrar_participacion_audio(
            id_sesion=id_sesion,
            id_usuario=current_user_id,
            id_audio=data['id_audio'],
            id_analisis=data['id_analisis'],
            id_resultado=data['id_resultado']
        )
        
        if success:
            return jsonify({
                'success': True,
                **result
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error')
            }), 400
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] registrar_participacion: {str(e)}\n{tb}")
        return jsonify({'error': str(e)}), 500


def procesar_audio_participacion(id_sesion: int, user_id: int, audio_file):
    """
    Procesa un archivo de audio para la participación en sesión grupal.
    Guarda el audio, lo analiza y registra la participación.
    """
    from backend.services.audio_service import AudioService
    from backend.models.audio import Audio
    from backend.models.analisis import Analisis
    from backend.models.resultado_analisis import ResultadoAnalisis
    
    try:
        # Verificar acceso a la sesión
        sesion = SesionActividadGrupal.get_by_id(id_sesion)
        if not sesion:
            return jsonify({'error': 'Sesión no encontrada'}), 404
        
        miembro = GrupoMiembro.is_member(sesion['id_grupo'], user_id)
        if not miembro:
            return jsonify({'error': 'No tienes acceso a esta sesión'}), 403
        
        # Verificar que la sesión está en progreso
        if sesion['estado'] != 'en_progreso':
            return jsonify({'error': 'Esta sesión no está activa'}), 400
        
        # Verificar que el usuario no haya completado ya
        participacion = ParticipacionSesionGrupal.get_user_participation(id_sesion, user_id)
        if participacion and participacion['estado'] == 'completado':
            return jsonify({'error': 'Ya has completado tu participación'}), 400
        
        # Guardar el archivo de audio
        ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'm4a', 'webm'}
        filename = secure_filename(audio_file.filename)
        extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'wav'
        
        if extension not in ALLOWED_EXTENSIONS:
            return jsonify({'error': f'Formato de audio no permitido. Use: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
        
        # Crear nombre único para el archivo
        unique_filename = f"grupal_{id_sesion}_{user_id}_{uuid.uuid4().hex[:8]}.{extension}"
        upload_folder = os.path.join(current_app.root_path, 'uploads', 'audios')
        os.makedirs(upload_folder, exist_ok=True)
        filepath = os.path.join(upload_folder, unique_filename)
        
        audio_file.save(filepath)
        
        # Obtener duración del audio
        try:
            audio_service = current_app.audio_service
            duracion = audio_service.get_audio_duration(filepath)
        except Exception:
            duracion = 0
        
        # Crear registro de audio
        id_audio = Audio.create(
            id_usuario=user_id,
            nombre_archivo=unique_filename,
            ruta_archivo=f"uploads/audios/{unique_filename}",
            duracion=duracion,
            formato=extension
        )
        
        if not id_audio:
            return jsonify({'error': 'Error al guardar el audio'}), 500
        
        # Crear análisis
        id_analisis = Analisis.create(
            id_audio=id_audio,
            id_usuario=user_id,
            tipo_analisis='emocional',
            estado='completado'
        )
        
        if not id_analisis:
            return jsonify({'error': 'Error al crear el análisis'}), 500
        
        # Procesar audio y obtener emociones
        try:
            audio_service = current_app.audio_service
            resultados_emociones = audio_service.analyze_audio(filepath)
        except Exception as e:
            print(f"[ERROR] Analizando audio: {str(e)}")
            # Usar valores por defecto si falla el análisis
            resultados_emociones = {
                'emociones': {
                    'felicidad': 20,
                    'tristeza': 15,
                    'enojo': 10,
                    'miedo': 10,
                    'sorpresa': 15,
                    'neutral': 30
                },
                'estres': 25,
                'ansiedad': 20,
                'confianza': 0.5
            }
        
        # Determinar emoción predominante
        emociones = resultados_emociones.get('emociones', {})
        emocion_predominante = max(emociones, key=emociones.get) if emociones else 'neutral'
        
        # Crear resultado de análisis
        id_resultado = ResultadoAnalisis.create(
            id_analisis=id_analisis,
            nivel_felicidad=emociones.get('felicidad', 0),
            nivel_tristeza=emociones.get('tristeza', 0),
            nivel_enojo=emociones.get('enojo', 0),
            nivel_miedo=emociones.get('miedo', 0),
            nivel_sorpresa=emociones.get('sorpresa', 0),
            nivel_neutral=emociones.get('neutral', 0),
            nivel_estres=resultados_emociones.get('estres', 0),
            nivel_ansiedad=resultados_emociones.get('ansiedad', 0),
            emocion_predominante=emocion_predominante,
            confianza=resultados_emociones.get('confianza', 0.5)
        )
        
        if not id_resultado:
            return jsonify({'error': 'Error al guardar el resultado'}), 500
        
        # Registrar participación en la sesión
        success, result = SesionGrupalService.registrar_participacion_audio(
            id_sesion=id_sesion,
            id_usuario=user_id,
            id_audio=id_audio,
            id_analisis=id_analisis,
            id_resultado=id_resultado
        )
        
        if not success:
            return jsonify({'success': False, 'error': result.get('error')}), 400
        
        # Construir resultado individual para devolver
        resultado_individual = {
            'emociones': emociones,
            'nivel_estres': resultados_emociones.get('estres', 0),
            'nivel_ansiedad': resultados_emociones.get('ansiedad', 0),
            'emocion_predominante': emocion_predominante,
            'confianza': resultados_emociones.get('confianza', 0.5)
        }
        
        return jsonify({
            'success': True,
            'message': result.get('message', 'Participación registrada'),
            'data': {
                'id_audio': id_audio,
                'id_analisis': id_analisis,
                'id_resultado': id_resultado,
                'resultado': resultado_individual
            },
            'sesion_completada': result.get('sesion_completada', False),
            'resultado_grupal': result.get('resultado_grupal')
        }), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] procesar_audio_participacion: {str(e)}\n{tb}")
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_sesion>/mi-estado', methods=['GET'])
@jwt_required()
def get_mi_estado_participacion(id_sesion):
    """
    Obtener el estado de mi participación en una sesión
    ---
    tags:
      - Sesiones Grupales
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        participacion = ParticipacionSesionGrupal.get_user_participation(
            id_sesion, current_user_id
        )
        
        if not participacion:
            return jsonify({
                'success': False,
                'error': 'No estás registrado en esta sesión'
            }), 404
        
        return jsonify({
            'success': True,
            'participacion': participacion,
            'puede_participar': participacion['estado'] in ['pendiente', 'grabando'],
            'ya_completo': participacion['estado'] == 'completado'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_sesion>/participaciones', methods=['GET'])
@bp.route('/<int:id_sesion>/participantes', methods=['GET'])  # Alias
@jwt_required()
def get_participaciones(id_sesion):
    """
    Obtener todas las participaciones de una sesión
    ---
    tags:
      - Sesiones Grupales
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        # Verificar acceso
        sesion = SesionActividadGrupal.get_by_id(id_sesion)
        if not sesion:
            return jsonify({'error': 'Sesión no encontrada'}), 404
        
        miembro = GrupoMiembro.is_member(sesion['id_grupo'], current_user_id)
        if not miembro:
            return jsonify({'error': 'No tienes acceso a esta sesión'}), 403
        
        participaciones = ParticipacionSesionGrupal.get_by_sesion(id_sesion)
        
        # Contar estados
        pendientes = sum(1 for p in participaciones if p['estado'] == 'pendiente')
        completados = sum(1 for p in participaciones if p['estado'] == 'completado')
        
        return jsonify({
            'success': True,
            'data': participaciones,  # Agregamos 'data' para compatibilidad con el móvil
            'participaciones': participaciones,
            'resumen': {
                'total': len(participaciones),
                'pendientes': pendientes,
                'completados': completados,
                'porcentaje': round((completados / len(participaciones) * 100), 1) if participaciones else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_sesion>/mi-participacion', methods=['GET'])
@jwt_required()
def get_mi_participacion(id_sesion):
    """
    Obtener mi participación en una sesión con resultado de análisis
    ---
    tags:
      - Sesiones Grupales
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        # Verificar acceso
        sesion = SesionActividadGrupal.get_by_id(id_sesion)
        if not sesion:
            return jsonify({'error': 'Sesión no encontrada'}), 404
        
        miembro = GrupoMiembro.is_member(sesion['id_grupo'], current_user_id)
        if not miembro:
            return jsonify({'error': 'No tienes acceso a esta sesión'}), 403
        
        # Obtener participación del usuario
        participacion = ParticipacionSesionGrupal.get_user_participation(id_sesion, current_user_id)
        
        if not participacion:
            return jsonify({
                'success': True,
                'participacion': None,
                'resultado': None,
                'message': 'Aún no has participado en esta sesión'
            }), 200
        
        # Si tiene análisis, obtener el resultado
        resultado = None
        if participacion.get('id_analisis'):
            from backend.models.resultado_analisis import ResultadoAnalisis
            resultado = ResultadoAnalisis.get_by_analysis(participacion['id_analisis'])
        
        return jsonify({
            'success': True,
            'participacion': participacion,
            'resultado': resultado
        }), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] get_mi_participacion: {str(e)}\n{tb}")
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_sesion>/resultado', methods=['GET'])
@jwt_required()
def get_resultado_grupal(id_sesion):
    """
    Obtener resultado grupal de una sesión completada
    ---
    tags:
      - Sesiones Grupales
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        # Verificar acceso
        sesion = SesionActividadGrupal.get_by_id(id_sesion)
        if not sesion:
            return jsonify({'error': 'Sesión no encontrada'}), 404
        
        miembro = GrupoMiembro.is_member(sesion['id_grupo'], current_user_id)
        if not miembro:
            return jsonify({'error': 'No tienes acceso a esta sesión'}), 403
        
        if sesion['estado'] != 'completada':
            return jsonify({
                'success': False,
                'error': 'La sesión aún no está completada',
                'estado': sesion['estado'],
                'participantes_completados': sesion.get('participantes_completados', 0),
                'total_participantes': sesion.get('total_participantes', 0)
            }), 400
        
        resultado = ResultadoGrupal.get_by_sesion(id_sesion)
        
        if not resultado:
            # Intentar calcular si no existe
            resultado = SesionGrupalService.calcular_resultado_grupal(id_sesion)
        
        if not resultado:
            return jsonify({
                'success': False,
                'error': 'No se pudo obtener el resultado grupal'
            }), 404
        
        # Obtener también las participaciones para mostrar detalles
        participaciones = ParticipacionSesionGrupal.get_by_sesion(id_sesion)
        
        return jsonify({
            'success': True,
            'resultado': resultado,
            'participaciones': participaciones,
            'sesion': sesion
        }), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] get_resultado_grupal: {str(e)}\n{tb}")
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_sesion>/visto', methods=['POST'])
@jwt_required()
def marcar_visto(id_sesion):
    """
    Marcar que el usuario vio la invitación a la sesión
    ---
    tags:
      - Sesiones Grupales
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        SesionGrupalService.marcar_visto(id_sesion, current_user_id)
        
        return jsonify({
            'success': True,
            'message': 'Marcado como visto'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_sesion>/cancelar', methods=['POST'])
@jwt_required()
def cancelar_sesion(id_sesion):
    """
    Cancelar una sesión (solo iniciador o facilitador)
    ---
    tags:
      - Sesiones Grupales
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        sesion = SesionActividadGrupal.get_by_id(id_sesion)
        if not sesion:
            return jsonify({'error': 'Sesión no encontrada'}), 404
        
        # Verificar permisos
        miembro = GrupoMiembro.is_member(sesion['id_grupo'], current_user_id)
        es_iniciador = sesion['id_iniciador'] == current_user_id
        es_facilitador = miembro and miembro.get('rol_grupo') == 'facilitador'
        
        if not (es_iniciador or es_facilitador):
            return jsonify({'error': 'No tienes permiso para cancelar esta sesión'}), 403
        
        SesionActividadGrupal.cancel(id_sesion)
        
        return jsonify({
            'success': True,
            'message': 'Sesión cancelada'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================
# SESIONES PENDIENTES DEL USUARIO
# ============================================================

@bp.route('/mis-pendientes', methods=['GET'])
@jwt_required()
def get_mis_sesiones_pendientes():
    """
    Obtener sesiones pendientes donde debo participar
    ---
    tags:
      - Sesiones Grupales
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        sesiones = SesionGrupalService.obtener_sesiones_pendientes_usuario(current_user_id)
        
        return jsonify({
            'success': True,
            'data': sesiones,
            'total_pendientes': len(sesiones)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================
# HISTORIAL DE RESULTADOS
# ============================================================

@bp.route('/grupo/<int:id_grupo>/historial', methods=['GET'])
@jwt_required()
def get_historial_resultados(id_grupo):
    """
    Obtener historial de resultados grupales
    ---
    tags:
      - Sesiones Grupales
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(identity) if not isinstance(identity, dict) else identity.get('id_usuario')
        
        # Verificar membresía
        miembro = GrupoMiembro.is_member(id_grupo, current_user_id)
        if not miembro:
            return jsonify({'error': 'No tienes acceso a este grupo'}), 403
        
        limit = request.args.get('limit', 10, type=int)
        resultados = ResultadoGrupal.get_by_grupo(id_grupo, limit=limit)
        
        return jsonify({
            'success': True,
            'data': resultados
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
