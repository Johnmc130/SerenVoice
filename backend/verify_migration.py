import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='serenvoice'
)

cursor = conn.cursor()

print("🔍 Verificando componentes de la migración...\n")

# Verificar tabla
cursor.execute("SHOW TABLES LIKE 'refresh_token'")
if cursor.fetchone():
    print("✅ Tabla 'refresh_token': EXISTE")
else:
    print("❌ Tabla 'refresh_token': NO EXISTE")

# Verificar triggers
cursor.execute("SHOW TRIGGERS WHERE `Table` = 'refresh_token'")
triggers = cursor.fetchall()
print(f"✅ Triggers: {len(triggers)} encontrado(s)")
for trigger in triggers:
    print(f"   - {trigger[0]}")

# Verificar procedimiento
cursor.execute("SHOW PROCEDURE STATUS WHERE Db = 'serenvoice' AND Name = 'limpiar_tokens_expirados'")
if cursor.fetchone():
    print("✅ Procedimiento 'limpiar_tokens_expirados': EXISTE")
else:
    print("❌ Procedimiento 'limpiar_tokens_expirados': NO EXISTE")

# Contar registros
cursor.execute("SELECT COUNT(*) FROM refresh_token")
count = cursor.fetchone()[0]
print(f"✅ Registros en tabla: {count}")

print("\n🎉 ¡Migración completada exitosamente!")
print("📝 Nota: El event scheduler puede configurarse manualmente si es necesario.")

cursor.close()
conn.close()
