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

# Ver FK de analisis_voz_participante
cursor.execute("""
SELECT 
    CONSTRAINT_NAME, 
    TABLE_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'serenvoice'
  AND TABLE_NAME = 'analisis_voz_participante'
  AND REFERENCED_TABLE_NAME IS NOT NULL
""")

print('Foreign Keys de analisis_voz_participante:')
for fk in cursor.fetchall():
    print(f"  {fk['CONSTRAINT_NAME']}: {fk['COLUMN_NAME']} -> {fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}")

# También ver si analisis_voz_participante es una vista
cursor.execute("SHOW FULL TABLES WHERE Tables_in_serenvoice LIKE 'analisis_voz_participante'")
result = cursor.fetchone()
if result:
    print(f"\nTipo: {list(result.values())[1]}")

cursor.close()
conn.close()
