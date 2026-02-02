import pymysql

conn = pymysql.connect(
    host='switchback.proxy.rlwy.net',
    port=17529,
    user='root',
    password='NhZDwAWhtLPguGpXFExHRKGfggzhAxFD',
    database='serenvoice',
    cursorclass=pymysql.cursors.DictCursor
)
cursor = conn.cursor()

# Ver si analisis_voz_participante es una vista
cursor.execute("SHOW FULL TABLES LIKE 'analisis_voz_participante'")
result = cursor.fetchone()
print(f"analisis_voz_participante: {result}")

# Verificar que no tiene columna id_sesion
print("\nColumnas de analisis_voz_participante:")
cursor.execute("DESCRIBE analisis_voz_participante")
for col in cursor.fetchall():
    print(f"  {col['Field']}")

# Intentar el INSERT directamente
print("\n\nProbando INSERT...")
try:
    cursor.execute("""
        INSERT INTO analisis_voz_participante
        (id_actividad, id_usuario, emocion_predominante, nivel_estres, nivel_ansiedad,
         confianza_modelo, emociones_json, duracion_audio, fecha_analisis)
        VALUES (4, 3, 'neutral', 0.5, 0.3, 0.8, '{}', 0, NOW())
        ON DUPLICATE KEY UPDATE
            emocion_predominante = VALUES(emocion_predominante)
    """)
    conn.commit()
    print("✅ INSERT exitoso!")
except Exception as e:
    print(f"❌ Error: {e}")

cursor.close()
conn.close()
