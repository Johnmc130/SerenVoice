from backend.database.connection import DatabaseConnection
from backend.models.usuario import Usuario
from backend.models.rol_usuario import RolUsuario


class UsuarioService:

    # ============================================
    # OBTENER TODOS LOS USUARIOS - FORMATO SIMPLE
    # ============================================
    @staticmethod
    def get_all_usuarios_simple():
        try:
            print("\n" + "="*50)
            print("INICIANDO get_all_usuarios_simple()")
            print("="*50)
            
            usuarios = Usuario.get_all()
            
            print(f"\n Usuarios obtenidos de la BD: {len(usuarios)}")
            if usuarios:
                print(f" Primer usuario: {usuarios[0]}")
                print(f" Campos disponibles: {usuarios[0].keys() if usuarios else 'N/A'}")
            else:
                print(" NO SE OBTUVIERON USUARIOS DE LA BD")

            usuarios_formatted = []
            for u in usuarios:
                try:
                    roles_rows = RolUsuario.get_user_roles(u.get("id_usuario")) or []
                    roles_list = [r.get("nombre_rol") for r in roles_rows]
                except Exception:
                    roles_list = []

                usuario_formateado = {
                    "id": u.get("id_usuario"),
                    "nombre": u.get("nombre"),
                    "apellido": u.get("apellido"),
                    "email": u.get("correo"),
                    "foto_perfil": u.get("foto_perfil"),
                    "auth_provider": u.get("auth_provider", "local"),
                    "roles": roles_list or ["usuario"],
                    "ultimoAcceso": u.get("ultima_sesion", "N/A"),
                    "genero": u.get("genero"),
                    "fecha_nacimiento": str(u.get("fecha_nacimiento")) if u.get("fecha_nacimiento") else None,
                    "activo": u.get("activo", True),
                }
                usuarios_formatted.append(usuario_formateado)

            print(f"\n Total usuarios formateados: {len(usuarios_formatted)}")
            print("="*50 + "\n")
            
            return usuarios_formatted

        except Exception as e:
            print(f"\n ERROR en get_all_usuarios_simple: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    # ============================================
    # OBTENER USUARIO CON ESTADÍSTICAS
    # ============================================
    @staticmethod
    def get_usuario_with_stats(id_usuario):
        try:
            with DatabaseConnection.get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                
                query = """
                    SELECT 
                        id_usuario,
                        nombre,
                        apellido,
                        correo,
                        genero,
                        fecha_nacimiento,
                        edad,
                        usa_medicamentos,
                        notificaciones,
                        fecha_registro AS fecha_creacion,
                        foto_perfil,
                        auth_provider
                    FROM usuario
                    WHERE id_usuario = %s
                """

                cursor.execute(query, (id_usuario,))
                usuario = cursor.fetchone()
                cursor.close()

                if not usuario:
                    return None

                if usuario.get("fecha_nacimiento"):
                    usuario["fecha_nacimiento"] = str(usuario["fecha_nacimiento"])

                if usuario.get("fecha_creacion"):
                    usuario["fecha_creacion"] = str(usuario["fecha_creacion"])

                try:
                    roles_rows = RolUsuario.get_user_roles(id_usuario) or []
                    roles_list = [r.get("nombre_rol") for r in roles_rows]
                except Exception:
                    roles_list = []

                usuario["roles"] = roles_list
                usuario["rol"] = roles_list[0] if roles_list else "usuario"

                return usuario

        except Exception as e:
            print(f"\n Error en get_usuario_with_stats: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

    # ============================================
    # OBTENER USUARIO POR ID
    # ============================================
    @staticmethod
    def get_usuario_by_id(id_usuario):
        try:
            with DatabaseConnection.get_connection() as conn:
                cursor = conn.cursor(dictionary=True)

                cursor.execute("SELECT * FROM usuario WHERE id_usuario = %s", (id_usuario,))
                usuario = cursor.fetchone()

                cursor.close()
                if not usuario:
                    return None

                try:
                    roles_rows = RolUsuario.get_user_roles(id_usuario) or []
                    roles_list = [r.get("nombre_rol") for r in roles_rows]
                except Exception:
                    roles_list = []

                usuario["roles"] = roles_list
                usuario["rol"] = roles_list[0] if roles_list else "usuario"

                return usuario

        except Exception as e:
            print(f"\n Error en get_usuario_by_id: {str(e)}")
            return None

    # ============================================
    # LISTAR USUARIOS CON PAGINACIÓN
    # ============================================
    @staticmethod
    def get_all_usuarios(page=None, per_page=None):
        try:
            with DatabaseConnection.get_connection() as conn:
                cursor = conn.cursor(dictionary=True)

                # Si se especifica paginación
                if page is not None and per_page is not None:
                    offset = (page - 1) * per_page
                    query = """
                        SELECT 
                            id_usuario AS id,
                            nombre,
                            apellido,
                            correo AS email,
                            foto_perfil,
                            auth_provider,
                            fecha_registro,
                            fecha_nacimiento,
                            genero,
                            activo
                        FROM usuario
                        ORDER BY fecha_registro DESC
                        LIMIT %s OFFSET %s
                    """
                    cursor.execute(query, (per_page, offset))
                else:
                    # Devolver todos los usuarios
                    query = """
                        SELECT 
                            id_usuario AS id,
                            nombre,
                            apellido,
                            correo AS email,
                            foto_perfil,
                            auth_provider,
                            fecha_registro,
                            fecha_nacimiento,
                            genero,
                            activo
                        FROM usuario
                        ORDER BY fecha_registro DESC
                    """
                    cursor.execute(query)

                usuarios = cursor.fetchall()
                cursor.close()
                
                # Para cada usuario, adjuntar roles
                for u in usuarios:
                    try:
                        roles_rows = RolUsuario.get_user_roles(u.get("id")) or []
                        u_roles = [r.get("nombre_rol") for r in roles_rows]
                    except Exception:
                        u_roles = []
                    u["roles"] = u_roles
                    u["rol"] = u_roles[0] if u_roles else "usuario"
                    u["rol"] = u_roles[0] if u_roles else None
                    
                    # Formatear fecha de último acceso
                    if u.get("fecha_registro"):
                        u["ultimoAcceso"] = str(u["fecha_registro"])

                return usuarios

        except Exception as e:
            print(f"\n Error en get_all_usuarios: {str(e)}")
            return []

    # ============================================
    # ACTUALIZAR USUARIO - ✅ VERSIÓN CORREGIDA
    # ============================================
    @staticmethod
    def update_usuario(id_usuario, data):
        """
        Actualiza los datos de un usuario
        Maneja correctamente las contraseñas hasheadas y fotos
        """
        try:
            print(f"\n{'='*60}")
            print(f"[SERVICE] Actualizando usuario ID: {id_usuario}")
            print(f"[SERVICE] Campos recibidos: {list(data.keys())}")
            print(f"{'='*60}")
            
            # Usar context manager correctamente
            with DatabaseConnection.get_connection() as conn:
                cursor = conn.cursor()

                # Campos permitidos INCLUYENDO contraseña y foto
                campos_permitidos = [
                    "nombre",
                    "apellido", 
                    "correo",
                    "genero",
                    "fecha_nacimiento",
                    "edad",
                    "usa_medicamentos",
                    "notificaciones",
                    "foto_perfil",
                    "contrasena"
                ]
                
                updates = []
                values = []

                for campo in campos_permitidos:
                    if campo in data:
                        # Hashear contraseña si está presente
                        if campo == 'contrasena':
                            from werkzeug.security import generate_password_hash
                            hashed = generate_password_hash(data[campo])
                            updates.append(f"{campo} = %s")
                            values.append(hashed)
                            print(f"[SERVICE] Contrasena sera actualizada (hasheada)")
                        else:
                            updates.append(f"{campo} = %s")
                            values.append(data[campo])
                            valor_mostrar = str(data[campo])[:50]
                            print(f"[SERVICE] Campo '{campo}' = '{valor_mostrar}'")

                if not updates:
                    print(f"[SERVICE] No hay campos para actualizar")
                    print(f"{'='*60}\n")
                    return {
                        'success': False,
                        'error': 'No hay datos para actualizar'
                    }

                values.append(id_usuario)
                
                # NO incluir fecha_actualizacion si no existe en tu tabla
                query = f"""
                    UPDATE usuario 
                    SET {', '.join(updates)}
                    WHERE id_usuario = %s
                """
                
                print(f"[SERVICE] Query generado con {len(updates)} campos")
                print(f"[SERVICE] Ejecutando UPDATE...")
                
                cursor.execute(query, tuple(values))
                conn.commit()

                affected_rows = cursor.rowcount
                print(f"[SERVICE] Filas afectadas: {affected_rows}")

                cursor.close()

                if affected_rows > 0:
                    print(f"[SERVICE] Usuario actualizado exitosamente")
                    print(f"{'='*60}\n")
                    return {
                        'success': True,
                        'message': 'Usuario actualizado correctamente'
                    }
                else:
                    print(f"[SERVICE] No se actualizo ninguna fila")
                    print(f"{'='*60}\n")
                    return {
                        'success': False,
                        'error': 'No se pudo actualizar el usuario'
                    }

        except Exception as e:
            print(f"[SERVICE] Error: {str(e)}")
            import traceback
            traceback.print_exc()
            print(f"{'='*60}\n")
            return {
                'success': False,
                'error': str(e)
            }

    # ============================================
    # ELIMINAR USUARIO
    # ============================================
    @staticmethod
    def delete_usuario(id_usuario):
        try:
            with DatabaseConnection.get_connection() as conn:
                cursor = conn.cursor()

                cursor.execute("DELETE FROM usuario WHERE id_usuario = %s", (id_usuario,))
                rows = cursor.rowcount

                conn.commit()
                cursor.close()

                if rows > 0:
                    return {"success": True, "message": "Usuario eliminado correctamente"}
                else:
                    return {"success": False, "error": "Usuario no encontrado"}

        except Exception as e:
            print(f"\n Error en delete_usuario: {str(e)}")
            return {"success": False, "error": str(e)}

    # ============================================
    # BUSCAR USUARIOS POR NOMBRE / APELLIDO / CORREO
    # ============================================
    @staticmethod
    def search_users(query, limit=10):
        try:
            if not query:
                return []
            q = f"%{query}%"
            with DatabaseConnection.get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                sql = """
                    SELECT id_usuario AS id, nombre, apellido, correo, foto_perfil
                    FROM usuario
                    WHERE nombre LIKE %s OR apellido LIKE %s OR correo LIKE %s
                    LIMIT %s
                """
                cursor.execute(sql, (q, q, q, limit))
                rows = cursor.fetchall()
                cursor.close()

                results = []
                for r in rows:
                    results.append({
                        'id': r.get('id'),
                        'nombre': r.get('nombre'),
                        'apellido': r.get('apellido'),
                        'correo': r.get('correo'),
                        'foto_perfil': r.get('foto_perfil')
                    })
                return results
        except Exception as e:
            print(f"\n Error en search_users: {str(e)}")
            return []

    # ============================================
    # CAMBIAR ESTADO (activo) DE UN USUARIO
    # ============================================
    @staticmethod
    def set_estado_usuario(id_usuario, activo):
        try:
            with DatabaseConnection.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE usuario SET activo = %s WHERE id_usuario = %s", (1 if activo else 0, id_usuario))
                conn.commit()
                cursor.close()
                return {"success": True, "message": "Estado de usuario actualizado"}
        except Exception as e:
            print(f"\n Error en set_estado_usuario: {str(e)}")
            return {"success": False, "error": str(e)}
