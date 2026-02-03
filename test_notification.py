import mysql.connector
import json

conn = mysql.connector.connect(
    host='switchback.proxy.rlwy.net', 
    port=17529, 
    user='root', 
    password='NhZDwAWhtLPguGpXFExHRKGfggzhAxFD', 
    database='railway'
)

cursor = conn.cursor()

# Crear una notificación de prueba para Kenny (id_usuario = 3)
metadata = json.dumps({'prioridad': 'alta', 'test': True})

cursor.execute('''
    INSERT INTO notificaciones 
    (id_usuario, tipo, titulo, mensaje, url_accion, metadata, leida) 
    VALUES (%s, %s, %s, %s, %s, %s, FALSE)
''', (3, 'test', 'Prueba de notificacion', 'Esta es una notificacion de prueba del sistema', '/dashboard', metadata))

conn.commit()

print(f'Notificacion creada con ID: {cursor.lastrowid}')

# Verificar
cursor.execute('SELECT * FROM notificaciones WHERE id_usuario = 3')
for row in cursor.fetchall():
    print(row)

cursor.close()
conn.close()
