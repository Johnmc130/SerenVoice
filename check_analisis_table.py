"""
Verificar y crear tabla analisis_voz_participante si no existe
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
    
    # Verificar tablas existentes
    cursor.execute("SHOW TABLES LIKE 'analisis_voz%'")
    tables = cursor.fetchall()
    print(f"\n📋 Tablas de análisis existentes: {[t[0] for t in tables]}")
    
    # Verificar si existe analisis_voz_participante
    cursor.execute("SHOW TABLES LIKE 'analisis_voz_participante'")
    exists = cursor.fetchone()
    
    if not exists:
        print("\n➕ Creando tabla analisis_voz_participante...")
        cursor.execute("""
            CREATE TABLE analisis_voz_participante (
                id_analisis INT AUTO_INCREMENT PRIMARY KEY,
                id_actividad INT NOT NULL,
                id_usuario INT NOT NULL,
                emocion_predominante VARCHAR(50),
                nivel_estres DECIMAL(5,2) DEFAULT 0,
                nivel_ansiedad DECIMAL(5,2) DEFAULT 0,
                confianza_modelo DECIMAL(5,2) DEFAULT 0,
                emociones_json JSON,
                duracion_audio INT DEFAULT 0,
                fecha_analisis DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uk_actividad_usuario (id_actividad, id_usuario),
                FOREIGN KEY (id_actividad) REFERENCES actividades_grupo(id_actividad) ON DELETE CASCADE,
                FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        conn.commit()
        print("✅ Tabla analisis_voz_participante creada!")
    else:
        print("\n✅ Tabla analisis_voz_participante ya existe")
        cursor.execute("DESCRIBE analisis_voz_participante")
        print("Columnas:")
        for row in cursor.fetchall():
            print(f"  {row[0]}: {row[1]}")
    
    cursor.close()
    conn.close()
    print("\n✅ Verificación completada!")
    
except mysql.connector.Error as err:
    print(f"\n❌ Error MySQL: {err}")
except Exception as e:
    print(f"\n❌ Error: {e}")
