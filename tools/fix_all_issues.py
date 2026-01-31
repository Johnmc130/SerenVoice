"""
Script de corrección completa de esquema SerenVoice
Corrige TODAS las columnas faltantes, vistas y constraints
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Conexión a Railway
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'switchback.proxy.rlwy.net'),
    'port': int(os.getenv('DB_PORT', 17529)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME', 'railway')
}

def connect():
    return mysql.connector.connect(**DB_CONFIG)

def column_exists(cursor, table, column):
    cursor.execute(f"SHOW COLUMNS FROM `{table}` LIKE '{column}'")
    return cursor.fetchone() is not None

def table_exists(cursor, table):
    cursor.execute(f"SHOW TABLES LIKE '{table}'")
    return cursor.fetchone() is not None

def execute_sql(cursor, sql, description):
    try:
        cursor.execute(sql)
        print(f"  ✅ {description}")
        return True
    except mysql.connector.Error as err:
        if err.errno == 1060:  # Duplicate column
            print(f"  ⏭️ {description} (ya existe)")
            return True
        elif err.errno == 1061:  # Duplicate key
            print(f"  ⏭️ {description} (ya existe)")
            return True
        elif err.errno == 1050:  # Table already exists
            print(f"  ⏭️ {description} (ya existe)")
            return True
        else:
            print(f"  ❌ {description}: {err}")
            return False

def main():
    conn = connect()
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print("🔧 CORRECCIÓN COMPLETA DE BASE DE DATOS SERENVOICE")
    print("="*70 + "\n")
    
    # ===== 1. TABLA ANALISIS =====
    print("📋 1. Corrigiendo tabla 'analisis'...")
    
    if not column_exists(cursor, 'analisis', 'modelo_usado'):
        execute_sql(cursor, """
            ALTER TABLE analisis 
            ADD COLUMN modelo_usado VARCHAR(50) DEFAULT 'heuristic' AFTER id_audio
        """, "Agregar columna modelo_usado")
    
    if not column_exists(cursor, 'analisis', 'version_modelo'):
        execute_sql(cursor, """
            ALTER TABLE analisis 
            ADD COLUMN version_modelo VARCHAR(20) DEFAULT '1.0' AFTER modelo_usado
        """, "Agregar columna version_modelo")
    
    # ===== 2. VERIFICAR ID_RESULTADO EN ALERTA_ANALISIS =====
    print("\n📋 2. Verificando tabla 'alerta_analisis'...")
    
    if column_exists(cursor, 'alerta_analisis', 'id_resultado'):
        print("  ✅ Columna id_resultado existe")
    else:
        print("  ❌ ERROR: id_resultado NO existe (la migración anterior falló)")
        # Intentar crearla nuevamente
        execute_sql(cursor, """
            ALTER TABLE alerta_analisis 
            ADD COLUMN id_resultado INT AFTER id_alerta
        """, "Agregar columna id_resultado")
        
        execute_sql(cursor, """
            ALTER TABLE alerta_analisis 
            ADD CONSTRAINT fk_alerta_resultado 
            FOREIGN KEY (id_resultado) REFERENCES resultado_analisis(id_resultado) 
            ON DELETE CASCADE
        """, "Agregar FK id_resultado")
    
    # ===== 3. TABLA GRUPOS - ID_CREADOR =====
    print("\n📋 3. Corrigiendo tabla 'grupos'...")
    
    # Verificar estructura actual
    cursor.execute("DESCRIBE grupos")
    columns = {row[0]: row for row in cursor.fetchall()}
    
    if 'id_creador' in columns:
        # Verificar si tiene DEFAULT
        field_info = columns['id_creador']
        if field_info[4] is None and field_info[2] == 'NO':  # No default y NOT NULL
            # Primero, hacer que sea NULL temporalmente
            execute_sql(cursor, """
                ALTER TABLE grupos 
                MODIFY COLUMN id_creador INT NULL
            """, "Permitir NULL en id_creador")
            
            # Actualizar registros NULL con un valor temporal (el primer usuario)
            cursor.execute("SELECT id_usuario FROM usuario ORDER BY id_usuario LIMIT 1")
            admin_result = cursor.fetchone()
            if admin_result:
                admin_id = admin_result[0]
                execute_sql(cursor, f"""
                    UPDATE grupos SET id_creador = {admin_id} WHERE id_creador IS NULL
                """, f"Asignar creador por defecto (usuario {admin_id})")
    
    # ===== 4. CREAR VISTAS SQL =====
    print("\n📋 4. Creando vistas SQL...")
    
    # Vista de participación en grupos
    execute_sql(cursor, """
        CREATE OR REPLACE VIEW vista_participacion_grupos AS
        SELECT 
            gm.id AS id_miembro,
            gm.id_grupo,
            gm.id_usuario,
            gm.rol_grupo AS rol_miembro,
            gm.fecha_union,
            CASE WHEN gm.activo = 1 THEN 'activo' ELSE 'inactivo' END AS estado_miembro,
            g.nombre AS nombre_grupo,
            g.descripcion AS descripcion_grupo,
            g.fecha_creacion AS fecha_creacion_grupo,
            u.nombre AS nombre_usuario,
            u.correo AS email_usuario
        FROM grupo_miembro gm
        INNER JOIN grupo g ON gm.id_grupo = g.id_grupo
        INNER JOIN usuario u ON gm.id_usuario = u.id_usuario
        WHERE gm.activo = 1
    """, "Vista vista_participacion_grupos")
    
    # Vista de invitaciones
    execute_sql(cursor, """
        CREATE OR REPLACE VIEW vista_invitaciones_grupo AS
        SELECT 
            ig.id_invitacion,
            ig.id_grupo,
            ig.id_invitador,
            ig.id_invitado,
            ig.estado AS estado_invitacion,
            ig.fecha_invitacion,
            ig.fecha_respuesta,
            g.nombre AS nombre_grupo,
            u_invitador.nombre AS nombre_invitador,
            u_invitador.correo AS email_invitador,
            u_invitado.nombre AS nombre_invitado,
            u_invitado.correo AS email_invitado
        FROM invitacion_grupo ig
        INNER JOIN grupo g ON ig.id_grupo = g.id_grupo
        INNER JOIN usuario u_invitador ON ig.id_invitador = u_invitador.id_usuario
        INNER JOIN usuario u_invitado ON ig.id_invitado = u_invitado.id_usuario
    """, "Vista vista_invitaciones_grupo")
    
    # ===== 5. VERIFICAR JUEGOS =====
    print("\n📋 5. Verificando juegos terapéuticos...")
    
    cursor.execute("SELECT COUNT(*) FROM juegos_terapeuticos")
    count = cursor.fetchone()[0]
    print(f"  📊 Juegos actuales: {count}")
    
    if count < 5:
        print("  ⚠️ Faltan juegos, reinsertando...")
        
        # Eliminar duplicados
        cursor.execute("DELETE FROM juegos_terapeuticos")
        
        juegos = [
            ('Respiración Guiada', 'respiracion', 'ansiedad,estres', 5, '🌬️'),
            ('Jardín Zen', 'mindfulness', 'estres,ansiedad', 10, '🌳'),
            ('Mandala Creativo', 'mandala', 'estres,ansiedad', 15, '🎨'),
            ('Puzzle Numérico', 'puzzle', 'concentracion,memoria', 10, '🧩'),
            ('Juego de Memoria', 'memoria', 'memoria,concentracion', 5, '🃏')
        ]
        
        for nombre, tipo, emociones, duracion, icono in juegos:
            execute_sql(cursor, f"""
                INSERT INTO juegos_terapeuticos 
                (nombre, tipo_juego, emociones_objetivo, duracion_estimada, icono)
                VALUES ('{nombre}', '{tipo}', '{emociones}', {duracion}, '{icono}')
                ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)
            """, f"Insertar juego '{nombre}'")
    
    # ===== 6. MIGRAR ALERTAS A ID_RESULTADO =====
    print("\n📋 6. Migrando alertas existentes...")
    
    if column_exists(cursor, 'alerta_analisis', 'id_resultado'):
        cursor.execute("""
            SELECT COUNT(*) FROM alerta_analisis 
            WHERE id_resultado IS NULL AND id_analisis IS NOT NULL
        """)
        pending_count = cursor.fetchone()[0]
        
        if pending_count > 0:
            print(f"  🔄 Migrando {pending_count} alertas...")
            execute_sql(cursor, """
                UPDATE alerta_analisis aa
                INNER JOIN resultado_analisis ra ON aa.id_analisis = ra.id_analisis
                SET aa.id_resultado = ra.id_resultado
                WHERE aa.id_resultado IS NULL
            """, f"Migrar {pending_count} alertas a id_resultado")
        else:
            print("  ✅ Todas las alertas ya están migradas")
    
    # ===== COMMIT =====
    conn.commit()
    
    print("\n" + "="*70)
    print("✅ CORRECCIÓN COMPLETA FINALIZADA")
    print("="*70)
    
    # ===== RESUMEN =====
    print("\n📊 RESUMEN FINAL:")
    
    cursor.execute("SELECT COUNT(*) FROM juegos_terapeuticos")
    print(f"  🎮 Juegos: {cursor.fetchone()[0]}/5")
    
    cursor.execute("SELECT COUNT(*) FROM notificaciones_plantillas")
    print(f"  📧 Plantillas: {cursor.fetchone()[0]}/16")
    
    if column_exists(cursor, 'analisis', 'modelo_usado'):
        print("  ✅ analisis.modelo_usado: Existe")
    else:
        print("  ❌ analisis.modelo_usado: FALTA")
    
    if column_exists(cursor, 'alerta_analisis', 'id_resultado'):
        print("  ✅ alerta_analisis.id_resultado: Existe")
    else:
        print("  ❌ alerta_analisis.id_resultado: FALTA")
    
    if table_exists(cursor, 'vista_participacion_grupos'):
        print("  ✅ vista_participacion_grupos: Existe")
    else:
        print("  ❌ vista_participacion_grupos: FALTA")
    
    if table_exists(cursor, 'vista_invitaciones_grupo'):
        print("  ✅ vista_invitaciones_grupo: Existe")
    else:
        print("  ❌ vista_invitaciones_grupo: FALTA")
    
    cursor.close()
    conn.close()
    
    print("\n🎯 PRÓXIMO PASO: Reiniciar backend con:")
    print("   gcloud run services update serenvoice-backend --region us-central1 --update-env-vars \"SCHEMA_FIX_COMPLETE=2026-01-30-v2\"")

if __name__ == '__main__':
    main()
