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

# Ver conexiones activas
cursor.execute("SHOW PROCESSLIST")
processes = cursor.fetchall()
print(f"Total conexiones activas: {len(processes)}\n")

# Matar conexiones inactivas (Sleep) excepto la nuestra
killed = 0
for p in processes:
    if p['Command'] == 'Sleep' and p['Time'] > 60:  # Inactiva > 60 segundos
        try:
            print(f"Matando conexion {p['Id']} (inactiva {p['Time']}s)")
            cursor.execute(f"KILL {p['Id']}")
            killed += 1
        except Exception as e:
            print(f"  Error: {e}")

conn.commit()

# Ver estado final
cursor.execute("SHOW PROCESSLIST")
processes = cursor.fetchall()
print(f"\nConexiones matadas: {killed}")
print(f"Conexiones restantes: {len(processes)}")

cursor.close()
conn.close()
