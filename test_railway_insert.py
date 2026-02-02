import pymysql
import json

conn = pymysql.connect(
    host='switchback.proxy.rlwy.net',
    port=17529,
    user='root',
    password='NhZDwAWhtLPguGpXFExHRKGfggzhAxFD',
    database='railway',
    cursorclass=pymysql.cursors.DictCursor
)
cursor = conn.cursor()

print("Probando INSERT sin id_sesion...")

try:
    cursor.execute("""
        INSERT INTO analisis_voz_participante
        (id_actividad, id_usuario, emocion_predominante, nivel_estres, nivel_ansiedad,
         confianza_modelo, emociones_json, duracion_audio, fecha_analisis)
        VALUES (4, 3, 'neutral', 0.5, 0.3, 0.8, %s, 0, NOW())
        ON DUPLICATE KEY UPDATE
            emocion_predominante = VALUES(emocion_predominante),
            nivel_estres = VALUES(nivel_estres),
            nivel_ansiedad = VALUES(nivel_ansiedad),
            confianza_modelo = VALUES(confianza_modelo),
            emociones_json = VALUES(emociones_json),
            duracion_audio = VALUES(duracion_audio),
            fecha_analisis = NOW()
    """, (json.dumps({'felicidad': 0.8, 'tristeza': 0.2}),))
    
    conn.commit()
    print("✅ INSERT exitoso!")
    print(f"   ID insertado: {cursor.lastrowid}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()

cursor.close()
conn.close()
