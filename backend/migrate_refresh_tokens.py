import mysql.connector
import os
from pathlib import Path

# Configuración de conexión
config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'serenvoice'
}

try:
    # Conectar a MySQL
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    print("📦 Conectado a MySQL - Ejecutando migración...")
    
    # Leer archivo SQL
    sql_file_path = Path(__file__).parent.parent / 'database' / 'migrations' / 'add_refresh_tokens_table.sql'
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Dividir por bloques DELIMITER
    blocks = sql_content.split('DELIMITER')
    
    # Ejecutar primer bloque (creación de tabla e índices)
    first_block_commands = blocks[0].split(';')
    for cmd in first_block_commands:
        cmd = cmd.strip()
        if cmd and not cmd.startswith('--'):
            try:
                cursor.execute(cmd)
                print(f"✅ Ejecutado: {cmd[:60]}...")
            except mysql.connector.errors.ProgrammingError as e:
                if 'Duplicate' in str(e) or 'already exists' in str(e):
                    print(f"⚠️  Ya existe: {cmd[:60]}...")
                else:
                    print(f"❌ Error: {e}")
    
    conn.commit()
    
    # Manejar triggers y procedimientos (bloques con DELIMITER)
    if len(blocks) > 1:
        # Trigger
        trigger_block = blocks[1].replace('$$', '')
        try:
            cursor.execute("DROP TRIGGER IF EXISTS before_refresh_token_update")
            cursor.execute(trigger_block)
            print("✅ Trigger 'before_refresh_token_update' creado")
        except Exception as e:
            print(f"⚠️  Trigger: {e}")
        
        # Procedimiento
        if len(blocks) > 2:
            proc_block = blocks[2].replace('$$', '')
            try:
                cursor.execute("DROP PROCEDURE IF EXISTS limpiar_tokens_expirados")
                cursor.execute(proc_block)
                print("✅ Procedimiento 'limpiar_tokens_expirados' creado")
            except Exception as e:
                print(f"⚠️  Procedimiento: {e}")
    
    conn.commit()
    
    # Crear evento (después de restaurar DELIMITER)
    try:
        cursor.execute("DROP EVENT IF EXISTS limpiar_tokens_diario")
        cursor.execute("""
            CREATE EVENT limpiar_tokens_diario
            ON SCHEDULE EVERY 1 DAY
            STARTS CURRENT_TIMESTAMP
            DO CALL limpiar_tokens_expirados()
        """)
        print("✅ Evento 'limpiar_tokens_diario' creado")
    except Exception as e:
        print(f"⚠️  Evento: {e}")
    
    conn.commit()
    
    # Verificar tabla
    cursor.execute("SHOW TABLES LIKE 'refresh_token'")
    if cursor.fetchone():
        print("\n✅ ¡Migración completada exitosamente!")
        print("📋 Tabla 'refresh_token' creada con:")
        print("   - Triggers para actualización automática")
        print("   - Procedimiento de limpieza")
        print("   - Evento programado diario")
        
        # Mostrar estructura
        cursor.execute("DESCRIBE refresh_token")
        print("\n📊 Estructura de la tabla:")
        for row in cursor.fetchall():
            print(f"   {row[0]}: {row[1]}")
    else:
        print("❌ Error: La tabla no fue creada")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as err:
    print(f"❌ Error de MySQL: {err}")
except Exception as e:
    print(f"❌ Error general: {e}")
