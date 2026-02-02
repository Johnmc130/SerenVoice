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
cursor.execute("SELECT id_usuario, correo, nombre, apellido FROM usuario LIMIT 5")
for u in cursor.fetchall():
    print(f"  {u['id_usuario']}: {u['correo']} - {u['nombre']} {u['apellido']}")
cursor.close()
conn.close()
