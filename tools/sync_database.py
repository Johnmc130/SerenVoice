#!/usr/bin/env python3
"""
Script COMPLETO para sincronizar la estructura de BD con el código
Arregla todas las tablas que tienen diferencias
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv('.env')

def get_connection():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        port=int(os.getenv('DB_PORT'))
    )

def execute_sql(conn, sql, description):
    """Ejecutar SQL con manejo de errores"""
    c = conn.cursor()
    try:
        c.execute(sql)
        conn.commit()
        print(f"  ✅ {description}")
        return True
    except mysql.connector.Error as e:
        if "Duplicate column" in str(e) or "already exists" in str(e).lower():
            print(f"  ✓ {description} (ya existe)")
            return True
        else:
            print(f"  ⚠️ {description}: {e.msg[:60]}")
            return False
    finally:
        c.close()

def main():
    conn = get_connection()
    
    print("=" * 60)
    print("🔧 SINCRONIZACIÓN COMPLETA DE BASE DE DATOS")
    print("=" * 60)
    
    # ========================================
    # 1. TABLA: grupo_miembros
    # ========================================
    print("\n📋 1. Arreglando tabla grupo_miembros...")
    
    alteraciones_grupo_miembros = [
        ("ALTER TABLE grupo_miembros ADD COLUMN id_grupo_miembro INT AUTO_INCREMENT PRIMARY KEY FIRST", 
         "Agregar id_grupo_miembro como PK"),
        ("ALTER TABLE grupo_miembros ADD COLUMN activo TINYINT(1) DEFAULT 1",
         "Agregar columna activo"),
        ("ALTER TABLE grupo_miembros ADD COLUMN permisos_especiales VARCHAR(255) DEFAULT NULL",
         "Agregar columna permisos_especiales"),
        ("ALTER TABLE grupo_miembros ADD COLUMN fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
         "Agregar columna fecha_ingreso"),
    ]
    
    # Si id_miembro existe pero id_grupo_miembro no, renombrar
    c = conn.cursor()
    c.execute("DESCRIBE grupo_miembros")
    cols = [col[0] for col in c.fetchall()]
    c.close()
    
    if 'id_miembro' in cols and 'id_grupo_miembro' not in cols:
        execute_sql(conn, 
            "ALTER TABLE grupo_miembros CHANGE id_miembro id_grupo_miembro INT AUTO_INCREMENT",
            "Renombrar id_miembro a id_grupo_miembro")
    
    if 'fecha_union' in cols and 'fecha_ingreso' not in cols:
        execute_sql(conn,
            "ALTER TABLE grupo_miembros CHANGE fecha_union fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "Renombrar fecha_union a fecha_ingreso")
    
    for sql, desc in alteraciones_grupo_miembros:
        execute_sql(conn, sql, desc)
    
    # Agregar valores de rol permitidos
    execute_sql(conn,
        "ALTER TABLE grupo_miembros MODIFY rol_grupo ENUM('admin','moderador','miembro','participante','facilitador') DEFAULT 'participante'",
        "Actualizar ENUM de rol_grupo")
    
    # ========================================
    # 2. TABLA: analisis
    # ========================================
    print("\n📋 2. Verificando tabla analisis...")
    
    c = conn.cursor()
    c.execute("DESCRIBE analisis")
    cols_analisis = [col[0] for col in c.fetchall()]
    c.close()
    
    # Agregar columnas que el código espera
    columnas_analisis = [
        ("nivel_ansiedad", "ALTER TABLE analisis ADD COLUMN nivel_ansiedad DECIMAL(5,2) DEFAULT 0"),
        ("confianza", "ALTER TABLE analisis ADD COLUMN confianza DECIMAL(5,2) DEFAULT 0"),
        ("notas", "ALTER TABLE analisis ADD COLUMN notas TEXT DEFAULT NULL"),
        ("fecha_analisis", "ALTER TABLE analisis ADD COLUMN fecha_analisis TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ]
    
    for col, sql in columnas_analisis:
        if col not in cols_analisis:
            execute_sql(conn, sql, f"Agregar columna {col} a analisis")
        else:
            print(f"  ✓ {col} ya existe en analisis")
    
    # ========================================
    # 3. TABLA: reporte
    # ========================================
    print("\n📋 3. Verificando tabla reporte...")
    
    c = conn.cursor()
    c.execute("DESCRIBE reporte")
    cols_reporte = [col[0] for col in c.fetchall()]
    c.close()
    
    columnas_reporte = [
        ("contenido", "ALTER TABLE reporte ADD COLUMN contenido TEXT DEFAULT NULL"),
        ("estado", "ALTER TABLE reporte ADD COLUMN estado VARCHAR(20) DEFAULT 'generado'"),
        ("ruta_pdf", "ALTER TABLE reporte ADD COLUMN ruta_pdf VARCHAR(255) DEFAULT NULL"),
    ]
    
    for col, sql in columnas_reporte:
        if col not in cols_reporte:
            execute_sql(conn, sql, f"Agregar columna {col} a reporte")
        else:
            print(f"  ✓ {col} ya existe en reporte")
    
    # ========================================
    # 4. TABLA: recomendaciones
    # ========================================
    print("\n📋 4. Verificando tabla recomendaciones...")
    
    c = conn.cursor()
    c.execute("DESCRIBE recomendaciones")
    cols_rec = [col[0] for col in c.fetchall()]
    c.close()
    
    columnas_rec = [
        ("id_analisis", "ALTER TABLE recomendaciones ADD COLUMN id_analisis INT DEFAULT NULL AFTER id_resultado"),
        ("id_usuario", "ALTER TABLE recomendaciones ADD COLUMN id_usuario INT DEFAULT NULL AFTER id_analisis"),
        ("titulo", "ALTER TABLE recomendaciones ADD COLUMN titulo VARCHAR(255) DEFAULT NULL"),
        ("activa", "ALTER TABLE recomendaciones ADD COLUMN activa TINYINT(1) DEFAULT 1"),
    ]
    
    for col, sql in columnas_rec:
        if col not in cols_rec:
            execute_sql(conn, sql, f"Agregar columna {col} a recomendaciones")
        else:
            print(f"  ✓ {col} ya existe en recomendaciones")
    
    # ========================================
    # 5. TABLA: audio
    # ========================================
    print("\n📋 5. Verificando tabla audio...")
    
    c = conn.cursor()
    c.execute("DESCRIBE audio")
    cols_audio = [col[0] for col in c.fetchall()]
    c.close()
    
    columnas_audio = [
        ("nombre_archivo", "ALTER TABLE audio ADD COLUMN nombre_archivo VARCHAR(255) DEFAULT NULL"),
        ("tamano_bytes", "ALTER TABLE audio ADD COLUMN tamano_bytes INT DEFAULT NULL"),
        ("procesado", "ALTER TABLE audio ADD COLUMN procesado TINYINT(1) DEFAULT 0"),
    ]
    
    for col, sql in columnas_audio:
        if col not in cols_audio:
            execute_sql(conn, sql, f"Agregar columna {col} a audio")
        else:
            print(f"  ✓ {col} ya existe en audio")
    
    # ========================================
    # 6. TABLA: invitaciones_grupo
    # ========================================
    print("\n📋 6. Verificando tabla invitaciones_grupo...")
    
    c = conn.cursor()
    c.execute("DESCRIBE invitaciones_grupo")
    cols_inv = [col[0] for col in c.fetchall()]
    c.close()
    
    # Verificar si existe id_invitacion
    if 'id_invitacion' not in cols_inv and 'id' in cols_inv:
        execute_sql(conn,
            "ALTER TABLE invitaciones_grupo CHANGE id id_invitacion INT AUTO_INCREMENT",
            "Renombrar id a id_invitacion")
    
    columnas_inv = [
        ("mensaje", "ALTER TABLE invitaciones_grupo ADD COLUMN mensaje TEXT DEFAULT NULL"),
        ("fecha_respuesta", "ALTER TABLE invitaciones_grupo ADD COLUMN fecha_respuesta TIMESTAMP NULL"),
    ]
    
    for col, sql in columnas_inv:
        if col not in cols_inv:
            execute_sql(conn, sql, f"Agregar columna {col} a invitaciones_grupo")
        else:
            print(f"  ✓ {col} ya existe en invitaciones_grupo")
    
    # ========================================
    # 7. VERIFICAR VISTAS
    # ========================================
    print("\n📋 7. Verificando vistas necesarias...")
    
    c = conn.cursor()
    c.execute("SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE()")
    vistas = [v[0] for v in c.fetchall()]
    c.close()
    
    vistas_requeridas = [
        'vista_usuarios_estadisticas',
        'user_last_analysis',
        'vista_grupos_estadisticas',
        'vista_alertas_pendientes'
    ]
    
    for v in vistas_requeridas:
        if v in vistas:
            print(f"  ✓ Vista {v} existe")
        else:
            print(f"  ⚠️ Vista {v} NO existe - ejecuta railway_create_views.py")
    
    # ========================================
    # RESUMEN FINAL
    # ========================================
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE TABLAS ACTUALIZADAS:")
    print("=" * 60)
    
    tablas = ['usuario', 'grupos', 'grupo_miembros', 'analisis', 'audio', 'reporte', 'recomendaciones']
    
    c = conn.cursor()
    for tabla in tablas:
        try:
            c.execute(f"SELECT COUNT(*) FROM {tabla}")
            count = c.fetchone()[0]
            c.execute(f"DESCRIBE {tabla}")
            cols = len(c.fetchall())
            print(f"  ✅ {tabla}: {cols} columnas, {count} registros")
        except Exception as e:
            print(f"  ❌ {tabla}: {e}")
    c.close()
    
    conn.close()
    print("\n✅ ¡Sincronización completada!")
    print("   Ahora reinicia el backend para aplicar cambios")

if __name__ == "__main__":
    main()
