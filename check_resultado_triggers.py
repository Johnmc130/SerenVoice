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

# Ver triggers de resultado_actividad_grupal
cursor.execute("SHOW TRIGGERS WHERE `Table` = 'resultado_actividad_grupal'")
triggers = cursor.fetchall()

if triggers:
    print(f'Triggers en resultado_actividad_grupal: {len(triggers)}')
    for t in triggers:
        print(f'\nTrigger: {t["Trigger"]}')
        print(f'Event: {t["Event"]} {t["Timing"]}')
        print(f'Statement:\n{t["Statement"]}')
else:
    print('No hay triggers en resultado_actividad_grupal')

cursor.close()
conn.close()
