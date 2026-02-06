from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.services.usuario_service import UsuarioService
from backend.services.resultados_service import ResultadosService
from backend.utils.helpers import Helpers
from backend.utils.seguridad import role_required
from backend.database.connection import DatabaseConnection, get_db_connection
import os
from werkzeug.utils import secure_filename

bp = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')

UPLOAD_FOLDER = 'uploads/usuarios'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ============================================
# ✅ NUEVO: Obtener perfil del usuario autenticado
# ============================================
@bp.route('/perfil', methods=['GET'])
@jwt_required()
def get_perfil():
    """Obtiene el perfil completo del usuario autenticado"""
    try:
        user_id = get_jwt_identity()
        print(f"[PERFIL] Obteniendo perfil para usuario ID: {user_id}")
        
        usuario = UsuarioService.get_usuario_with_stats(user_id)

        if not usuario:
            return Helpers.format_response(False, "Usuario no encontrado", status=404)

        # Remover contraseña
        usuario.pop('contrasena', None)
        
        print(f"[PERFIL] Usuario encontrado: {usuario.get('nombre')} {usuario.get('apellido')}")

        return Helpers.format_response(True, data={"usuario": usuario})
        
    except Exception as e:
        print(f"[ERROR] get_perfil: {str(e)}")
        import traceback
        traceback.print_exc()
        return Helpers.format_response(False, str(e), status=500)


