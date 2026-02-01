"""
Agregar columna id_resultado a participacion_actividad
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración Railway
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
    
    # Verificar estructura actual
    print("\n📋 Estructura ANTES:")
    cursor.execute("DESCRIBE participacion_actividad")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
    
    # Verificar si la columna ya existe
    cursor.execute("""
        SELECT COUNT(*) 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = %s
        AND TABLE_NAME = 'participacion_actividad' 
        AND COLUMN_NAME = 'id_resultado'
    """, (config['database'],))
    exists = cursor.fetchone()[0]
    
    if exists:
        print("\n⚠️  La columna id_resultado ya existe")
    else:
        print("\n➕ Agregando columna id_resultado...")
        cursor.execute("""
            ALTER TABLE participacion_actividad 
            ADD COLUMN id_resultado INT NULL,
            ADD CONSTRAINT fk_participacion_resultado 
                FOREIGN KEY (id_resultado) 
                REFERENCES resultado_analisis(id_resultado) 
                ON DELETE SET NULL
        """)
        conn.commit()
        print("✅ Columna id_resultado agregada con FK")
    
    # Verificar estructura final
    print("\n📋 Estructura DESPUÉS:")
    cursor.execute("DESCRIBE participacion_actividad")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Migración completada exitosamente!")
    
except mysql.connector.Error as err:
    print(f"\n❌ Error MySQL: {err}")
except Exception as e:
    print(f"\n❌ Error: {e}")
