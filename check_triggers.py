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

# Buscar triggers en la base de datos
cursor.execute("SHOW TRIGGERS")
triggers = cursor.fetchall()
print(f"Triggers encontrados: {len(triggers)}")
for t in triggers:
    print(f"\n  Trigger: {t['Trigger']}")
    print(f"  Tabla: {t['Table']}")
    print(f"  Evento: {t['Event']}")
    print(f"  Statement: {t['Statement'][:200]}...")

# Ver estructura de analisis_voz_participante
print("\n\n" + "="*60)
print("Estructura de analisis_voz_participante:")
cursor.execute("SHOW CREATE TABLE analisis_voz_participante")
result = cursor.fetchone()
print(result['Create Table'])

cursor.close()
conn.close()
