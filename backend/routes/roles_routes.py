# backend/routes/roles_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.models.rol import Rol
from backend.utils.helpers import Helpers
from backend.utils.seguridad import role_required

bp = Blueprint('roles', __name__, url_prefix='/api/roles')

@bp.route('/', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_all_roles():
    """Obtener todos los roles (solo admin)"""
    roles = Rol.get_all()
    
    return Helpers.format_response(
        success=True,
        data=roles,
        status=200
    )

@bp.route('/<int:id_rol>', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_role(id_rol):
    """Obtener rol por ID"""
    rol = Rol.get_by_id(id_rol)
    
    if not rol:
        return Helpers.format_response(
            success=False,
            message='Rol no encontrado',
            status=404
        )
    
    return Helpers.format_response(
        success=True,
        data=rol,
        status=200
    )

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_role():
    """Crear nuevo rol (solo admin)"""
    data = request.json
    
    if not data or 'nombre_rol' not in data:
        return Helpers.format_response(
            success=False,
            message='Nombre del rol es requerido',
            status=400
        )
    
    id_rol = Rol.create(
        nombre_rol=data['nombre_rol'],
        descripcion=data.get('descripcion')
    )
    
    return Helpers.format_response(
        success=True,
        data={'id_rol': id_rol},
        message='Rol creado exitosamente',
        status=201
    )
