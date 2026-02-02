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
cursor.execute('DESCRIBE analisis_voz_participante')
cols = cursor.fetchall()
print('Columnas de analisis_voz_participante:')
for c in cols:
    field = c["Field"]
    typ = c["Type"]
    key = c["Key"]
    extra = c["Extra"]
    print(f"  {field}: {typ} | Key={key} | {extra}")
cursor.close()
conn.close()