# ============================================
# ✅ NUEVO: Actualizar perfil del usuario autenticado
# ============================================
@bp.route('/perfil', methods=['PUT'])
@jwt_required()
def update_perfil():
    """Actualiza el perfil del usuario autenticado"""
    try:
        user_id = get_jwt_identity()
        print(f"\n{'='*60}")
        print(f"[UPDATE PERFIL] Actualizando perfil para usuario ID: {user_id}")
        print(f"{'='*60}")
        
        # Obtener usuario actual para validaciones
        usuario_actual = UsuarioService.get_usuario_by_id(user_id)
        if not usuario_actual:
            return Helpers.format_response(False, "Usuario no encontrado", 404)
        
        print(f"[UPDATE PERFIL] Usuario actual: {usuario_actual.get('nombre')} - Provider: {usuario_actual.get('auth_provider')}")
        
        # Obtener datos del formulario
        data = {}
        
        # Campos de texto
        if request.form.get('nombre'):
            data['nombre'] = request.form.get('nombre')
        if request.form.get('apellido'):
            data['apellido'] = request.form.get('apellido')
        if request.form.get('correo'):
            data['correo'] = request.form.get('correo')
        if request.form.get('genero'):
            data['genero'] = request.form.get('genero')
        if request.form.get('fecha_nacimiento'):
            data['fecha_nacimiento'] = request.form.get('fecha_nacimiento')
        if request.form.get('edad'):
            data['edad'] = int(request.form.get('edad'))
        
        # Campos booleanos
        if request.form.get('usa_medicamentos') is not None:
            usa_med = request.form.get('usa_medicamentos')
            data['usa_medicamentos'] = usa_med.lower() in ['true', '1', 'yes'] if isinstance(usa_med, str) else bool(usa_med)
        
        if request.form.get('notificaciones') is not None:
            notif = request.form.get('notificaciones')
            data['notificaciones'] = notif.lower() in ['true', '1', 'yes'] if isinstance(notif, str) else bool(notif)
        
        # VALIDACION DE CONTRASENAS
        contrasenaActual = request.form.get('contraseñaActual')
        contrasenaNueva = request.form.get('contraseñaNueva')
        
        # Solo procesar contraseñas si el usuario NO es de Google
        if usuario_actual.get('auth_provider') != 'google':
            if contrasenaNueva and contrasenaNueva.strip():
                print(f"[UPDATE PERFIL] Cambio de contrasena solicitado")
                
                # Validar que se proporcionó la contraseña actual
                if not contrasenaActual or not contrasenaActual.strip():
                    print(f"[UPDATE PERFIL] No se proporciono contrasena actual")
                    return Helpers.format_response(False, "Debe proporcionar su contraseña actual para cambiarla", 400)
                
                # Validar longitud de nueva contraseña
                if len(contrasenaNueva) < 6:
                    print(f"[UPDATE PERFIL] Contrasena muy corta")
                    return Helpers.format_response(False, "La nueva contraseña debe tener al menos 6 caracteres", 400)
                
                # Verificar contraseña actual
                from werkzeug.security import check_password_hash
                
                if not check_password_hash(usuario_actual.get('contrasena'), contrasenaActual):
                    print(f"[UPDATE PERFIL] Contrasena actual incorrecta")
                    return Helpers.format_response(False, "La contraseña actual es incorrecta", 400)
                
                # Si todo está bien, agregar la nueva contraseña
                data['contrasena'] = contrasenaNueva
                print(f"[UPDATE PERFIL] Contrasena validada, se actualizara")
            else:
                print(f"[UPDATE PERFIL] No se cambio contrasena")
        else:
            print(f"[UPDATE PERFIL] Usuario de Google, contrasenas ignoradas")
        
        # FOTO DE PERFIL
        if 'foto_perfil' in request.files:
            file = request.files['foto_perfil']
            print(f"[UPDATE PERFIL] Archivo recibido: {file.filename if file else 'None'}")
            
            if file and file.filename and allowed_file(file.filename):
                # Crear directorio si no existe
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                
                # Nombre único para el archivo
                import time
                timestamp = int(time.time())
                filename = secure_filename(file.filename)
                ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
                unique_filename = f"user_{user_id}_{timestamp}.{ext}"
                filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
                
                # Guardar archivo
                file.save(filepath)
                data['foto_perfil'] = f"/uploads/usuarios/{unique_filename}"
                print(f"[UPDATE PERFIL] Foto guardada: {data['foto_perfil']}")
            else:
                print(f"[UPDATE PERFIL] Archivo no valido o vacio")
        
        print(f"[UPDATE PERFIL] Datos a actualizar: {list(data.keys())}")
        
        # Actualizar usuario
        result = UsuarioService.update_usuario(user_id, data)
        print(f"[UPDATE PERFIL] Resultado del servicio: {result.get('success')}")

        if result.get('success'):
            # Obtener usuario actualizado
            usuario_actualizado = UsuarioService.get_usuario_with_stats(user_id)
            usuario_actualizado.pop('contrasena', None)
            
            print(f"[UPDATE PERFIL] Perfil actualizado exitosamente")
            print(f"{'='*60}\n")
            
            return Helpers.format_response(
                True, 
                message="Perfil actualizado correctamente",
                data={"usuario": usuario_actualizado}
            )

        print(f"[UPDATE PERFIL] Error: {result.get('error')}")
        print(f"{'='*60}\n")
        return Helpers.format_response(False, result.get('error', "Error al actualizar"), 400)
        
    except Exception as e:
        print(f"[ERROR] update_perfil: {str(e)}")
        import traceback
        traceback.print_exc()
        return Helpers.format_response(False, str(e), status=500)


# ============================================
# Obtener usuario autenticado (alias de /perfil)
# ============================================
@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    usuario = UsuarioService.get_usuario_with_stats(user_id)

    if not usuario:
        return Helpers.format_response(False, "Usuario no encontrado", status=404)

    usuario.pop('contrasena', None)

    return Helpers.format_response(True, data=usuario)


# ============================================
# Estadísticas (admin)
# ============================================
@bp.route('/statistics', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_statistics():
    try:
        with DatabaseConnection.get_connection() as conn:
            cursor = conn.cursor(dictionary=True)

            cursor.execute("SELECT COUNT(*) AS total FROM usuario")
            total_usuarios = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) AS total
                FROM usuario
                WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            """)
            usuarios_activos = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) AS total
                FROM usuario
                WHERE usa_medicamentos = 1
            """)
            total_medicamentos = cursor.fetchone()["total"]

            cursor.close()

        tasa_actividad = 0
        if total_usuarios > 0:
            tasa_actividad = round((usuarios_activos / total_usuarios) * 100, 1)

        return Helpers.format_response(True, data={
            "totalUsuarios": total_usuarios,
            "usuariosActivos": usuarios_activos,
            "usuariosUsan_medicamentos": total_medicamentos,
            "tasaActividad": tasa_actividad
        })

    except Exception as e:
        print(f"[ERROR] statistics: {str(e)}")
        return Helpers.format_response(False, str(e), status=500)


