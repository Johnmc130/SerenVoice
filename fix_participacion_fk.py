"""
Corregir FK de participacion_actividad para apuntar a actividades_grupo
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

config = {
    'host': os.getenv('DB_HOST', 'switchback.proxy.rlwy.net'),
    'port': int(os.getenv('DB_PORT', '17529')),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME', 'railway'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

try:
    print("🔌 Conectando a Railway MySQL...")
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    # Ver FKs actuales
    print("\n📋 FKs actuales en participacion_actividad:")
    cursor.execute("""
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = %s
        AND TABLE_NAME = 'participacion_actividad'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    """, (config['database'],))
    
    fks = cursor.fetchall()
    for row in fks:
        print(f"  {row[0]}: {row[1]} -> {row[2]}.{row[3]}")
    
    # Eliminar FK incorrecta si existe
    print("\n🔧 Corrigiendo FK...")
    
    # Primero eliminar la FK que apunta a actividad_grupo
    try:
        cursor.execute("ALTER TABLE participacion_actividad DROP FOREIGN KEY participacion_actividad_ibfk_1")
        conn.commit()
        print("  ✅ FK participacion_actividad_ibfk_1 eliminada")
    except Exception as e:
        print(f"  ⚠️ No se pudo eliminar FK: {e}")
    
    # Crear nueva FK apuntando a actividades_grupo
    try:
        cursor.execute("""
            ALTER TABLE participacion_actividad 
            ADD CONSTRAINT fk_participacion_actividad 
            FOREIGN KEY (id_actividad) 
            REFERENCES actividades_grupo(id_actividad) 
            ON DELETE CASCADE
        """)
        conn.commit()
        print("  ✅ Nueva FK creada: id_actividad -> actividades_grupo.id_actividad")
    except Exception as e:
        print(f"  ⚠️ Error creando FK: {e}")
    
    # Verificar resultado
    print("\n📋 FKs después de corrección:")
    cursor.execute("""
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = %s
        AND TABLE_NAME = 'participacion_actividad'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    """, (config['database'],))
    
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]} -> {row[2]}.{row[3]}")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Corrección completada!")
    
except mysql.connector.Error as err:
    print(f"\n❌ Error MySQL: {err}")
except Exception as e:
    print(f"\n❌ Error: {e}")
