import pymysql

conn = pymysql.connect(
    host='switchback.proxy.rlwy.net',
    port=17529,
    user='root',
    password='NhZDwAWhtLPguGpXFExHRKGfggzhAxFD',
    database='railway',
    cursorclass=pymysql.cursors.DictCursor
)
cursor = conn.cursor()

print("Modificando tabla analisis_voz_participante en railway...")

# 1. Hacer id_sesion nullable (permitir NULL)
try:
    cursor.execute("ALTER TABLE analisis_voz_participante MODIFY id_sesion int NULL")
    print("✅ id_sesion ahora es NULL")
except Exception as e:
    print(f"❌ Error modificando id_sesion: {e}")

# 2. Agregar unique key si no existe para UPSERT
try:
    cursor.execute("SHOW INDEX FROM analisis_voz_participante WHERE Key_name = 'unique_actividad_usuario'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE analisis_voz_participante ADD UNIQUE KEY unique_actividad_usuario (id_actividad, id_usuario)")
        print("✅ Unique key unique_actividad_usuario agregada")
    else:
        print("ℹ️  Unique key ya existe")
except Exception as e:
    print(f"❌ Error agregando unique key: {e}")

conn.commit()

# Verificar cambios
print("\nEstructura actualizada:")
cursor.execute("DESCRIBE analisis_voz_participante")
for c in cursor.fetchall():
    if c['Field'] == 'id_sesion':
        print(f"  {c['Field']}: {c['Type']} {c['Null']} {c['Default']}")

cursor.close()
conn.close()

print("\n✅ Cambios aplicados exitosamente")