# ============================================
# Lista simple (admin)
# ============================================
@bp.route('/lista', methods=['GET'])
@jwt_required()
def get_usuarios_simple():
    print("\n" + "="*60)
    print("[INFO] ENDPOINT /usuarios/lista LLAMADO")
    print("="*60)
    
    current_user_id = get_jwt_identity()
    print(f"[INFO] Usuario autenticado ID: {current_user_id}")
    
    current_user = UsuarioService.get_usuario_by_id(current_user_id)
    print(f"[INFO] Usuario rol: {current_user.get('rol') if current_user else 'NO ENCONTRADO'}")

    if not current_user or current_user.get('rol') != 'admin':
        print("[ERROR] ACCESO DENEGADO - No es admin")
        return Helpers.format_response(False, "Sin permisos", 403)

    print("[OK] Usuario es admin - Procediendo...")
    
    # PRUEBA DIRECTA A LA BASE DE DATOS
    try:
        print("\n[TEST] INICIANDO PRUEBA DIRECTA A LA BD...")
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT COUNT(*) as total FROM usuario")
        count_result = cursor.fetchone()
        print(f"[TEST] Total usuarios en BD: {count_result['total']}")
        
        cursor.execute("SELECT * FROM usuario LIMIT 5")
        usuarios_directos = cursor.fetchall()
        
        print(f"[TEST] Usuarios obtenidos directamente: {len(usuarios_directos)}")
        if usuarios_directos:
            print(f"[TEST] Primer usuario directo: {usuarios_directos[0]}")
        
        cursor.close()
        conn.close()
        print("[TEST] Prueba directa completada\n")
        
    except Exception as e:
        print(f"[ERROR] Error en prueba directa: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # LLAMAR AL SERVICE NORMAL
    usuarios = UsuarioService.get_all_usuarios_simple()
    
    print(f"\n[RESPONSE] RESPUESTA FINAL:")
    print(f"[RESPONSE] Usuarios a enviar: {len(usuarios)}")
    if usuarios:
        print(f"[RESPONSE] Primer usuario: {usuarios[0]}")
    else:
        print("[WARNING] LISTA VACIA")
    print("="*60 + "\n")
    
    return Helpers.format_response(True, data=usuarios)


# ============================================
# Listar usuarios (admin)
# ============================================
@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_all_usuarios():
    # Devolver todos los usuarios (el frontend hace paginación client-side)
    usuarios = UsuarioService.get_all_usuarios()

    return Helpers.format_response(True, data=usuarios)


# ============================================
# Obtener usuario por ID
# ============================================
@bp.route('/<int:id_usuario>', methods=['GET'])
@jwt_required()
def get_usuario(id_usuario):
    current_user_id = get_jwt_identity()
    current_user = UsuarioService.get_usuario_by_id(current_user_id)

    if current_user_id != id_usuario and (not current_user or current_user.get('rol') != 'admin'):
        return Helpers.format_response(False, "No tienes permisos", 403)

    usuario = UsuarioService.get_usuario_with_stats(id_usuario)

    if not usuario:
        return Helpers.format_response(False, "Usuario no encontrado", 404)

    usuario.pop('contrasena', None)

    return Helpers.format_response(True, data=usuario)


# ============================================
# Buscar usuarios (por nombre / correo)
# Obtener estadísticas de un usuario
# ============================================
@bp.route('/<int:id_usuario>/estadisticas', methods=['GET'])
@jwt_required()
def get_usuario_estadisticas(id_usuario):
    current_user_id = get_jwt_identity()
    current_user = UsuarioService.get_usuario_by_id(current_user_id)

    # Permitir que el propio usuario vea sus estadísticas o que un admin las vea
    if current_user_id != id_usuario and (not current_user or current_user.get('rol') != 'admin'):
        return Helpers.format_response(False, "No tienes permisos", 403)

    try:
        # Conteo de audios del usuario
        with DatabaseConnection.get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("SELECT COUNT(*) AS total FROM audio WHERE id_usuario = %s", (id_usuario,))
                total_audios = cursor.fetchone().get('total', 0)
            except Exception:
                total_audios = 0
            cursor.close()

        # Estadísticas de resultados (stress/anxiety, total, etc.)
        resultados_stats = ResultadosService.get_estadisticas_usuario(id_usuario) or {}
        ultimos = ResultadosService.get_ultimos_resultados(id_usuario, 1) or []
        ultimo_fecha = None
        if ultimos and isinstance(ultimos, list) and len(ultimos) > 0:
            ultimo_fecha = ultimos[0].get('fecha_analisis')

        estadisticas_usuario = {
            'totalAudios': int(total_audios or 0),
            'totalAnalisis': int(resultados_stats.get('total', 0)),
            'promedioEstres': float(resultados_stats.get('promedio_estres', 0)),
            'promedioAnsiedad': float(resultados_stats.get('promedio_ansiedad', 0)),
            'ultimoAnalisis': str(ultimo_fecha) if ultimo_fecha else None,
            'totalGrupos': 0,
            'alertasActivas': 0,
        }

        return Helpers.format_response(True, data=estadisticas_usuario)
    except Exception as e:
        print(f"[ERROR] estadisticas usuario: {str(e)}")
        import traceback
        traceback.print_exc()
        return Helpers.format_response(False, str(e), status=500)


# ============================================
# Buscar usuarios (por nombre / correo) - disponible para usuarios autenticados
# ============================================
@bp.route('/search', methods=['GET'])
@jwt_required()
def search_usuarios():
    q = request.args.get('query', '', type=str)
    if not q or len(q.strip()) < 1:
        return Helpers.format_response(True, data=[])
    try:
        results = UsuarioService.search_users(q.strip(), limit=20)
        return Helpers.format_response(True, data=results)
    except Exception as e:
        print(f"[ERROR] search_usuarios: {e}")
        return Helpers.format_response(False, str(e), status=500)


# ============================================
# Actualizar usuario por ID (admin o el mismo usuario)
# ============================================
@bp.route('/<int:id_usuario>', methods=['PUT'])
@jwt_required()
def update_usuario(id_usuario):
    current_user_id = get_jwt_identity()
    current_user = UsuarioService.get_usuario_by_id(current_user_id)

    if current_user_id != id_usuario and (not current_user or current_user.get('rol') != 'admin'):
        return Helpers.format_response(False, "Sin permisos", 403)

    data = request.json
    result = UsuarioService.update_usuario(id_usuario, data)

    if result.get('success'):
        return Helpers.format_response(True, message=result['message'])

    return Helpers.format_response(False, result.get('error', "Error"), 400)


# ============================================
# Cambiar estado (activar/desactivar) usuario
# ============================================
@bp.route('/<int:id_usuario>/estado', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def set_usuario_estado(id_usuario):
    current_user_id = get_jwt_identity()

    # No permitir que un admin se desactive a sí mismo
    if current_user_id == id_usuario:
        return Helpers.format_response(False, "No puedes desactivar tu propia cuenta", 403)

    data = request.json or {}
    if 'activo' not in data:
        return Helpers.format_response(False, "Falta el campo 'activo'", 400)

    activo = bool(data.get('activo'))
    result = UsuarioService.set_estado_usuario(id_usuario, activo)

    if result.get('success'):
        return Helpers.format_response(True, message=result.get('message', 'Estado actualizado'))

    return Helpers.format_response(False, result.get('error', 'Error actualizando estado'), 400)


# ============================================
# Eliminar usuario
# ============================================
@bp.route('/<int:id_usuario>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_usuario(id_usuario):
    result = UsuarioService.delete_usuario(id_usuario)

    if result.get('success'):
        return Helpers.format_response(True, message=result['message'])

    return Helpers.format_response(False, result.get('error', "Error"), 400)
