"""
Agregar columnas faltantes a participacion_actividad
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
    
    print("\n📋 Estructura ANTES:")
    cursor.execute("DESCRIBE participacion_actividad")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
    
    columnas_agregar = [
        ("notas_participante", "TEXT NULL"),
        ("estado_emocional_antes", "VARCHAR(255) NULL"),
        ("estado_emocional_despues", "VARCHAR(255) NULL")
    ]
    
    for col_name, col_def in columnas_agregar:
        # Verificar si existe
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = %s
            AND TABLE_NAME = 'participacion_actividad' 
            AND COLUMN_NAME = %s
        """, (config['database'], col_name))
        
        exists = cursor.fetchone()[0]
        
        if exists:
            print(f"\n⚠️  {col_name} ya existe")
        else:
            print(f"\n➕ Agregando {col_name}...")
            cursor.execute(f"""
                ALTER TABLE participacion_actividad 
                ADD COLUMN {col_name} {col_def}
            """)
            conn.commit()
            print(f"✅ {col_name} agregada")
    
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
