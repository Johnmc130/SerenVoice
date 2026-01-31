#!/usr/bin/env python3
"""
Script rápido para importar las tablas faltantes a Railway
"""

import mysql.connector
from mysql.connector import Error
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno
root_dir = Path(__file__).parent.parent
load_dotenv(root_dir / '.env')

def run_migration():
    print("\n" + "="*60)
    print("🚂 RAILWAY - IMPORTANDO TABLAS FALTANTES")
    print("="*60)
    
    config = {
        'host': os.getenv('DB_HOST'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'charset': 'utf8mb4',
        'allow_local_infile': True
    }
    
    print(f"\n📡 Conectando a: {config['host']}:{config['port']}")
    
    try:
        connection = mysql.connector.connect(**config)
        
        if not connection.is_connected():
            print("❌ No se pudo conectar")
            return False
            
        print("✅ Conexión establecida\n")
        
        cursor = connection.cursor()
        
        # Leer el archivo SQL
        sql_file = root_dir / 'migrations' / 'railway_tablas_faltantes.sql'
        
        if not sql_file.exists():
            print(f"❌ Archivo no encontrado: {sql_file}")
            return False
            
        print("📄 Leyendo script de migración...")
        
        with open(sql_file, 'r', encoding='utf8') as f:
            sql_content = f.read()
        
        # Dividir por sentencias (respetando DELIMITER)
        statements = []
        current = []
        
        for line in sql_content.split('\n'):
            stripped = line.strip()
            
            # Ignorar líneas vacías y comentarios puros
            if not stripped or stripped.startswith('--'):
                continue
            if stripped.startswith('DELIMITER'):
                continue
                
            current.append(line)
            
            if ';' in line and not stripped.startswith('--'):
                statement = '\n'.join(current).strip()
                if statement and statement != ';':
                    statements.append(statement)
                current = []
        
        print(f"📊 Ejecutando {len(statements)} sentencias SQL...\n")
        
        created = 0
        skipped = 0
        errors = 0
        
        for i, stmt in enumerate(statements, 1):
            if not stmt.strip():
                continue
                
            # Extraer nombre de tabla si es CREATE TABLE
            table_name = ""
            if "CREATE TABLE" in stmt.upper():
                try:
                    parts = stmt.split('`')
                    if len(parts) >= 2:
                        table_name = parts[1]
                except:
                    pass
            
            try:
                cursor.execute(stmt)
                
                if table_name:
                    print(f"   ✅ Tabla: {table_name}")
                    created += 1
                    
            except Error as e:
                error_msg = str(e).lower()
                
                if 'already exists' in error_msg:
                    if table_name:
                        print(f"   ⏭️  Ya existe: {table_name}")
                    skipped += 1
                elif 'duplicate' in error_msg:
                    skipped += 1
                else:
                    if 'select' not in stmt.lower()[:20]:
                        print(f"   ⚠️  Error: {str(e)[:60]}")
                    errors += 1
        
        connection.commit()
        
        # Verificar tablas finales
        print("\n" + "="*60)
        print("📊 VERIFICACIÓN FINAL")
        print("="*60)
        
        cursor.execute("SHOW TABLES;")
        tables = cursor.fetchall()
        
        print(f"\n✅ Total de tablas en Railway: {len(tables)}\n")
        
        for (table_name,) in sorted(tables):
            cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`;")
            count = cursor.fetchone()[0]
            print(f"   ✓ {table_name}: {count} registros")
        
        cursor.close()
        connection.close()
        
        print("\n" + "="*60)
        print(f"📊 Resumen: {created} creadas, {skipped} ya existían, {errors} errores")
        print("="*60)
        print("\n✅ ¡IMPORTACIÓN COMPLETADA!")
        print("\n💡 Próximos pasos:")
        print("   1. Ve a Railway Dashboard")
        print("   2. Redeploy tu servicio Backend")
        print("   3. Prueba tu aplicación")
        
        return True
        
    except Error as e:
        print(f"\n❌ Error de conexión: {e}")
        return False
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    run_migration()
