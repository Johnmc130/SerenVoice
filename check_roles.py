from backend.database.connection import DatabaseConnection

# Ver los miembros del grupo y sus roles
print('=== Miembros de grupos y sus roles ===')
result = DatabaseConnection.execute_query('''
    SELECT gm.id_grupo, g.nombre_grupo, gm.id_usuario, u.nombre, gm.rol_grupo, g.id_creador
    FROM grupo_miembros gm
    JOIN grupos g ON gm.id_grupo = g.id_grupo
    JOIN usuario u ON gm.id_usuario = u.id_usuario
    WHERE gm.estado = 'activo'
    ORDER BY gm.id_grupo DESC
    LIMIT 10
''')
for r in result:
    es_creador = '(CREADOR)' if r['id_usuario'] == r['id_creador'] else ''
    print(f"Grupo {r['id_grupo']}: {r['nombre_grupo']} | Usuario: {r['nombre']} | Rol: {r['rol_grupo']} {es_creador}")
