"""
Agregar columnas faltantes a analisis_voz_participante
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

config = {
    'host': os.getenv('DB_HOST'),
    'port': int(os.getenv('DB_PORT', '17529')),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
}

try:
    print("🔌 Conectando a Railway MySQL...")
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    print("\n📋 Estructura actual:")
    cursor.execute("DESCRIBE analisis_voz_participante")
    existing_cols = [row[0] for row in cursor.fetchall()]
    for col in existing_cols:
        print(f"  {col}")
    
    # Columnas que el código necesita pero no existen
    columnas_agregar = [
        ("id_actividad", "INT NOT NULL AFTER id_participacion"),
        ("emocion_predominante", "VARCHAR(50) NULL"),
        ("nivel_estres", "DECIMAL(5,2) DEFAULT 0"),
        ("nivel_ansiedad", "DECIMAL(5,2) DEFAULT 0"),
        ("confianza_modelo", "DECIMAL(5,2) DEFAULT 0"),
        ("emociones_json", "JSON NULL"),
        ("duracion_audio", "INT DEFAULT 0"),
        ("fecha_analisis", "DATETIME DEFAULT CURRENT_TIMESTAMP"),
    ]
    
    for col_name, col_def in columnas_agregar:
        if col_name not in existing_cols:
            print(f"\n➕ Agregando {col_name}...")
            try:
                cursor.execute(f"ALTER TABLE analisis_voz_participante ADD COLUMN {col_name} {col_def}")
                conn.commit()
                print(f"  ✅ {col_name} agregada")
            except mysql.connector.Error as e:
                print(f"  ⚠️ {e}")
        else:
            print(f"\n✅ {col_name} ya existe")
    
    # Verificar si tiene unique key en (id_actividad, id_usuario)
    cursor.execute("""
        SELECT INDEX_NAME FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'analisis_voz_participante'
        AND COLUMN_NAME IN ('id_actividad', 'id_usuario')
    """, (config['database'],))
    indexes = cursor.fetchall()
    print(f"\n📋 Índices existentes con id_actividad/id_usuario: {[i[0] for i in indexes]}")
    
    if not any('actividad_usuario' in str(i).lower() for i in indexes):
        print("\n➕ Creando índice único en (id_actividad, id_usuario)...")
        try:
            cursor.execute("""
                ALTER TABLE analisis_voz_participante 
                ADD UNIQUE KEY uk_actividad_usuario (id_actividad, id_usuario)
            """)
            conn.commit()
            print("  ✅ Índice creado")
        except mysql.connector.Error as e:
            print(f"  ⚠️ {e}")
    
    print("\n📋 Estructura final:")
    cursor.execute("DESCRIBE analisis_voz_participante")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
    
    cursor.close()
    conn.close()
    print("\n✅ Migración completada!")
    
except mysql.connector.Error as err:
    print(f"\n❌ Error MySQL: {err}")
except Exception as e:
    print(f"\n❌ Error: {e}")
