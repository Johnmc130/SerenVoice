# backend/services/auth_service.py

from backend.models.usuario import Usuario
from backend.models.sesion import Sesion
from backend.utils.seguridad import Seguridad
from flask_jwt_extended import create_access_token
from backend.models.rol_usuario import RolUsuario
from backend.models.rol import Rol


class AuthService:
    """Servicio de autenticación"""

    # ======================================================
    # 🟦 REGISTRO
    # ======================================================
    @staticmethod
    def register_user(data):

        required_fields = ['nombre', 'apellido', 'correo', 'contrasena', 'genero']
        for field in required_fields:
            if field not in data or not data[field]:
                return {'success': False, 'error': f'Campo {field} es requerido'}

        # Validar email
        if not Seguridad.validate_email(data['correo']):
            return {'success': False, 'error': 'Email inválido'}

        # Verificar si el email ya existe
        if Usuario.exists_email(data['correo']):
            return {'success': False, 'error': 'El email ya está registrado'}

        # Validar contraseña
        if len(data['contrasena']) < 6:
            return {'success': False, 'error': 'La contrasena debe tener al menos 6 caracteres'}

        hashed_password = Seguridad.hash_password(data['contrasena'])

        # Crear usuario
        id_usuario = Usuario.create(
            nombre=Seguridad.sanitize_input(data['nombre']),
            apellido=Seguridad.sanitize_input(data['apellido']),
            correo=data['correo'].lower(),
            contrasena=hashed_password,
            genero=data['genero'],
            fecha_nacimiento=data.get('fecha_nacimiento'),
            usa_medicamentos=data.get('usa_medicamentos', False)
        )

        if id_usuario:
            token = create_access_token(identity=str(id_usuario))
            # Asignar rol por defecto 'usuario' en tabla rol_usuario
            try:
                rol_row = Rol.get_by_name('usuario')
                if rol_row:
                    RolUsuario.assign_role(id_usuario, rol_row.get('id_rol'))
            except Exception:
                pass
            return {
                'success': True,
                'message': 'Usuario registrado exitosamente',
                'token': token,
                'user': {
                    'id_usuario': id_usuario,
                    'nombre': data['nombre'],
                    'apellido': data['apellido'],
                    'correo': data['correo'],
                    'genero': data['genero'],
                    'roles': ['usuario'],
                    'rol': 'usuario',
                    'fecha_nacimiento': data.get('fecha_nacimiento'),
                    'usa_medicamentos': data.get('usa_medicamentos', False)
                }
            }

        return {'success': False, 'error': 'Error al crear usuario'}

    # ======================================================
    # 🟩 LOGIN
    # ======================================================
    @staticmethod
    def login(correo, contrasena):

        usuario = Usuario.get_by_email(correo.lower())

        if not usuario:
            return {'success': False, 'error': 'Credenciales inválidas'}

        if not Seguridad.verify_password(contrasena, usuario['contrasena']):
            return {'success': False, 'error': 'Credenciales inválidas'}

        token = create_access_token(identity=str(usuario['id_usuario']))

        Sesion.create(usuario['id_usuario'])

        # Obtener roles
        try:
            roles_rows = RolUsuario.get_user_roles(usuario['id_usuario']) or []
            roles_list = [r.get('nombre_rol') for r in roles_rows]
        except Exception:
            roles_list = []

        return {
            'success': True,
            'token': token,
            'usuario': {
                'id_usuario': usuario['id_usuario'],
                'nombre': usuario['nombre'],
                'apellido': usuario['apellido'],
                'correo': usuario['correo'],
                'roles': roles_list,
                'rol': roles_list[0] if roles_list else None,
                'genero': usuario.get('genero'),
                'fecha_nacimiento': usuario.get('fecha_nacimiento'),
                'edad': usuario.get('edad'),
                'usa_medicamentos': usuario.get('usa_medicamentos')
            }
        }

    # ======================================================
    # 🟨 UPDATE PROFILE (NUEVO)
    # ======================================================
    @staticmethod
    def update_user_profile(id_usuario, data):

        # Construir diccionario limpio
        campos_actualizables = {
            "nombre": data.get("nombre"),
            "apellido": data.get("apellido"),
            "correo": data.get("correo"),
            "genero": data.get("genero"),
            "fecha_nacimiento": data.get("fecha_nacimiento"),
            "edad": data.get("edad"),
            "usa_medicamentos": data.get("usa_medicamentos"),
        }

        actualizado = Usuario.update(id_usuario, **campos_actualizables)

        if actualizado:
            return {'success': True, 'message': 'Perfil actualizado correctamente'}

        return {'success': False, 'error': 'No se pudo actualizar el perfil'}

    # ======================================================
    # 🟥 LOGOUT
    # ======================================================
    @staticmethod
    def logout(id_usuario):
        Sesion.close_all_user_sessions(id_usuario)
        return {'success': True, 'message': 'Sesión cerrada exitosamente'}
