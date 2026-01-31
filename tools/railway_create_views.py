#!/usr/bin/env python3
"""
Script para crear las vistas faltantes en Railway
"""

import mysql.connector
from mysql.connector import Error
import os
from pathlib import Path
from dotenv import load_dotenv

root_dir = Path(__file__).parent.parent
load_dotenv(root_dir / '.env')

def create_views():
    print("\n" + "="*60)
    print("📊 RAILWAY - CREANDO VISTAS DE BASE DE DATOS")
    print("="*60)
    
    config = {
        'host': os.getenv('DB_HOST'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'charset': 'utf8mb4'
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
        sql_file = root_dir / 'migrations' / 'railway_vistas_faltantes.sql'
        
        print("📄 Leyendo script de vistas...")
        
        with open(sql_file, 'r', encoding='utf8') as f:
            sql_content = f.read()
        
        # Dividir por sentencias
        statements = []
        current = []
        
        for line in sql_content.split('\n'):
            stripped = line.strip()
            
            if not stripped or stripped.startswith('--'):
                continue
                
            current.append(line)
            
            if ';' in line and not stripped.startswith('--'):
                statement = '\n'.join(current).strip()
                if statement and statement != ';':
                    statements.append(statement)
                current = []
        
        print(f"📊 Ejecutando {len(statements)} sentencias SQL...\n")
        
        created = 0
        
        for stmt in statements:
            if not stmt.strip():
                continue
            
            # Extraer nombre de vista
            view_name = ""
            if "CREATE VIEW" in stmt.upper():
                try:
                    parts = stmt.split('`')
                    if len(parts) >= 2:
                        view_name = parts[1]
                except:
                    pass
            
            try:
                cursor.execute(stmt)
                
                if view_name:
                    print(f"   ✅ Vista: {view_name}")
                    created += 1
                    
            except Error as e:
                if view_name:
                    print(f"   ⚠️  {view_name}: {str(e)[:80]}")
        
        connection.commit()
        
        # Verificar vistas creadas
        print("\n" + "="*60)
        print("📊 VISTAS EN LA BASE DE DATOS")
        print("="*60 + "\n")
        
        cursor.execute("SHOW FULL TABLES WHERE Table_type = 'VIEW';")
        views = cursor.fetchall()
        
        if views:
            for (view_name, table_type) in sorted(views):
                print(f"   ✓ {view_name}")
        else:
            print("   (No se encontraron vistas)")
        
        cursor.close()
        connection.close()
        
        print("\n" + "="*60)
        print(f"✅ {created} vistas creadas correctamente")
        print("="*60)
        print("\n💡 Ahora puedes reiniciar tu backend y la vista funcionará")
        
        return True
        
    except Error as e:
        print(f"\n❌ Error: {e}")
        return False


if __name__ == "__main__":
    create_views()
