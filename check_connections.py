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

# Ver límite de conexiones
cursor.execute("SHOW VARIABLES LIKE 'max_connections'")
result = cursor.fetchone()
print(f"Max connections: {result['Value']}")

# Ver conexiones activas
cursor.execute("SHOW PROCESSLIST")
processes = cursor.fetchall()
print(f"Conexiones activas: {len(processes)}")

cursor.close()
conn.close()
