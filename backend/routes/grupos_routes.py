# backend/routes/grupos_routes.py
from flask import Blueprint, request, jsonify
import traceback
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.grupo import Grupo
from backend.models.grupo_miembro import GrupoMiembro
from backend.models.actividad_grupo import ActividadGrupo, ParticipacionActividad
from backend.models.usuario import Usuario
from backend.models.rol_usuario import RolUsuario
from backend.models.invitacion_grupo import InvitacionGrupo
from backend.utils.security_middleware import limiter
from datetime import datetime

bp = Blueprint('grupos', __name__, url_prefix='/api/grupos')


# ============================================================
# GRUPOS PÚBLICOS - Para búsqueda de grupos
# ============================================================

@bp.route('/publicos', methods=['GET'])
@jwt_required()
def get_public_groups():
    """Obtener todos los grupos públicos disponibles para unirse"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        # Obtener grupos públicos
        from database.connection import DatabaseConnection
        
        query = """
            SELECT g.*, 
                   u.nombre as nombre_facilitador,
                   u.apellido as apellido_facilitador,
                   (SELECT COUNT(*) FROM grupo_miembros gm WHERE gm.id_grupo = g.id_grupo AND gm.activo = 1) as total_miembros,
                   EXISTS(SELECT 1 FROM grupo_miembros gm2 WHERE gm2.id_grupo = g.id_grupo AND gm2.id_usuario = %s AND gm2.activo = 1) as es_miembro
            FROM grupos g
            LEFT JOIN usuario u ON g.id_facilitador = u.id_usuario
            WHERE g.activo = 1 AND g.privacidad = 'publico'
            ORDER BY g.fecha_creacion DESC
        """
        
        grupos = DatabaseConnection.execute_query(query, (current_user_id,))
        
        return jsonify({
            'success': True,
            'data': grupos or []
        }), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print("[GRUPOS] Error en get_public_groups:\n", tb)
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# INVITACIONES - Endpoints para gestión de invitaciones
# ============================================================

@bp.route('/invitaciones', methods=['GET'])
@jwt_required()
def get_my_invitations():
    """Obtener invitaciones pendientes del usuario actual"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        invitaciones = InvitacionGrupo.get_invitaciones_pendientes_usuario(current_user_id)
        
        return jsonify({
            'success': True,
            'data': invitaciones or []
        }), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print("[GRUPOS] Error en get_my_invitations:\n", tb)
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/invitaciones/historial', methods=['GET'])
@jwt_required()
def get_invitations_history():
    """Obtener historial de todas las invitaciones del usuario"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        limit = request.args.get('limit', 50, type=int)
        historial = InvitacionGrupo.get_historial_usuario(current_user_id, limit)
        
        return jsonify({
            'success': True,
            'data': historial or []
        }), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print("[GRUPOS] Error en get_invitations_history:\n", tb)
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/invitaciones/<int:id_invitacion>', methods=['GET'])
@jwt_required()
def get_invitation_detail(id_invitacion):
    """Obtener detalle de una invitación específica"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        invitacion = InvitacionGrupo.get_by_id(id_invitacion)
        
        if not invitacion:
            return jsonify({'success': False, 'error': 'Invitación no encontrada'}), 404
        
        # Verificar que el usuario sea el invitado o el invitador
        if invitacion['id_usuario_invitado'] != current_user_id and invitacion.get('id_usuario_invita') != current_user_id:
            return jsonify({'success': False, 'error': 'No tienes permiso para ver esta invitación'}), 403
        
        return jsonify({
            'success': True,
            'data': invitacion
        }), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print("[GRUPOS] Error en get_invitation_detail:\n", tb)
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/invitaciones/<int:id_invitacion>/aceptar', methods=['POST'])
@jwt_required()
def accept_invitation(id_invitacion):
    """Aceptar una invitación a un grupo"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        # Verificar que la invitación existe y es del usuario
        invitacion = InvitacionGrupo.get_by_id(id_invitacion)
        
        if not invitacion:
            return jsonify({'success': False, 'error': 'Invitación no encontrada'}), 404
        
        if invitacion['id_usuario_invitado'] != current_user_id:
            return jsonify({'success': False, 'error': 'Esta invitación no es para ti'}), 403
        
        if invitacion['estado'] != 'pendiente':
            return jsonify({'success': False, 'error': f'Esta invitación ya fue {invitacion["estado"]}'}), 400
        
        # Aceptar invitación
        resultado = InvitacionGrupo.aceptar_invitacion(id_invitacion, current_user_id)
        
        if resultado.get('success'):
            return jsonify({
                'success': True,
                'message': f'Te has unido al grupo "{invitacion.get("nombre_grupo", "")}"',
                'data': resultado.get('data')
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': resultado.get('error', 'Error al aceptar invitación')
            }), 400
        
    except Exception as e:
        tb = traceback.format_exc()
        print("[GRUPOS] Error en accept_invitation:\n", tb)
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/invitaciones/<int:id_invitacion>/rechazar', methods=['POST'])
@jwt_required()
def reject_invitation(id_invitacion):
    """Rechazar una invitación a un grupo"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        # Verificar que la invitación existe y es del usuario
        invitacion = InvitacionGrupo.get_by_id(id_invitacion)
        
        if not invitacion:
            return jsonify({'success': False, 'error': 'Invitación no encontrada'}), 404
        
        if invitacion['id_usuario_invitado'] != current_user_id:
            return jsonify({'success': False, 'error': 'Esta invitación no es para ti'}), 403
        
        if invitacion['estado'] != 'pendiente':
            return jsonify({'success': False, 'error': f'Esta invitación ya fue {invitacion["estado"]}'}), 400
        
        # Rechazar invitación
        resultado = InvitacionGrupo.rechazar_invitacion(id_invitacion, current_user_id)
        
        if resultado.get('success'):
            return jsonify({
                'success': True,
                'message': 'Invitación rechazada'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': resultado.get('error', 'Error al rechazar invitación')
            }), 400
        
    except Exception as e:
        tb = traceback.format_exc()
        print("[GRUPOS] Error en reject_invitation:\n", tb)
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================
# GRUPOS - CRUD
# ============================================================

