from database.connection import DatabaseConnection

cols = DatabaseConnection.execute_query('SHOW COLUMNS FROM audio')
print("\n=== COLUMNAS DE AUDIO ===")
for c in cols:
    print(f"{c['Field']:30} {c['Type']:20} {c['Null']:5} {c['Default'] if c['Default'] else ''}")

print("\n=== COLUMNAS DE ANALISIS ===")
cols = DatabaseConnection.execute_query('SHOW COLUMNS FROM analisis')
for c in cols:
    print(f"{c['Field']:30} {c['Type']:20} {c['Null']:5} {c['Default'] if c['Default'] else ''}")

print("\n=== COLUMNAS DE RESULTADO_ANALISIS ===")
cols = DatabaseConnection.execute_query('SHOW COLUMNS FROM resultado_analisis')
for c in cols:
    print(f"{c['Field']:30} {c['Type']:20} {c['Null']:5} {c['Default'] if c['Default'] else ''}")
