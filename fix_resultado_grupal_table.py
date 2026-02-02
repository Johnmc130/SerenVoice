import pymysql
import os
import sys
from pathlib import Path

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env.cloudrun
env_path = backend_dir / '.env.cloudrun'
if not env_path.exists():
    print(f"❌ No se encontró {env_path}")
    sys.exit(1)

load_dotenv(env_path)

# Credenciales Railway - FORZAR BASE DE DATOS 'railway'
DB_HOST = 'switchback.proxy.rlwy.net'
DB_PORT = 17529
DB_USER = 'root'
DB_PASSWORD = 'NhZDwAWhtLPguGpXFExHRKGfggzhAxFD'
DB_NAME = 'railway'  # IMPORTANTE: Cloud Run usa 'railway', no 'serenvoice'

print(f"\n🔍 Credenciales cargadas:")
print(f"   Host: {DB_HOST}")
print(f"   Port: {DB_PORT}")
print(f"   User: {DB_USER}")
print(f"   Database: {DB_NAME}")

try:
    print("\n🔗 Conectando a Railway...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()
    
    # IMPORTANTE: Cambiar explícitamente a la base de datos railway
    cursor.execute(f"USE {DB_NAME}")
    print(f"✅ Conectado y usando BD: {DB_NAME}")
    
    # Verificar si la tabla existe EN LA BD railway
    cursor.execute("""
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = 'resultado_actividad_grupal'
    """)
    
    existe = cursor.fetchone()[0] > 0
    
    if existe:
        print("\n⚠️  La tabla resultado_actividad_grupal YA EXISTE en railway")
        cursor.execute("DESCRIBE resultado_actividad_grupal")
        print("\n📋 Estructura actual:")
        for row in cursor.fetchall():
            print(f"  {row[0]}: {row[1]} {row[2]} {row[3]}")
    else:
        print("\n🔨 Creando tabla resultado_actividad_grupal en railway...")
        
        # Crear la tabla según el modelo en backend/models/resultado_analisis.py
        cursor.execute("""
            CREATE TABLE resultado_actividad_grupal (
                id_resultado INT AUTO_INCREMENT PRIMARY KEY,
                id_actividad INT NOT NULL,
                emocion_dominante VARCHAR(50),
                nivel_estres_promedio DECIMAL(5,2),
                nivel_ansiedad_promedio DECIMAL(5,2),
                confianza_promedio DECIMAL(5,2),
                emociones_promedio JSON,
                fecha_calculo DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_actividad) REFERENCES actividades_grupo(id_actividad) ON DELETE CASCADE,
                UNIQUE KEY unique_actividad (id_actividad)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        conn.commit()
        print("✅ Tabla resultado_actividad_grupal creada exitosamente!")
        
        # Mostrar estructura
        cursor.execute("DESCRIBE resultado_actividad_grupal")
        print("\n📋 Estructura de la tabla:")
        for row in cursor.fetchall():
            print(f"  {row[0]}: {row[1]} {row[2]} {row[3]}")
    
    cursor.close()
    conn.close()
    print("\n✅ Operación completada")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