@bp.route('/', methods=['GET'])
@jwt_required()
def get_all_groups():
    """Obtener todos los grupos disponibles (públicos o donde el usuario es miembro)"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            # Si por alguna razón el identity es un dict
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        # Obtener los grupos del usuario
        grupos_usuario = GrupoMiembro.get_user_groups(current_user_id)
        
        return jsonify(grupos_usuario), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print("[GRUPOS] Error en get_all_groups:\n", tb)
        return jsonify({'error': str(e), 'trace': tb}), 500


@bp.route('/', methods=['POST'])
@jwt_required()
def create_group():
    """Crear un nuevo grupo"""
    try:
        data = request.get_json() or {}
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        # Aceptar tanto 'nombre_grupo' como 'nombre' desde el frontend
        nombre = data.get('nombre_grupo') or data.get('nombre')
        descripcion = data.get('descripcion') or data.get('description')

        # Validaciones
        if not nombre:
            return jsonify({'error': 'El nombre del grupo es requerido'}), 400

        # Crear grupo
        id_grupo = Grupo.create(
            nombre_grupo=nombre,
            id_facilitador=current_user_id,
            descripcion=descripcion,
            tipo_grupo=data.get('tipo_grupo', 'apoyo'),
            privacidad=data.get('privacidad', 'privado'),
            max_participantes=data.get('max_participantes'),
            fecha_inicio=data.get('fecha_inicio'),
            fecha_fin=data.get('fecha_fin')
        )
        
        # Si el método devolvió un dict con metadata, extraer el id
        created_id = None
        if isinstance(id_grupo, dict):
            created_id = id_grupo.get('last_id') or id_grupo.get('lastrowid') or id_grupo.get('lastInsertId')
        else:
            try:
                created_id = int(id_grupo)
            except Exception:
                created_id = id_grupo

        # Agregar al facilitador como miembro
        grupo = Grupo.get_by_id(created_id)
        GrupoMiembro.add_member(created_id, current_user_id, 'facilitador')

        return jsonify({
            'message': 'Grupo creado exitosamente',
            'id_grupo': created_id,
            'codigo_acceso': grupo.get('codigo_acceso') if grupo else None
        }), 201
        
    except Exception as e:
        tb = traceback.format_exc()
        print("[GRUPOS] Error en create_group:\n", tb)
        return jsonify({'error': str(e), 'trace': tb}), 500


@bp.route('/<int:id_grupo>', methods=['GET'])
@jwt_required()
def get_group(id_grupo):
    """Obtener información de un grupo"""
    try:
        grupo = Grupo.get_by_id(id_grupo)
        if not grupo:
            return jsonify({'error': 'Grupo no encontrado'}), 404
        
        # Verificar si el usuario es miembro
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        miembro = GrupoMiembro.is_member(id_grupo, current_user_id)
        
        if not miembro and grupo['privacidad'] == 'privado':
            return jsonify({'error': 'No tienes acceso a este grupo'}), 403
        
        return jsonify(grupo), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_grupo>', methods=['PUT'])
@jwt_required()
def update_group(id_grupo):
    """Actualizar información del grupo"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        data = request.get_json()
        
        # Verificar que sea facilitador
        grupo = Grupo.get_by_id(id_grupo)
        if not grupo:
            return jsonify({'error': 'Grupo no encontrado'}), 404
        
        if grupo['id_facilitador'] != current_user_id:
            return jsonify({'error': 'Solo el facilitador puede actualizar el grupo'}), 403
        
        # Actualizar
        Grupo.update(id_grupo, **data)
        
        return jsonify({'message': 'Grupo actualizado exitosamente'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_grupo>', methods=['DELETE'])
@jwt_required()
def delete_group(id_grupo):
    """Eliminar un grupo (soft delete)"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        
        # Verificar que sea facilitador
        grupo = Grupo.get_by_id(id_grupo)
        if not grupo:
            return jsonify({'error': 'Grupo no encontrado'}), 404
        
        if grupo['id_facilitador'] != current_user_id:
            return jsonify({'error': 'Solo el facilitador puede eliminar el grupo'}), 403
        
        Grupo.delete(id_grupo)
        return jsonify({'message': 'Grupo eliminado exitosamente'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================
# MIEMBROS - GESTIÓN
# ============================================================

@bp.route('/codigo/<codigo>', methods=['POST'])
@jwt_required()
def join_group(codigo):
    """Unirse a un grupo por código de acceso"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        grupo = Grupo.get_by_codigo(codigo)
        
        if not grupo:
            return jsonify({'error': 'Código inválido'}), 404
        
        # Verificar si ya es miembro
        miembro = GrupoMiembro.is_member(grupo['id_grupo'], current_user_id)
        if miembro:
            return jsonify({'error': 'Ya eres miembro de este grupo'}), 400
        
        # Verificar límite de participantes
        if not Grupo.verify_max_participantes(grupo['id_grupo']):
            return jsonify({'error': 'El grupo ha alcanzado su límite de participantes'}), 400
        
        # Agregar miembro
        GrupoMiembro.add_member(grupo['id_grupo'], current_user_id)
        
        return jsonify({
            'message': 'Te has unido al grupo exitosamente',
            'grupo': grupo
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/mis-grupos', methods=['GET'])
@jwt_required()
def get_my_groups():
    """Obtener grupos del usuario actual"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        grupos = GrupoMiembro.get_user_groups(current_user_id)
        
        return jsonify(grupos), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_grupo>/miembros', methods=['GET'])
@jwt_required()
def get_group_members(id_grupo):
    """Obtener miembros de un grupo"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        # Verificar acceso: admin o miembro del grupo
        is_admin = RolUsuario.has_role(current_user_id, 'admin')
        miembro = GrupoMiembro.is_member(id_grupo, current_user_id)
        if not miembro and not is_admin:
            return jsonify({'error': 'No tienes acceso a este grupo'}), 403
        
        miembros = GrupoMiembro.get_group_members(id_grupo)
        return jsonify({'success': True, 'data': miembros}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/<int:id_grupo>/miembros', methods=['POST'])
@jwt_required()
def add_group_member(id_grupo):
    """Agregar un miembro al grupo (por usuario existente). Acepta payload con 'usuario_id' o 'correo'."""
    try:
        data = request.get_json() or {}
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        # Verificar que el grupo existe
        grupo = Grupo.get_by_id(id_grupo)
        if not grupo:
            return jsonify({'error': 'Grupo no encontrado'}), 404

        # Verificar permisos: solo facilitador o co_facilitador pueden agregar
        miembro_actual = GrupoMiembro.is_member(id_grupo, current_user_id)
        if not miembro_actual or miembro_actual.get('rol_grupo') not in ['facilitador', 'co_facilitador']:
            return jsonify({'error': 'No tienes permiso para agregar miembros'}), 403

        usuario_id = data.get('usuario_id') or data.get('id')
        if not usuario_id and data.get('correo'):
            usuario = Usuario.get_by_email(data.get('correo'))
            if usuario:
                usuario_id = usuario.get('id_usuario') or usuario.get('id')

        if not usuario_id:
            return jsonify({'error': 'Se requiere usuario_id o correo del usuario existente'}), 400

        # Evitar duplicados
        if GrupoMiembro.is_member(id_grupo, usuario_id):
            return jsonify({'error': 'El usuario ya es miembro del grupo'}), 400

        GrupoMiembro.add_member(id_grupo, usuario_id)
        return jsonify({'message': 'Miembro agregado exitosamente'}), 201

    except Exception as e:
        tb = traceback.format_exc()
        print('[GRUPOS] Error en add_group_member:\n', tb)
        return jsonify({'error': str(e), 'trace': tb}), 500


@bp.route('/<int:id_grupo>/miembros/<int:id_usuario>', methods=['PUT'])
@jwt_required()
def update_member_role(id_grupo, id_usuario):
    """Actualizar el rol de un miembro en el grupo"""
    try:
        data = request.get_json() or {}
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        
        nuevo_rol = data.get('rol_grupo') or data.get('rol')
        if not nuevo_rol:
            return jsonify({'error': 'Se requiere el nuevo rol'}), 400
        
        roles_validos = ['facilitador', 'co_facilitador', 'participante', 'observador']
        if nuevo_rol not in roles_validos:
            return jsonify({'error': f'Rol inválido. Roles permitidos: {", ".join(roles_validos)}'}), 400
        
        grupo = Grupo.get_by_id(id_grupo)
        if not grupo:
            return jsonify({'error': 'Grupo no encontrado'}), 404
        
        is_admin = RolUsuario.has_role(current_user_id, 'admin')
        is_facilitator = grupo['id_facilitador'] == current_user_id
        
        if not (is_facilitator or is_admin):
            return jsonify({'error': 'No tienes permiso para cambiar roles'}), 403
        
        miembro = GrupoMiembro.is_member(id_grupo, id_usuario)
        if not miembro:
            return jsonify({'error': 'El usuario no es miembro del grupo'}), 404
        
        GrupoMiembro.update_rol(miembro['id_grupo_miembro'], nuevo_rol)
        return jsonify({'message': 'Rol actualizado exitosamente', 'nuevo_rol': nuevo_rol}), 200
        
    except Exception as e:
        tb = traceback.format_exc()
        print('[GRUPOS] Error en update_member_role:\n', tb)
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_grupo>/miembros/<int:id_usuario>', methods=['DELETE'])
@jwt_required()
def remove_member(id_grupo, id_usuario):
    """Remover un miembro del grupo"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        
        # Verificar que sea facilitador, admin o el mismo usuario
        grupo = Grupo.get_by_id(id_grupo)
        if not grupo:
            return jsonify({'error': 'Grupo no encontrado'}), 404
        
        is_admin = RolUsuario.has_role(current_user_id, 'admin')
        is_facilitator = grupo['id_facilitador'] == current_user_id
        is_self = current_user_id == id_usuario
        
        if not (is_facilitator or is_self or is_admin):
            return jsonify({'error': 'No tienes permiso para esta acción'}), 403
        
        GrupoMiembro.remove_member(id_grupo, id_usuario)
        return jsonify({'message': 'Miembro removido exitosamente'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_grupo>/estadisticas', methods=['GET'])
@jwt_required()
def get_group_stats(id_grupo):
    """Obtener estadísticas del grupo usando vista optimizada"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        # Verificar acceso
        miembro = GrupoMiembro.is_member(id_grupo, current_user_id)
        if not miembro:
            return jsonify({'error': 'No tienes acceso a este grupo'}), 403
        
        stats = Grupo.get_estadisticas(id_grupo)
        if not stats:
            return jsonify({'error': 'Grupo no encontrado'}), 404
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/estadisticas', methods=['GET'])
@jwt_required()
def get_global_group_stats():
    """Obtener lista de grupos con estadísticas para administración"""
    try:
        from database.connection import DatabaseConnection
        
        # Usar la vista que ya existe en la base de datos
        query = "SELECT * FROM vista_grupos_estadisticas ORDER BY fecha_creacion DESC"
        
        result = DatabaseConnection.execute_query(query)
        grupos = result if result else []
        
        return jsonify({'data': grupos}), 200
    except Exception as e:
        tb = traceback.format_exc()
        print('[GRUPOS] Error en get_global_group_stats:\n', tb)
        return jsonify({'error': str(e), 'trace': tb}), 500


# ============================================================
# ACTIVIDADES - CRUD
# ============================================================

@bp.route('/<int:id_grupo>/actividades', methods=['POST'])
@jwt_required()
def create_activity(id_grupo):
    """Crear una nueva actividad para el grupo"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        data = request.get_json()
        
        print(f"[DEBUG] create_activity - id_grupo: {id_grupo}, user: {current_user_id}, data: {data}")
        
        # Verificar que sea miembro (facilitador o co-facilitador)
        miembro = GrupoMiembro.is_member(id_grupo, current_user_id)
        print(f"[DEBUG] create_activity - miembro: {miembro}")
        if not miembro or miembro['rol_grupo'] not in ['facilitador', 'co_facilitador']:
            return jsonify({'error': 'No tienes permiso para crear actividades'}), 403
        
        # Validaciones
        if not data.get('titulo'):
            return jsonify({'error': 'El título es requerido'}), 400
        
        # Parsear fechas - soportar múltiples formatos
        def parse_date_field(key):
            v = data.get(key)
            if not v or v == '' or v == 'undefined':
                return None
            try:
                # Formato YYYY-MM-DD HH:MM
                return datetime.strptime(v, '%Y-%m-%d %H:%M')
            except Exception:
                pass
            try:
                # Formato YYYY-MM-DD
                return datetime.strptime(v, '%Y-%m-%d')
            except Exception:
                pass
            try:
                # Formato ISO
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except Exception:
                pass
            # Si no se puede parsear, retornar None
            print(f"[WARN] No se pudo parsear fecha '{v}'")
            return None

        # Aceptar fecha_programada o fecha_inicio como alias
        fecha_programada = parse_date_field('fecha_programada') or parse_date_field('fecha_inicio')
        
        # Parsear duración
        duracion_estimada = data.get('duracion_estimada')
        if duracion_estimada == '' or duracion_estimada == 'undefined':
            duracion_estimada = None
        elif duracion_estimada is not None:
            try:
                duracion_estimada = int(duracion_estimada)
            except (ValueError, TypeError):
                duracion_estimada = None

        # Crear actividad
        print(f"[DEBUG] create_activity - Creando con: id_grupo={id_grupo}, id_creador={current_user_id}, titulo={data['titulo']}, tipo={data.get('tipo_actividad', 'tarea')}, fecha={fecha_programada}, duracion={duracion_estimada}")
        
        # Obtener creador_participa (por defecto True)
        creador_participa = data.get('creador_participa', True)
        if isinstance(creador_participa, str):
            creador_participa = creador_participa.lower() in ['true', '1', 'yes']
        
        resultado = ActividadGrupo.create(
            id_grupo=id_grupo,
            id_creador=current_user_id,
            titulo=data['titulo'],
            descripcion=data.get('descripcion'),
            tipo_actividad=data.get('tipo_actividad', 'tarea'),
            fecha_programada=fecha_programada,
            duracion_estimada=duracion_estimada,
            creador_participa=creador_participa
        )
        print(f"[DEBUG] create_activity - Resultado: {resultado}")
        
        # Extraer el ID de la actividad creada (el método devuelve un dict)
        id_actividad = resultado.get('last_id') if isinstance(resultado, dict) else resultado
        
        # ✅ AGREGAR AUTOMÁTICAMENTE a TODOS los miembros del grupo como participantes
        try:
            from backend.database.connection import DatabaseConnection
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Obtener todos los miembros activos del grupo
            cursor.execute("""
                SELECT gm.id_usuario, u.nombre 
                FROM grupo_miembros gm
                JOIN usuario u ON gm.id_usuario = u.id_usuario
                WHERE gm.id_grupo = %s AND gm.activo = 1
            """, (id_grupo,))
            
            miembros = cursor.fetchall()
            participantes_agregados = 0
            
            for m in miembros:
                # Si el creador NO quiere participar, omitirlo
                if m['id_usuario'] == current_user_id and not creador_participa:
                    print(f"🚫 Omitiendo al creador (no participa): {m['nombre']}")
                    continue
                    
                try:
                    cursor.execute("""
                        INSERT INTO participacion_actividad 
                        (id_actividad, id_usuario, estado, completada, fecha_registro)
                        VALUES (%s, %s, 'invitado', 0, NOW())
                    """, (id_actividad, m['id_usuario']))
                    participantes_agregados += 1
                except Exception as e:
                    print(f"⚠️ Error agregando participante {m['nombre']}: {e}")
            
            conn.commit()
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            print(f"✅ Actividad '{data['titulo']}' creada con {participantes_agregados} participantes")
        except Exception as e:
            print(f"⚠️ Error agregando participantes: {e}")
        
        return jsonify({
            'message': 'Actividad creada exitosamente',
            'id_actividad': id_actividad,
            'participantes_agregados': participantes_agregados if 'participantes_agregados' in dir() else 0
        }), 201
        
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[ERROR] create_activity: {str(e)}\n{tb}")
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id_grupo>/actividades', methods=['GET'])
@jwt_required()
def get_group_activities(id_grupo):
    """Obtener actividades de un grupo"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity

        # Verificar acceso: admin o miembro del grupo
        is_admin = RolUsuario.has_role(current_user_id, 'admin')
        miembro = GrupoMiembro.is_member(id_grupo, current_user_id)
        if not miembro and not is_admin:
            return jsonify({'error': 'No tienes acceso a este grupo'}), 403
        
        completada = request.args.get('completada')
        if completada is not None:
            completada = completada.lower() == 'true'
        
        actividades = ActividadGrupo.get_by_grupo(id_grupo, completada)
        return jsonify(actividades), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/actividades/<int:id_actividad>', methods=['DELETE'])
@jwt_required()
def delete_activity(id_actividad):
    """Eliminar una actividad del grupo"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        
        # Verificar que la actividad existe
        actividad = ActividadGrupo.get_by_id(id_actividad)
        if not actividad:
            return jsonify({'error': 'Actividad no encontrada'}), 404
        
        # Verificar que sea facilitador del grupo o admin
        grupo = Grupo.get_by_id(actividad['id_grupo'])
        if not grupo:
            return jsonify({'error': 'Grupo no encontrado'}), 404
        
        is_admin = RolUsuario.has_role(current_user_id, 'admin')
        if grupo['id_facilitador'] != current_user_id and not is_admin:
            return jsonify({'error': 'Solo el facilitador o admin puede eliminar actividades'}), 403
        
        ActividadGrupo.delete(id_actividad)
        return jsonify({'message': 'Actividad eliminada exitosamente'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/actividades/<int:id_actividad>', methods=['GET'])
@jwt_required()
def get_activity(id_actividad):
    """Obtener detalles de una actividad con participantes"""
    try:
        actividad = ActividadGrupo.get_by_id(id_actividad)
        if not actividad:
            return jsonify({'error': 'Actividad no encontrada'}), 404
        
        # Obtener participantes de la actividad
        participantes = ParticipacionActividad.get_activity_participants(id_actividad)
        
        return jsonify({
            'actividad': actividad,
            'participantes': participantes or []
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/actividades/<int:id_actividad>/participantes', methods=['GET'])
@jwt_required()
@limiter.limit("60 per minute")  # Límite generoso para carga de resultados
def get_activity_participants(id_actividad):
    """Obtener todos los participantes de una actividad con sus resultados de análisis"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        
        # Verificar que la actividad existe
        actividad = ActividadGrupo.get_by_id(id_actividad)
        if not actividad:
            return jsonify({'success': False, 'error': 'Actividad no encontrada'}), 404
        
        # Verificar que el usuario es miembro del grupo
        if not GrupoMiembro.is_member(actividad['id_grupo'], current_user_id):
            return jsonify({'success': False, 'error': 'No tienes acceso a esta actividad'}), 403
        
        # Obtener participantes con sus resultados (ya incluye LEFT JOIN con resultado_analisis)
        participantes = ParticipacionActividad.get_activity_participants(id_actividad)
        
        return jsonify({
            'success': True,
            'participantes': participantes,
            'total': len(participantes),
            'completados': sum(1 for p in participantes if p.get('estado') == 'completado' or p.get('completada'))
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/actividades/<int:id_actividad>/mi-participacion', methods=['GET'])
@jwt_required()
def get_my_activity_participation(id_actividad):
    """Obtener la participación del usuario actual en una actividad"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        
        # Verificar que la actividad existe
        actividad = ActividadGrupo.get_by_id(id_actividad)
        if not actividad:
            return jsonify({'success': False, 'error': 'Actividad no encontrada'}), 404
        
        # Obtener participación del usuario
        participacion = ParticipacionActividad.get_user_participation(id_actividad, current_user_id)
        
        if participacion:
            return jsonify({
                'success': True,
                'participando': True,
                'participacion': participacion
            }), 200
        else:
            return jsonify({
                'success': True,
                'participando': False,
                'participacion': None
            }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/actividades/<int:id_actividad>/participar', methods=['POST'])
@jwt_required()
def participate_activity(id_actividad):
    """Registrar participación en una actividad"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        data = request.get_json()
        
        # Verificar que la actividad existe
        actividad = ActividadGrupo.get_by_id(id_actividad)
        if not actividad:
            return jsonify({'error': 'Actividad no encontrada'}), 404
        
        # Verificar que sea miembro del grupo
        miembro = GrupoMiembro.is_member(actividad['id_grupo'], current_user_id)
        if not miembro:
            return jsonify({'error': 'No eres miembro de este grupo'}), 403
        
        # Verificar si ya participó
        participacion = ParticipacionActividad.get_user_participation(
            id_actividad, current_user_id
        )
        if participacion:
            return jsonify({'error': 'Ya estás registrado en esta actividad'}), 400
        
        # Registrar participación
        id_participacion = ParticipacionActividad.create(
            id_actividad=id_actividad,
            id_usuario=current_user_id,
            estado_emocional_antes=data.get('estado_emocional_antes'),
            notas_participante=data.get('notas')
        )
        
        return jsonify({
            'message': 'Participación registrada exitosamente',
            'id_participacion': id_participacion
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/actividades/<int:id_actividad>/iniciar', methods=['POST'])
@jwt_required()
def iniciar_actividad(id_actividad):
    """Iniciar una actividad grupal"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        
        # Verificar que la actividad existe
        actividad = ActividadGrupo.get_by_id(id_actividad)
        if not actividad:
            return jsonify({'success': False, 'error': 'Actividad no encontrada'}), 404
        
        # Verificar que el usuario es el creador
        if actividad.get('id_creador') != current_user_id:
            return jsonify({'success': False, 'error': 'No tienes permiso para iniciar esta actividad'}), 403
        
        return jsonify({
            'success': True,
            'message': 'Actividad iniciada exitosamente',
            'id_actividad': id_actividad
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/participacion/<int:id_participacion>/completar', methods=['PUT'])
@jwt_required()
def complete_participation(id_participacion):
    """Marcar participación como completada con análisis de voz opcional"""
    try:
        identity = get_jwt_identity()
        try:
            current_user_id = int(identity)
        except Exception:
            current_user_id = identity.get('id_usuario') if isinstance(identity, dict) else identity
        data = request.get_json()
        
        # Verificar que sea su participación
        participacion = ParticipacionActividad.get_by_id(id_participacion)
        if not participacion:
            return jsonify({'error': 'Participación no encontrada'}), 404
        
        if participacion['id_usuario'] != current_user_id:
            return jsonify({'error': 'No puedes modificar esta participación'}), 403
        
        # Marcar como completada con datos de análisis de voz si vienen
        ParticipacionActividad.mark_completed(
            id_participacion=id_participacion,
            estado_emocional_despues=data.get('estado_emocional_despues'),
            notas_participante=data.get('notas'),
            id_audio=data.get('id_audio'),
            id_analisis=data.get('id_analisis'),
            id_resultado=data.get('id_resultado')
        )
        
        return jsonify({
            'success': True,
            'message': 'Participación completada exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
