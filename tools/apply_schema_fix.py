#!/usr/bin/env python3
"""
Script para aplicar fix_schema_and_seed_data.sql a la base de datos remota
Corrige schema de alerta_analisis e inserta datos en notificaciones_plantillas y juegos
"""
import mysql.connector
import os
import sys
from dotenv import load_dotenv

load_dotenv('.env')

def get_connection():
    """Crear conexión a la base de datos remota"""
    try:
        return mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME'),
            port=int(os.getenv('DB_PORT', '3306')),
            connect_timeout=30
        )
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        sys.exit(1)

def column_exists(conn, table_name, column_name):
    """Verificar si una columna existe en una tabla"""
    cursor = conn.cursor()
    try:
        cursor.execute(f"""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = '{table_name}' 
            AND COLUMN_NAME = '{column_name}'
        """)
        return cursor.fetchone()[0] > 0
    finally:
        cursor.close()

def table_exists(conn, table_name):
    """Verificar si una tabla existe"""
    cursor = conn.cursor()
    try:
        cursor.execute(f"""
            SELECT COUNT(*) 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = '{table_name}'
        """)
        return cursor.fetchone()[0] > 0
    finally:
        cursor.close()

def execute_sql(conn, sql, description):
    """Ejecutar SQL con manejo de errores"""
    cursor = conn.cursor()
    try:
        # Ignorar comentarios y líneas vacías
        if sql.strip().startswith('--') or not sql.strip():
            return True
        
        cursor.execute(sql)
        conn.commit()
        print(f"  ✅ {description}")
        return True
    except mysql.connector.Error as e:
        error_msg = str(e).lower()
        if any(x in error_msg for x in ['duplicate', 'already exists', 'exists']):
            print(f"  ✓ {description} (ya existe)")
            return True
        else:
            print(f"  ⚠️ {description}: {str(e)[:100]}")
            return False
    finally:
        cursor.close()

