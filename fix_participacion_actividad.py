# fix_participacion_actividad.py
# Script para agregar columnas faltantes a participacion_actividad en Railway
# Ejecutar: python fix_participacion_actividad.py

import mysql.connector
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de base de datos (Railway)
config = {
    'host': os.getenv('DB_HOST', 'switchback.proxy.rlwy.net'),
    'port': int(os.getenv('DB_PORT', '17529')),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME', 'railway'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
}

print(f"Conectando a: {config['host']}:{config['port']}/{config['database']}")

try:
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    # 1. Verificar estructura actual de participacion_actividad
    print("\n📋 Estructura actual de participacion_actividad:")
    cursor.execute("DESCRIBE participacion_actividad")
    columns = cursor.fetchall()
    existing_columns = [col[0] for col in columns]
    for col in columns:
        print(f"  - {col[0]}: {col[1]}")
    
    # 2. Agregar columnas faltantes
    migrations = []
    
    if 'completada' not in existing_columns:
        migrations.append(("completada", 
            "ALTER TABLE participacion_actividad ADD COLUMN completada TINYINT(1) DEFAULT 0"))
    
    if 'conectado' not in existing_columns:
        migrations.append(("conectado",
            "ALTER TABLE participacion_actividad ADD COLUMN conectado TINYINT(1) DEFAULT 0"))
    
    if 'fecha_completada' not in existing_columns:
        migrations.append(("fecha_completada",
            "ALTER TABLE participacion_actividad ADD COLUMN fecha_completada DATETIME NULL"))
    
    if 'fecha_union' not in existing_columns:
        migrations.append(("fecha_union",
            "ALTER TABLE participacion_actividad ADD COLUMN fecha_union DATETIME DEFAULT CURRENT_TIMESTAMP"))
    
    # 3. Ejecutar migraciones
    print(f"\n🔧 Migraciones pendientes: {len(migrations)}")
    for col_name, sql in migrations:
        print(f"  ➕ Agregando columna: {col_name}")
        try:
            cursor.execute(sql)
            conn.commit()
            print(f"    ✅ Columna '{col_name}' agregada exitosamente")
        except mysql.connector.Error as e:
            if "Duplicate column name" in str(e):
                print(f"    ⚠️ Columna '{col_name}' ya existe")
            else:
                print(f"    ❌ Error: {e}")
    
    # 4. Verificar estructura final
    print("\n📋 Estructura final de participacion_actividad:")
    cursor.execute("DESCRIBE participacion_actividad")
    for col in cursor.fetchall():
        print(f"  - {col[0]}: {col[1]}")
    
    # 5. Verificar también actividades_grupo.completada
    print("\n📋 Verificando actividades_grupo:")
    cursor.execute("DESCRIBE actividades_grupo")
    columns = cursor.fetchall()
    existing_columns = [col[0] for col in columns]
    print(f"  Columnas: {existing_columns}")
    
    if 'completada' not in existing_columns:
        print("  ➕ Agregando columna completada a actividades_grupo...")
        cursor.execute("ALTER TABLE actividades_grupo ADD COLUMN completada TINYINT(1) DEFAULT 0")
        conn.commit()
        print("  ✅ Columna agregada")
    
    print("\n✅ Migración completada exitosamente!")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as e:
    print(f"❌ Error de conexión: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
