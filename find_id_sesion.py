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

# Buscar tablas con columna id_sesion
cursor.execute("""
    SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE COLUMN_NAME = 'id_sesion' AND TABLE_SCHEMA = 'serenvoice'
""")
print("Tablas con columna id_sesion:")
for r in cursor.fetchall():
    print(f"  {r['TABLE_NAME']}.{r['COLUMN_NAME']} - nullable={r['IS_NULLABLE']}, default={r['COLUMN_DEFAULT']}")

cursor.close()
conn.close()
