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

# Buscar tablas que empiecen con resultado
cursor.execute("SHOW TABLES LIKE 'resultado%'")
tables = cursor.fetchall()

print('Tablas con "resultado":')
for t_dict in tables:
    table_name = list(t_dict.values())[0]
    print(f'\n{table_name}:')
    cursor.execute(f'DESCRIBE {table_name}')
    cols = cursor.fetchall()
    for c in cols:
        nullable = 'NULL' if c['Null'] == 'YES' else 'NOT NULL'
        default = f"DEFAULT {c['Default']}" if c['Default'] else ''
        print(f"  {c['Field']:30} {c['Type']:20} {nullable:10} {default}")

cursor.close()
conn.close()
