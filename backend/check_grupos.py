from database.connection import DatabaseConnection

# Verificar si existe la tabla login_attempts
result = DatabaseConnection.execute_query("SHOW TABLES LIKE 'login_attempts'", fetch=True)
print("Tabla login_attempts existe:", len(result) > 0 if result else False)

# Crear tabla si no existe
if not result or len(result) == 0:
    sql = """
    CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        correo VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        intentos INT DEFAULT 1,
        ultimo_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        bloqueado_hasta TIMESTAMP NULL,
        INDEX idx_correo (correo),
        INDEX idx_ip (ip_address)
    )
    """
    try:
        DatabaseConnection.execute_query(sql, fetch=False)
        print("Tabla login_attempts creada exitosamente")
    except Exception as e:
        print(f"Error creando tabla: {e}")
else:
    print("Tabla ya existe")
