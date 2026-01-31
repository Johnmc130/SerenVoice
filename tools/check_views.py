"""
Verificar columnas de vistas y corregir modelos
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

conn = mysql.connector.connect(
    host=os.getenv('DB_HOST'),
    port=int(os.getenv('DB_PORT')),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME')
)
cursor = conn.cursor()

print("📋 Columnas de vista_invitaciones_grupo:")
cursor.execute("DESCRIBE vista_invitaciones_grupo")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

print("\n📋 Columnas de invitacion_grupo:")
cursor.execute("DESCRIBE invitacion_grupo")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

print("\n📋 Columnas de preferencia_notificacion:")
cursor.execute("DESCRIBE preferencia_notificacion")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

cursor.close()
conn.close()
