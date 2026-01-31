"""
Verificar estructura de todas las tablas problemáticas
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'port': int(os.getenv('DB_PORT', 17529)),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME', 'railway')
}

def verify_table(cursor, table_name):
    print(f"\n{'='*70}")
    print(f"📋 TABLA: {table_name}")
    print(f"{'='*70}")
    
    cursor.execute(f"DESCRIBE {table_name}")
    columns = cursor.fetchall()
    
    for col in columns:
        field, tipo, null, key, default, extra = col
        print(f"  {field:30} {tipo:20} NULL={null:3} KEY={key:3} DEFAULT={default}")
    
    return [col[0] for col in columns]

def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("\n🔍 VERIFICACIÓN DE ESTRUCTURAS DE TABLAS\n")
    
    # Tablas críticas que están fallando
    tables = [
        'sesion',           # Error: columna 'activo'
        'juego_terapeutico', # Solo muestra 2 juegos
        'juegos_terapeuticos', # Ambas variantes
        'grupo',            # Errores 500
        'grupo_miembro',    # Vistas
        'invitacion_grupo', # Vistas
        'actividad_grupo',  # Actividades
        'preferencia_notificacion', # Preferencias
        'resultado_analisis', # Análisis
    ]
    
    schemas = {}
    for table in tables:
        try:
            cols = verify_table(cursor, table)
            schemas[table] = cols
        except mysql.connector.Error as err:
            print(f"  ❌ Error: {err}")
    
    # Resumen
    print("\n" + "="*70)
    print("📊 RESUMEN DE COLUMNAS CRÍTICAS")
    print("="*70)
    
    checks = [
        ('sesion', 'activo', '❌ El código busca esta columna pero NO EXISTE'),
        ('juegos_terapeuticos', 'tipo_juego', '✅ Debe existir'),
        ('preferencia_notificacion', 'id_usuario', '✅ Debe existir'),
    ]
    
    for table, column, note in checks:
        if table in schemas:
            exists = column in schemas[table]
            status = '✅' if exists else '❌'
            print(f"{status} {table}.{column}: {note}")
    
    # Contar juegos
    print("\n" + "="*70)
    print("🎮 JUEGOS TERAPÉUTICOS")
    print("="*70)
    
    for table in ['juegos_terapeuticos', 'juego_terapeutico']:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table}: {count} juegos")
            
            cursor.execute(f"SELECT nombre, tipo_juego FROM {table} LIMIT 10")
            juegos = cursor.fetchall()
            for nombre, tipo in juegos:
                print(f"    - {nombre} ({tipo})")
        except:
            print(f"  {table}: NO EXISTE")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    main()