def main():
    print("=" * 70)
    print("🔧 APLICANDO MIGRACIÓN: fix_schema_and_seed_data.sql")
    print("=" * 70)
    
    conn = get_connection()
    
    # ========================================
    # 1. ACTUALIZAR alerta_analisis
    # ========================================
    print("\n📋 1. Actualizando tabla alerta_analisis...")
    
    columns_to_add = [
        ('id_resultado', 'INT NULL', 'después de id_analisis'),
        ('tipo_recomendacion', 'VARCHAR(100) NULL', 'después de tipo_alerta'),
        ('titulo', 'VARCHAR(255) NULL', 'después de tipo_recomendacion'),
        ('descripcion', 'TEXT NULL', 'después de titulo'),
        ('contexto', 'JSON NULL', 'después de descripcion'),
        ('fecha', 'DATE NULL', 'después de contexto'),
        ('activo', 'BOOLEAN DEFAULT TRUE', 'después de fecha'),
    ]
    
    for col_name, col_def, position in columns_to_add:
        if not column_exists(conn, 'alerta_analisis', col_name):
            execute_sql(conn,
                f"ALTER TABLE alerta_analisis ADD COLUMN {col_name} {col_def}",
                f"Agregar columna {col_name}")
        else:
            print(f"  ✓ Columna {col_name} ya existe en alerta_analisis")
    
    # Agregar foreign key para id_resultado
    execute_sql(conn,
        """
        ALTER TABLE alerta_analisis 
        ADD CONSTRAINT fk_alerta_resultado 
        FOREIGN KEY (id_resultado) REFERENCES resultado_analisis(id_resultado) 
        ON DELETE CASCADE
        """,
        "Agregar FK id_resultado")
    
    execute_sql(conn,
        "CREATE INDEX idx_alerta_resultado ON alerta_analisis(id_resultado)",
        "Crear índice idx_alerta_resultado")
    
    # ========================================
    # 2. ACTUALIZAR resultado_analisis
    # ========================================
    print("\n📋 2. Actualizando tabla resultado_analisis...")
    
    columns_resultado = [
        ('nivel_estres', 'DECIMAL(5,2) NULL'),
        ('nivel_ansiedad', 'DECIMAL(5,2) NULL'),
        ('clasificacion', "VARCHAR(50) NULL COMMENT 'normal, leve, moderado, alto, muy_alto'"),
        ('emocion_dominante', 'VARCHAR(50) NULL'),
        ('confianza', 'DECIMAL(5,2) NULL'),
    ]
    
    for col_name, col_def in columns_resultado:
        if not column_exists(conn, 'resultado_analisis', col_name):
            execute_sql(conn,
                f"ALTER TABLE resultado_analisis ADD COLUMN {col_name} {col_def}",
                f"Agregar columna {col_name}")
        else:
            print(f"  ✓ Columna {col_name} ya existe en resultado_analisis")
    
    # ========================================
    # 3. CREAR TABLA notificaciones_plantillas
    # ========================================
    print("\n📋 3. Creando tabla notificaciones_plantillas...")
    
    if not table_exists(conn, 'notificaciones_plantillas'):
        execute_sql(conn, """
            CREATE TABLE notificaciones_plantillas (
              id_plantilla INT NOT NULL AUTO_INCREMENT,
              codigo VARCHAR(100) NOT NULL UNIQUE COMMENT 'Código único para identificar la plantilla',
              categoria VARCHAR(50) NOT NULL COMMENT 'invitacion_grupo, actividad_grupo, recordatorio_actividad, etc.',
              titulo VARCHAR(255) NOT NULL,
              mensaje TEXT NOT NULL COMMENT 'Mensaje con variables {{nombre_variable}}',
              icono VARCHAR(50) NULL DEFAULT '📢',
              url_patron VARCHAR(255) NULL COMMENT 'URL con variables {{id_grupo}}, {{id_actividad}}',
              prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
              tipo_notificacion VARCHAR(50) NULL COMMENT 'push, email, inapp',
              requiere_accion BOOLEAN DEFAULT FALSE,
              enviar_push BOOLEAN DEFAULT TRUE,
              enviar_email BOOLEAN DEFAULT TRUE,
              activo BOOLEAN DEFAULT TRUE,
              fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (id_plantilla),
              INDEX idx_codigo (codigo),
              INDEX idx_categoria (categoria)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """, "Crear tabla notificaciones_plantillas")
    else:
        print("  ✓ Tabla notificaciones_plantillas ya existe")
    
    # ========================================
    # 4. INSERTAR PLANTILLAS
    # ========================================
    print("\n📋 4. Insertando plantillas de notificaciones...")
    
    plantillas = [
        ('invitacion_grupo', 'invitacion_grupo', 'Invitación a {{nombre_grupo}}', 
         '{{nombre_facilitador}} te ha invitado a unirte al grupo "{{nombre_grupo}}". ¡Únete para participar en actividades terapéuticas!',
         '👥', '/grupos/invitacion/{{id_grupo}}', 'alta', 1, 1, 1),
        
        ('nueva_actividad', 'actividad_grupo', 'Nueva actividad: {{titulo_actividad}}',
         'Se ha creado una nueva actividad en {{nombre_grupo}}. Fecha: {{fecha_programada}}',
         '📋', '/grupos/{{id_grupo}}/actividades/{{id_actividad}}', 'media', 0, 1, 1),
        
        ('recordatorio_actividad', 'recordatorio_actividad', 'Recordatorio: {{titulo_actividad}}',
         'La actividad "{{titulo_actividad}}" está programada para {{fecha_programada}}. ¡No olvides participar!',
         '⏰', '/grupos/{{id_grupo}}/actividades/{{id_actividad}}', 'media', 0, 1, 1),
        
        ('nueva_recomendacion', 'recomendacion', 'Nueva recomendación personalizada',
         'Basado en tu último análisis, tenemos una recomendación de tipo {{tipo_recomendacion}} para ti.',
         '💡', '/recomendaciones/{{id_recomendacion}}', 'media', 1, 0, 1),
        
        ('alerta_critica', 'alerta_critica', '⚠️ Alerta importante',
         '{{mensaje_alerta}}. Te recomendamos considerar apoyo profesional.',
         '🚨', '/alertas/{{id_alerta}}', 'urgente', 1, 1, 1),
        
        ('logro_juego', 'logro_desbloqueado', '🎉 ¡Logro desbloqueado!',
         '¡Felicidades! Has completado {{nombre_logro}}. Sigue así.',
         '🏆', '/perfil/logros', 'baja', 0, 1, 0),
        
        ('recordatorio_analisis', 'recordatorio_analisis', 'Es momento de registrar tu estado emocional',
         'Han pasado {{dias}} días desde tu último análisis. ¿Cómo te sientes hoy?',
         '🎤', '/grabar', 'baja', 0, 1, 1),
        
        ('mensaje_facilitador', 'mensaje_facilitador', 'Mensaje de {{nombre_facilitador}}',
         '{{mensaje}}',
         '💬', '/grupos/{{id_grupo}}/mensajes', 'media', 0, 1, 1),
        
        ('sesion_grupal_iniciada', 'actividad_grupo', '🎤 Actividad Grupal: {{titulo}}',
         'Se ha iniciado una actividad de análisis emocional en {{nombre_grupo}}. ¡Graba tu audio para participar!',
         '🎤', '/grupos/{{id_grupo}}/sesion/{{id_sesion}}', 'alta', 0, 1, 1),
        
        ('sesion_grupal_completada', 'actividad_grupo', '✅ Actividad Completada: {{titulo}}',
         '¡Todos los miembros han completado la actividad! Ya puedes ver los resultados grupales.',
         '✅', '/grupos/{{id_grupo}}/sesion/{{id_sesion}}/resultados', 'alta', 0, 1, 1),
        
        ('sesion_grupal_recordatorio', 'recordatorio_actividad', '⏰ Recordatorio: {{titulo}}',
         'Aún no has grabado tu audio para la actividad grupal. ¡No te quedes fuera!',
         '⏰', '/grupos/{{id_grupo}}/sesion/{{id_sesion}}', 'media', 0, 1, 1),
        
        ('alerta_critica_usuario', 'alerta_critica', '⚠️ Alerta Crítica',
         '{{mensaje_custom}}',
         '🚨', '', 'urgente', 0, 0, 0),
        
        ('alerta_critica_facilitador', 'alerta_critica', '🚨 Alerta: Atención requerida',
         'El usuario {{nombre_usuario}} {{apellido_usuario}} presenta niveles críticos (Estrés: {{nivel_estres}}%, Ansiedad: {{nivel_ansiedad}}%). Fecha: {{fecha_alerta}}',
         '🚨', '', 'urgente', 0, 0, 0),
        
        ('alerta_alta', 'alerta_critica', '⚠️ Alerta Alta',
         '{{mensaje_custom}}',
         '⚠️', '', 'alta', 0, 0, 0),
        
        ('alerta_alta_facilitador', 'alerta_critica', '⚠️ Alerta Alta: Seguimiento requerido',
         'El usuario {{nombre_usuario}} {{apellido_usuario}} muestra niveles elevados (Estrés: {{nivel_estres}}%, Ansiedad: {{nivel_ansiedad}}%). Considera hacer seguimiento.',
         '⚠️', '', 'alta', 0, 0, 0),
        
        ('alerta_media', 'recomendacion', '💡 Recomendación',
         '{{mensaje_personalizado}}',
         '💡', '', 'media', 0, 0, 0),
    ]
    
    cursor = conn.cursor()
    for plantilla in plantillas:
        try:
            cursor.execute("""
                INSERT INTO notificaciones_plantillas 
                (codigo, categoria, titulo, mensaje, icono, url_patron, prioridad, 
                 requiere_accion, enviar_push, enviar_email) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                titulo = VALUES(titulo), 
                mensaje = VALUES(mensaje), 
                icono = VALUES(icono), 
                url_patron = VALUES(url_patron)
            """, plantilla)
            conn.commit()
            print(f"  ✅ Plantilla '{plantilla[0]}' insertada/actualizada")
        except Exception as e:
            print(f"  ⚠️ Error con plantilla '{plantilla[0]}': {str(e)[:80]}")
    cursor.close()
    
    # ========================================
    # 5. CREAR TABLA juegos_terapeuticos
    # ========================================
    print("\n📋 5. Creando tabla juegos_terapeuticos...")
    
    if not table_exists(conn, 'juegos_terapeuticos'):
        execute_sql(conn, """
            CREATE TABLE juegos_terapeuticos (
              id_juego INT NOT NULL AUTO_INCREMENT,
              nombre VARCHAR(100) NOT NULL,
              tipo_juego VARCHAR(50) NOT NULL COMMENT 'respiracion, mindfulness, mandala, puzzle, memoria',
              descripcion TEXT NULL,
              objetivo_emocional VARCHAR(50) NULL COMMENT 'ansiedad, estres, relajacion',
              duracion_recomendada INT NULL DEFAULT 5,
              icono VARCHAR(50) NULL DEFAULT '🎮',
              activo BOOLEAN DEFAULT TRUE,
              fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (id_juego),
              INDEX idx_tipo (tipo_juego),
              INDEX idx_activo (activo)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """, "Crear tabla juegos_terapeuticos")
    else:
        print("  ✓ Tabla juegos_terapeuticos ya existe")
    
    # ========================================
    # 6. INSERTAR JUEGOS
    # ========================================
    print("\n📋 6. Insertando juegos terapéuticos...")
    
    juegos = [
        ('Respiración Guiada', 'respiracion', 
         'Ejercicio guiado de respiración 4-4-6 para reducir la ansiedad y el estrés. Inhala, mantén y exhala siguiendo el ritmo visual.',
         '["ansiedad", "estres"]', 5, '🌬️', 'facil'),
        
        ('Jardín Zen', 'mindfulness',
         'Crea tu jardín zen virtual mientras practicas la atención plena. Planta flores, árboles y cuida tu espacio de paz interior.',
         '["estres", "relajacion"]', 10, '🌳', 'facil'),
        
        ('Mandala Creativo', 'mandala',
         'Colorea mandalas terapéuticos para relajarte y fomentar la creatividad. Elige colores y patrones para expresar tu estado emocional.',
         '["estres", "creatividad"]', 7, '🎨', 'medio'),
        
        ('Puzzle Numérico', 'puzzle',
         'Resuelve el puzzle deslizante 3x3 ordenando los números del 1 al 8. Ejercita tu mente mientras te concentras en el presente.',
         '["ansiedad", "concentracion"]', 8, '🧩', 'medio'),
        
        ('Juego de Memoria', 'memoria',
         'Encuentra los pares de emojis iguales ejercitando tu memoria. Un juego relajante que mejora la concentración y reduce el estrés.',
         '["estres", "memoria"]', 15, '🃏', 'medio'),
    ]
    
    cursor = conn.cursor()
    for juego in juegos:
        try:
            cursor.execute("""
                INSERT INTO juegos_terapeuticos 
                (nombre, tipo_juego, descripcion, emociones_objetivo, duracion_estimada, icono, nivel_dificultad) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                descripcion = VALUES(descripcion), 
                duracion_estimada = VALUES(duracion_estimada), 
                icono = VALUES(icono),
                emociones_objetivo = VALUES(emociones_objetivo)
            """, juego)
            conn.commit()
            print(f"  ✅ Juego '{juego[0]}' insertado/actualizado")
        except Exception as e:
            print(f"  ⚠️ Error con juego '{juego[0]}': {str(e)[:80]}")
    cursor.close()
    
    # ========================================
    # 7. CREAR TABLA sesiones_juego
    # ========================================
    print("\n📋 7. Creando tabla sesiones_juego...")
    
    if not table_exists(conn, 'sesiones_juego'):
        execute_sql(conn, """
            CREATE TABLE sesiones_juego (
              id INT NOT NULL AUTO_INCREMENT,
              id_usuario INT NOT NULL,
              id_juego INT NOT NULL,
              fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              fecha_fin TIMESTAMP NULL,
              completado BOOLEAN DEFAULT FALSE,
              puntuacion INT NULL DEFAULT 0,
              nivel_alcanzado INT NULL DEFAULT 1,
              duracion_segundos INT NULL,
              estado_antes VARCHAR(20) NULL,
              estado_despues VARCHAR(20) NULL,
              mejora_percibida VARCHAR(20) NULL,
              notas TEXT NULL,
              PRIMARY KEY (id),
              FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
              FOREIGN KEY (id_juego) REFERENCES juegos_terapeuticos(id_juego) ON DELETE CASCADE,
              INDEX idx_usuario_juego (id_usuario, id_juego),
              INDEX idx_fecha (fecha_inicio)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """, "Crear tabla sesiones_juego")
    else:
        print("  ✓ Tabla sesiones_juego ya existe")
    
    # ========================================
    # 8. MIGRAR DATOS EXISTENTES
    # ========================================
    print("\n📋 8. Migrando alertas existentes...")
    
    execute_sql(conn, """
        UPDATE alerta_analisis aa
        INNER JOIN resultado_analisis ra ON aa.id_analisis = ra.id_analisis
        SET aa.id_resultado = ra.id_resultado
        WHERE aa.id_resultado IS NULL
    """, "Migrar alertas de id_analisis a id_resultado")
    
    # ========================================
    # RESUMEN
    # ========================================
    print("\n" + "=" * 70)
    print("📊 RESUMEN DE LA MIGRACIÓN:")
    print("=" * 70)
    
    cursor = conn.cursor()
    
    # Contar plantillas
    cursor.execute("SELECT COUNT(*) FROM notificaciones_plantillas")
    count_plantillas = cursor.fetchone()[0]
    print(f"  ✅ notificaciones_plantillas: {count_plantillas} plantillas")
    
    # Contar juegos
    cursor.execute("SELECT COUNT(*) FROM juegos_terapeuticos")
    count_juegos = cursor.fetchone()[0]
    print(f"  ✅ juegos_terapeuticos: {count_juegos} juegos")
    
    # Verificar alerta_analisis
    cursor.execute("DESCRIBE alerta_analisis")
    cols_alerta = [col[0] for col in cursor.fetchall()]
    tiene_id_resultado = 'id_resultado' in cols_alerta
    print(f"  {'✅' if tiene_id_resultado else '❌'} alerta_analisis.id_resultado: {'Existe' if tiene_id_resultado else 'No existe'}")
    
    # Verificar resultado_analisis
    cursor.execute("DESCRIBE resultado_analisis")
    cols_resultado = [col[0] for col in cursor.fetchall()]
    tiene_nivel_estres = 'nivel_estres' in cols_resultado
    print(f"  {'✅' if tiene_nivel_estres else '❌'} resultado_analisis.nivel_estres: {'Existe' if tiene_nivel_estres else 'No existe'}")
    
    cursor.close()
    conn.close()
    
    print("\n✅ ¡Migración completada exitosamente!")
    print("   Ahora reinicia el servicio backend en Cloud Run")
    print("   Comando: gcloud run services update serenvoice-backend --region us-central1")

if __name__ == "__main__":
    main()
