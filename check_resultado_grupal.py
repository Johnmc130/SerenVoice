import pymysql

# Credenciales Railway
DB_HOST = 'switchback.proxy.rlwy.net'
DB_PORT = 17529
DB_USER = 'root'
DB_PASSWORD = 'NhZDwAWhtLPguGpXFExHRKGfggzhAxFD'
DB_NAME = 'railway'

try:
    print("\n🔗 Conectando a Railway...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()
    cursor.execute(f"USE {DB_NAME}")
    
    print(f"✅ Conectado a BD: {DB_NAME}")
    
    # Verificar estructura de resultado_actividad_grupal
    cursor.execute("DESCRIBE resultado_actividad_grupal")
    print("\n📋 Estructura de resultado_actividad_grupal:")
    columns = {}
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]} {row[2]} {row[3]}")
        columns[row[0]] = True
    
    # Verificar si hay columna emociones_promedio_json
    if 'emociones_promedio_json' not in columns and 'emociones_promedio' in columns:
        print("\n⚠️  La columna se llama 'emociones_promedio', no 'emociones_promedio_json'")
        print("   El código del backend debe usar 'emociones_promedio'")
    
    # Verificar si hay datos
    cursor.execute("SELECT COUNT(*) FROM resultado_actividad_grupal")
    count = cursor.fetchone()[0]
    print(f"\n📊 Total de resultados guardados: {count}")
    
    if count > 0:
        cursor.execute("SELECT * FROM resultado_actividad_grupal LIMIT 1")
        print("\n📋 Ejemplo de resultado:")
        result = cursor.fetchone()
        print(f"  ID Actividad: {result[1]}")
        print(f"  Emoción: {result[2]}")
        print(f"  Estrés: {result[3]}")
        print(f"  Ansiedad: {result[4]}")
    
    cursor.close()
    conn.close()
    print("\n✅ Verificación completada")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
