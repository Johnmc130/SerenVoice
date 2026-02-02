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

# Ver SHOW CREATE TABLE para ver constraints completos
cursor.execute('SHOW CREATE TABLE analisis_voz_participante')
result = cursor.fetchone()
print('ESTRUCTURA COMPLETA:')
print(result['Create Table'])

print('\n' + '='*60)
print('Indices:')
cursor.execute('SHOW INDEX FROM analisis_voz_participante')
for idx in cursor.fetchall():
    print(f"  {idx['Key_name']}: {idx['Column_name']} (unique={not idx['Non_unique']})")

cursor.close()
conn.close()
