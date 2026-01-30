# backend/routes/admin_routes.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.database.connection import DatabaseConnection
from backend.services.usuario_service import UsuarioService
from backend.models.rol_usuario import RolUsuario
from backend.models.rol import Rol

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ======================================================
# 🛡️ VALIDAR SI EL USUARIO ES ADMIN
# ======================================================
def verificar_admin(user_id):
    try:
        user = UsuarioService.get_usuario_by_id(user_id)

        if not user:
            print(f"❌ Usuario {user_id} no encontrado en la BD")
            return False

        print(f"✅ Usuario: {user.get('correo')} (ID: {user.get('id_usuario')}) - Rol: {user.get('rol')}")

        es_admin = user.get("rol") == "admin"
        if not es_admin:
            print(f"⚠️ Usuario {user.get('correo')} intentó acceder pero su rol es '{user.get('rol')}' (no 'admin')")

        return es_admin
        
    except Exception as e:
        print(f"Error en verificar_admin: {str(e)}")
        return False


# ======================================================
# 📊 ESTADÍSTICAS DEL SISTEMA (DASHBOARD ADMIN)
# ======================================================
@bp.route('/statistics', methods=['GET'])
@jwt_required()
def statistics():
    try:
        user_id = get_jwt_identity()
        print(f"📊 [STATISTICS] Solicitud de user_id: {user_id}")

        # Verificar rol admin
        if not verificar_admin(user_id):
            return jsonify({
                'success': False,
                'error': 'Acceso no autorizado. Se requiere rol administrador.'
            }), 403

        connection = DatabaseConnection.get_connection()
        cursor = connection.cursor(dictionary=True)

        # Total usuarios
        cursor.execute("SELECT COUNT(*) AS total FROM usuario")
        total_usuarios = cursor.fetchone()["total"]

        # Total usuarios que usan medicamentos
        cursor.execute("SELECT COUNT(*) AS total FROM usuario WHERE usa_medicamentos = TRUE")
        total_medicamentos = cursor.fetchone()["total"]

        # Total audios (tabla `audio` en el esquema)
        try:
            cursor.execute("SELECT COUNT(*) AS total FROM audio")
            total_audios = cursor.fetchone()["total"]
        except:
            total_audios = 0

        # Total alertas de análisis (reemplaza tablas inexistentes como deteccion_estres)
        try:
            cursor.execute("SELECT COUNT(*) AS total FROM alerta_analisis")
            total_estres = cursor.fetchone()["total"]
        except:
            total_estres = 0

        cursor.close()
        DatabaseConnection.return_connection(connection)

        return jsonify({
            'success': True,
            'statistics': {
                'usuarios_total': total_usuarios,
                'usuarios_usan_medicamentos': total_medicamentos,
                'audios_total': total_audios,
                'detecciones_estres': total_estres
            }
        }), 200

    except Exception as e:
        print(f"Error en statistics: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ======================================================
# 👤 PERFIL DEL ADMIN
# ======================================================
@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Obtener información del perfil del admin actual"""
    connection = None
    cursor = None
    
    try:
        user_id = get_jwt_identity()
        print(f"👤 [PROFILE] Solicitud de user_id: {user_id}")

        # Verificar rol admin
        if not verificar_admin(user_id):
            return jsonify({
                'success': False,
                'error': 'Acceso no autorizado. Se requiere rol administrador.'
            }), 403

        # Usar el service que ya adjunta roles
        user = UsuarioService.get_usuario_by_id(user_id)

        if not user:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404

        profile_data = {
            'id': user.get('id_usuario'),
            'nombre': user.get('nombre'),
            'apellido': user.get('apellido'),
            'correo': user.get('correo'),
            'genero': user.get('genero'),
            'rol': user.get('rol')
        }

        if user.get('fecha_nacimiento'):
            profile_data['fecha_nacimiento'] = str(user.get('fecha_nacimiento'))

        if user.get('fecha_creacion'):
            profile_data['fecha_creacion'] = str(user.get('fecha_creacion'))

        return jsonify({
            'success': True,
            'profile': profile_data
        }), 200

    except Exception as e:
        print(f"❌ Error en get_profile: {str(e)}")
        import traceback
        traceback.print_exc()
        
        if cursor:
            cursor.close()
        if connection:
            DatabaseConnection.return_connection(connection)
        
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500
    # ======================================================
# 👥 LISTA DE USUARIOS (ADMIN)
# ======================================================
@bp.route('/usuarios', methods=['GET'])
@jwt_required()
def get_usuarios():
    """Obtener la lista de todos los usuarios (solo admin)"""
    connection = None
    cursor = None

    try:
        user_id = get_jwt_identity()
        print(f"👥 [USUARIOS] Solicitud de user_id: {user_id}")

        # Verificar rol admin
        if not verificar_admin(user_id):
            return jsonify({
                'success': False,
                'error': 'Acceso no autorizado. Se requiere rol administrador.'
            }), 403

        # Obtener el rol 'admin' y listar solo usuarios con ese rol
        try:
            rol_admin = Rol.get_by_name('admin')
            if not rol_admin:
                return jsonify({'success': True, 'usuarios': []}), 200

            usuarios_raw = RolUsuario.get_users_by_role(rol_admin.get('id_rol')) or []
            # Formatear salida para frontend (coincidente con get_all_usuarios_simple)
            usuarios = []
            for u in usuarios_raw:
                usuarios.append({
                    'id': u.get('id_usuario'),
                    'nombre': u.get('nombre'),
                    'apellido': u.get('apellido'),
                    'email': u.get('correo'),
                    'foto_perfil': u.get('foto_perfil'),
                    'roles': ['admin'],
                    'activo': u.get('activo', True)
                })

            return jsonify({'success': True, 'usuarios': usuarios}), 200
        except Exception as e:
            print(f"[ERROR] obtener usuarios admin: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500

    except Exception as e:
        print(f"❌ Error en get_usuarios: {str(e)}")
        import traceback
        traceback.print_exc()

        if cursor:
            cursor.close()
        if connection:
            DatabaseConnection.return_connection(connection)

        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500
