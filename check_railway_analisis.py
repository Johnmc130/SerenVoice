import pymysql

conn = pymysql.connect(
    host='switchback.proxy.rlwy.net',
    port=17529,
    user='root',
    password='NhZDwAWhtLPguGpXFExHRKGfggzhAxFD',
    database='railway',  # Base de datos railway
    cursorclass=pymysql.cursors.DictCursor
)
cursor = conn.cursor()

# Ver estructura de analisis_voz_participante en railway
print("Estructura de analisis_voz_participante en BD railway:")
cursor.execute("DESCRIBE analisis_voz_participante")
cols = cursor.fetchall()
for c in cols:
    nullable = 'NULL' if c['Null'] == 'YES' else 'NOT NULL'
    default = f"DEFAULT {c['Default']}" if c['Default'] else ''
    print(f"  {c['Field']:30} {c['Type']:20} {nullable:10} {default}")

cursor.close()
conn.close()
