import sys
sys.path.insert(0, './backend')
from database.connection import DatabaseConnection

# Verificar schema de tabla grupos
query = "DESCRIBE grupos"
result = DatabaseConnection.execute_query(query, fetch=True)

print("=== SCHEMA DE TABLA grupos ===")
for row in result:
    print(f"{row['Field']}: {row['Type']} | Null: {row['Null']} | Key: {row['Key']} | Default: {row['Default']}")

# Verificar datos del grupo 1
query2 = "SELECT id_grupo, nombre_grupo, id_creador, id_facilitador FROM grupos LIMIT 5"
result2 = DatabaseConnection.execute_query(query2, fetch=True)

print("\n=== DATOS DE GRUPOS ===")
for row in result2:
    print(f"Grupo {row['id_grupo']}: {row['nombre_grupo']}")
    print(f"  id_creador: {row.get('id_creador')}")
    print(f"  id_facilitador: {row.get('id_facilitador')}")
