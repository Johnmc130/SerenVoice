import pymysql
import os
from dotenv import load_dotenv

load_dotenv('backend/.env.production')

try:
    conn = pymysql.connect(
        host=os.getenv('DB_HOST'),
        port=int(os.getenv('DB_PORT')),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME')
    )
    cursor = conn.cursor()
    
    print(f"\n🔍 Conectado a BD: {os.getenv('DB_NAME')}")
    
    # Verificar estructura de tabla grupos
    cursor.execute("""
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA=%s AND TABLE_NAME='grupos'
        ORDER BY ORDINAL_POSITION
    """, (os.getenv('DB_NAME'),))
    
    print("\n✅ Estructura de tabla 'grupos':")
    for row in cursor.fetchall():
        nullable = "NULL" if row[2] == "YES" else "NOT NULL"
        default = f"DEFAULT {row[3]}" if row[3] else ""
        print(f"  {row[0]}: {row[1]} {nullable} {default}")
    
    # Verificar si existen grupos
    cursor.execute("SELECT COUNT(*) FROM grupos")
    count = cursor.fetchone()[0]
    print(f"\n📊 Total de grupos: {count}")
    
    if count > 0:
        cursor.execute("SELECT id_grupo, nombre_grupo, id_facilitador FROM grupos LIMIT 3")
        print("\n📋 Primeros 3 grupos:")
        for row in cursor.fetchall():
            print(f"  ID: {row[0]}, Nombre: {row[1]}, Facilitador: {row[2]}")
    
    cursor.close()
    conn.close()
    print("\n✅ Verificación completada")

except Exception as e:
    print(f"\n❌ Error: {e}")
