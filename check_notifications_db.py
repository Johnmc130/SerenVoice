import mysql.connector

conn = mysql.connector.connect(
    host='switchback.proxy.rlwy.net',
    port=17529,
    user='root',
    password='NhZDwAWhtLPguGpXFExHRKGfggzhAxFD',
    database='railway'
)

cursor = conn.cursor(dictionary=True)

# Primero ver las tablas
print('=== TABLAS EN LA BD ===')
cursor.execute('SHOW TABLES')
for row in cursor.fetchall():
    print(list(row.values())[0])

print()
print('=== ULTIMAS NOTIFICACIONES EN BD ===')
cursor.execute('SELECT * FROM notificaciones ORDER BY fecha_creacion DESC LIMIT 10')
rows = cursor.fetchall()
if not rows:
    print("No hay notificaciones en la BD")
else:
    for row in rows:
        print(row)

print()
print('=== INTENTOS DE LOGIN (bloqueos) ===')
cursor.execute('SELECT * FROM login_attempts ORDER BY ultimo_intento DESC LIMIT 5')
for row in cursor.fetchall():
    print(row)

print()
print('=== NOTIFICACIONES DE KENNY (ID=3) ===')
cursor.execute('SELECT * FROM notificaciones WHERE id_usuario = 3 ORDER BY fecha_creacion DESC LIMIT 5')
rows = cursor.fetchall()
if not rows:
    print("Kenny no tiene notificaciones")
else:
    for row in rows:
        print(row)

cursor.close()
conn.close()
