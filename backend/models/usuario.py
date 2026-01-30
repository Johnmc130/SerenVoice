from backend.database.connection import DatabaseConnection, get_db_connection
from datetime import date, datetime
from werkzeug.security import check_password_hash, generate_password_hash

class Usuario:
    """Modelo para la tabla usuario"""

    # ---------------------------------------------------
    # Crear usuario
    # ---------------------------------------------------
    @staticmethod
    def create(
        nombre,
        apellido,
        correo,
        contrasena,
        fecha_nacimiento=None,
        usa_medicamentos=False,
        genero=None,
        auth_provider='local'
    ):
        # Calcular edad si se proporciona fecha de nacimiento
        edad = Usuario.calcular_edad(fecha_nacimiento) if fecha_nacimiento else None
        
        query = """
            INSERT INTO usuario 
            (nombre, apellido, correo, contrasena, genero, fecha_nacimiento, edad, usa_medicamentos, auth_provider)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        return DatabaseConnection.execute_query(
            query,
            (
                nombre,
                apellido,
                correo.lower(),
                contrasena,
                genero,
                fecha_nacimiento,
                edad,
                usa_medicamentos,
                auth_provider
            ),
            fetch=False
        )

    # ---------------------------------------------------
    # Obtener usuario por ID
    # ---------------------------------------------------
    @staticmethod
    def get_by_id(id_usuario):
        query = "SELECT * FROM usuario WHERE id_usuario = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (id_usuario,))
        return results[0] if results else None

    # ---------------------------------------------------
    # Obtener usuario por correo
    # ---------------------------------------------------
    @staticmethod
    def get_by_email(correo):
        query = """
            SELECT id_usuario, nombre, apellido, correo, contrasena, foto_perfil,
                   google_uid, auth_provider, fecha_registro, fecha_nacimiento,
                   fecha_actualizacion, edad, usa_medicamentos, genero, notificaciones, activo
            FROM usuario
            WHERE correo = %s AND activo = 1
            LIMIT 1
        """
        results = DatabaseConnection.execute_query(query, (correo.lower(),))
        return results[0] if results else None

    # ---------------------------------------------------
    # Obtener todos los usuarios
    # ---------------------------------------------------
    @staticmethod
    def get_all(limit=None, offset=0):
        query = "SELECT * FROM usuario WHERE activo = 1 ORDER BY id_usuario DESC"
        if limit:
            query += f" LIMIT {limit} OFFSET {offset}"
        return DatabaseConnection.execute_query(query)

    # ---------------------------------------------------
    # Actualizar usuario
    # ---------------------------------------------------
    @staticmethod
    def update(
        id_usuario, nombre, apellido, correo, genero,
        fecha_nacimiento, usa_medicamentos, contrasena_actual=None,
        contrasena_nueva=None
    ):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Obtener contraseña actual para validar si desea cambiarla
        cursor.execute("SELECT contrasena FROM usuario WHERE id_usuario = %s", (id_usuario,))
        row = cursor.fetchone()

        if not row:
            raise Exception("Usuario no encontrado")

        # Si quiere cambiar contraseña
        if contrasena_nueva:
            if not contrasena_actual or not check_password_hash(row["contrasena"], contrasena_actual):
                raise Exception("La contraseña actual es incorrecta")
            nueva_contra = generate_password_hash(contrasena_nueva)
        else:
            nueva_contra = row["contrasena"]

        # Calcular edad automáticamente
        edad = Usuario.calcular_edad(fecha_nacimiento) if fecha_nacimiento else None

        cursor.execute("""
            UPDATE usuario
            SET nombre=%s,
                apellido=%s,
                correo=%s,
                genero=%s,
                fecha_nacimiento=%s,
                edad=%s,
                usa_medicamentos=%s,
                contrasena=%s
            WHERE id_usuario=%s
        """, (
            nombre, apellido, correo, genero,
            fecha_nacimiento, edad, usa_medicamentos,
            nueva_contra, id_usuario
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return edad

    # ---------------------------------------------------
    # Eliminar usuario
    # ---------------------------------------------------
    @staticmethod
    def delete(id_usuario):
        query = "DELETE FROM usuario WHERE id_usuario = %s"
        DatabaseConnection.execute_query(query, (id_usuario,), fetch=False)
        return True

    # ---------------------------------------------------
    # Verificar si correo existe
    # ---------------------------------------------------
    @staticmethod
    def exists_email(correo):
        query = "SELECT COUNT(*) AS count FROM usuario WHERE correo = %s"
        result = DatabaseConnection.execute_query(query, (correo.lower(),))
        return result[0]['count'] > 0 if result else False

    # ---------------------------------------------------
    # Calcular edad
    # ---------------------------------------------------
    @staticmethod
    def calcular_edad(fecha_nacimiento):
        if not fecha_nacimiento:
            return None

        if isinstance(fecha_nacimiento, str):
            fecha_nacimiento = datetime.strptime(fecha_nacimiento, "%Y-%m-%d").date()

        hoy = date.today()
        edad = hoy.year - fecha_nacimiento.year - (
            (hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day)
        )
        return edad
    
    # ---------------------------------------------------
    # Google Auth - Crear usuario
    # ---------------------------------------------------
    @staticmethod
    def create_google_user(nombre, apellido, correo, google_uid, foto_perfil=None):
        """Crear usuario con autenticación de Google"""
        query = """
            INSERT INTO usuario 
            (nombre, apellido, correo, google_uid, auth_provider, foto_perfil, activo)
            VALUES (%s, %s, %s, %s, 'google', %s, 1)
        """
        return DatabaseConnection.execute_query(
            query, 
            (nombre, apellido, correo.lower(), google_uid, foto_perfil),
            fetch=False
        )
    
    # ---------------------------------------------------
    # Google Auth - Obtener por Google UID
    # ---------------------------------------------------
    @staticmethod
    def get_by_google_uid(google_uid):
        """Obtener usuario por Google UID"""
        query = "SELECT * FROM usuario WHERE google_uid = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (google_uid,))
        return results[0] if results else None
    
    # ---------------------------------------------------
    # Google Auth - Verificar o crear
    # ---------------------------------------------------
    @staticmethod
    def get_or_create_google_user(google_uid, nombre, apellido, correo, foto_perfil=None):
        """Obtener usuario existente o crear uno nuevo con Google Auth"""
        # Buscar por Google UID
        user = Usuario.get_by_google_uid(google_uid)
        
        if user:
            # Actualizar foto de perfil si cambió
            if foto_perfil and user.get('foto_perfil') != foto_perfil:
                Usuario.update_foto_perfil(user['id_usuario'], foto_perfil)
                user['foto_perfil'] = foto_perfil
            return user
        
        # Buscar por correo (puede existir cuenta local)
        user = Usuario.get_by_email(correo)
        
        if user:
            # Vincular cuenta existente con Google
            Usuario.link_google_account(user['id_usuario'], google_uid, foto_perfil)
            user['google_uid'] = google_uid
            user['auth_provider'] = 'google'
            user['foto_perfil'] = foto_perfil
            return user
        
        # Crear nuevo usuario
        Usuario.create_google_user(nombre, apellido, correo, google_uid, foto_perfil)
        return Usuario.get_by_google_uid(google_uid)
    
    # ---------------------------------------------------
    # Google Auth - Vincular cuenta
    # ---------------------------------------------------
    @staticmethod
    def link_google_account(id_usuario, google_uid, foto_perfil=None):
        """Vincular cuenta existente con Google"""
        query = """
            UPDATE usuario 
            SET google_uid = %s, auth_provider = 'google', foto_perfil = %s
            WHERE id_usuario = %s
        """
        DatabaseConnection.execute_query(query, (google_uid, foto_perfil, id_usuario), fetch=False)
        return True
    
    # ---------------------------------------------------
    # Actualizar foto de perfil
    # ---------------------------------------------------
    @staticmethod
    def update_foto_perfil(id_usuario, foto_perfil):
        """Actualizar foto de perfil del usuario"""
        query = "UPDATE usuario SET foto_perfil = %s WHERE id_usuario = %s"
        DatabaseConnection.execute_query(query, (foto_perfil, id_usuario), fetch=False)
        return True
    
    # ---------------------------------------------------
    # Estadísticas - Obtener por usuario
    # ---------------------------------------------------
    @staticmethod
    def get_estadisticas(id_usuario):
        """Obtener estadísticas del usuario usando vista optimizada"""
        query = "SELECT * FROM vista_usuarios_estadisticas WHERE id_usuario = %s"
        results = DatabaseConnection.execute_query(query, (id_usuario,))
        return results[0] if results else None
    
    # ---------------------------------------------------
    # Obtener todos con estadísticas
    # ---------------------------------------------------
    @staticmethod
    def get_all_with_stats(limit=50, offset=0):
        """Obtener todos los usuarios con sus estadísticas"""
        query = """
            SELECT * FROM vista_usuarios_estadisticas 
            ORDER BY fecha_registro DESC
            LIMIT %s OFFSET %s
        """
        return DatabaseConnection.execute_query(query, (limit, offset))
