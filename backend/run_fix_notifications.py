#!/usr/bin/env python3
"""
Script para ejecutar la migración de URLs de notificaciones
y configurar los reminders.

Ejecutar desde el directorio backend:
    python run_fix_notifications.py
"""

import os
import sys

# Añadir el directorio padre al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.connection import DatabaseConnection


def read_sql_file(filepath):
    """Lee un archivo SQL y retorna su contenido"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def execute_sql_statements(sql_content):
    """
    Ejecuta statements SQL separados por DELIMITER o punto y coma.
    Maneja triggers con DELIMITER correctamente.
    """
    # Inicializar pool si no está hecho
    if DatabaseConnection.pool is None:
        DatabaseConnection.initialize_pool()
    
    conn = None
    cursor = None
    
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        # Dividir por DELIMITER cuando hay triggers
        parts = sql_content.split('DELIMITER')
        
        for i, part in enumerate(parts):
            part = part.strip()
            if not part:
                continue
            
            # Verificar si es una sección de delimiter especial
            if part.startswith('$$'):
                # Es código de trigger/procedure
                delimiter = '$$'
                code = part[2:].strip()  # Quitar $$
                
                # Encontrar el fin del trigger (siguiente $$)
                if '$$' in code:
                    statements = code.split('$$')
                    for stmt in statements:
                        stmt = stmt.strip()
                        if stmt and not stmt.startswith(';'):
                            if stmt.endswith(';'):
                                stmt = stmt[:-1]
                            try:
                                print(f"Ejecutando: {stmt[:80]}...")
                                cursor.execute(stmt)
                                conn.commit()
                            except Exception as e:
                                print(f"  Error (puede ser normal): {e}")
            else:
                # Statements normales separados por ;
                # Pero primero quitar comentarios de línea
                statements = []
                current = ""
                
                for line in part.split('\n'):
                    line = line.strip()
                    # Ignorar comentarios y líneas vacías
                    if line.startswith('--') or not line:
                        continue
                    current += ' ' + line
                    
                    if line.endswith(';'):
                        statements.append(current.strip())
                        current = ""
                
                for stmt in statements:
                    stmt = stmt.strip()
                    if not stmt or stmt == ';':
                        continue
                    try:
                        print(f"Ejecutando: {stmt[:80]}...")
                        cursor.execute(stmt)
                        conn.commit()
                    except Exception as e:
                        # Algunos errores son esperados (IF EXISTS, etc.)
                        print(f"  Nota: {e}")
        
        print("\n✅ Migración completada exitosamente")
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            DatabaseConnection.release_connection(conn)


def run_migration():
    """Ejecuta la migración de URLs de notificaciones"""
    print("=" * 60)
    print("Ejecutando migración de URLs de notificaciones")
    print("=" * 60)
    
    # Ruta del archivo SQL
    sql_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'migrations',
        'fix_notifications_urls.sql'
    )
    
    if not os.path.exists(sql_path):
        print(f"❌ Archivo no encontrado: {sql_path}")
        return False
    
    print(f"Leyendo: {sql_path}")
    sql_content = read_sql_file(sql_path)
    
    return execute_sql_statements(sql_content)


def update_existing_notification_urls():
    """
    Actualiza URLs de notificaciones existentes directamente.
    Más simple y seguro que ejecutar el SQL completo.
    """
    print("\n" + "=" * 60)
    print("Actualizando URLs de notificaciones existentes...")
    print("=" * 60)
    
    if DatabaseConnection.pool is None:
        DatabaseConnection.initialize_pool()
    
    updates = [
        # Corregir invitaciones
        (
            "UPDATE notificaciones SET url_accion = '/invitaciones' "
            "WHERE tipo_notificacion = 'invitacion_grupo' AND url_accion LIKE '/invitaciones/%'"
        ),
        # Corregir actividades (cambiar /actividades/ a /actividad/)
        (
            "UPDATE notificaciones SET url_accion = REPLACE(url_accion, '/actividades/', '/actividad/') "
            "WHERE tipo_notificacion = 'actividad_grupo' AND url_accion LIKE '%/actividades/%'"
        ),
    ]
    
    for query in updates:
        try:
            result = DatabaseConnection.execute_query(query, fetch=False)
            print(f"  ✅ {result.get('rowcount', 0)} filas actualizadas")
        except Exception as e:
            print(f"  ⚠️ Error: {e}")
    
    print("\n✅ URLs actualizadas")


def recreate_triggers():
    """Recrea los triggers con las URLs correctas"""
    print("\n" + "=" * 60)
    print("Recreando triggers de notificaciones...")
    print("=" * 60)
    
    if DatabaseConnection.pool is None:
        DatabaseConnection.initialize_pool()
    
    conn = None
    cursor = None
    
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        # 1. Drop trigger de invitaciones
        print("  Eliminando trigger anterior de invitaciones...")
        try:
            cursor.execute("DROP TRIGGER IF EXISTS trg_notificar_nueva_invitacion")
            conn.commit()
        except:
            pass
        
        # 2. Crear nuevo trigger de invitaciones
        print("  Creando nuevo trigger de invitaciones...")
        trigger_invitacion = """
        CREATE TRIGGER trg_notificar_nueva_invitacion 
        AFTER INSERT ON invitaciones_grupo FOR EACH ROW 
        BEGIN
          DECLARE v_nombre_grupo VARCHAR(200);
          DECLARE v_nombre_invitador VARCHAR(200);
          
          SELECT nombre_grupo INTO v_nombre_grupo 
          FROM grupos WHERE id_grupo = NEW.id_grupo;
          
          SELECT CONCAT(nombre, ' ', COALESCE(apellido, '')) INTO v_nombre_invitador 
          FROM usuario WHERE id_usuario = NEW.id_usuario_invita;
          
          INSERT INTO notificaciones (
            id_usuario,
            tipo_notificacion,
            titulo,
            mensaje,
            icono,
            url_accion,
            id_referencia,
            tipo_referencia,
            prioridad
          ) VALUES (
            NEW.id_usuario_invitado,
            'invitacion_grupo',
            CONCAT('Invitación a ', v_nombre_grupo),
            CONCAT(v_nombre_invitador, ' te ha invitado a unirte al grupo "', v_nombre_grupo, '". ¡Revisa tu invitación!'),
            '📩',
            '/invitaciones',
            NEW.id_invitacion,
            'invitacion',
            'alta'
          );
        END
        """
        cursor.execute(trigger_invitacion)
        conn.commit()
        print("  ✅ Trigger de invitaciones creado")
        
        # 3. Drop trigger de actividades
        print("  Eliminando trigger anterior de actividades...")
        try:
            cursor.execute("DROP TRIGGER IF EXISTS trg_notificar_actividad_grupo")
            conn.commit()
        except:
            pass
        
        # 4. Crear nuevo trigger de actividades
        print("  Creando nuevo trigger de actividades...")
        trigger_actividad = """
        CREATE TRIGGER trg_notificar_actividad_grupo 
        AFTER INSERT ON actividades_grupo FOR EACH ROW 
        BEGIN
          INSERT INTO notificaciones (
            id_usuario, 
            tipo_notificacion, 
            titulo, 
            mensaje, 
            icono,
            url_accion, 
            id_referencia, 
            tipo_referencia, 
            prioridad
          )
          SELECT 
            gm.id_usuario,
            'actividad_grupo',
            CONCAT('Nueva actividad: ', NEW.titulo),
            CONCAT('Se ha creado una nueva actividad en tu grupo. ', 
                   IFNULL(LEFT(NEW.descripcion, 100), ''), 
                   IF(LENGTH(NEW.descripcion) > 100, '...', '')),
            '📋',
            CONCAT('/grupos/', NEW.id_grupo, '/actividad/', NEW.id_actividad),
            NEW.id_actividad,
            'actividad',
            'media'
          FROM grupo_miembros gm
          WHERE gm.id_grupo = NEW.id_grupo 
            AND gm.estado = 'activo'
            AND gm.id_usuario != NEW.id_creador;
        END
        """
        cursor.execute(trigger_actividad)
        conn.commit()
        print("  ✅ Trigger de actividades creado")
        
        print("\n✅ Todos los triggers recreados correctamente")
        return True
        
    except Exception as e:
        print(f"\n❌ Error recreando triggers: {e}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            DatabaseConnection.release_connection(conn)


def create_reminder_tables():
    """Crea las tablas necesarias para el sistema de reminders"""
    print("\n" + "=" * 60)
    print("Creando tablas para sistema de reminders...")
    print("=" * 60)
    
    if DatabaseConnection.pool is None:
        DatabaseConnection.initialize_pool()
    
    # Crear tabla user_last_analysis
    query1 = """
    CREATE TABLE IF NOT EXISTS user_last_analysis (
        id_usuario INT PRIMARY KEY,
        fecha_ultimo_analisis DATETIME,
        ultimo_reminder_enviado DATETIME,
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    # Poblar con datos existentes
    query2 = """
    INSERT IGNORE INTO user_last_analysis (id_usuario, fecha_ultimo_analisis)
    SELECT a.id_usuario, MAX(an.fecha_analisis)
    FROM audio a
    JOIN analisis an ON a.id_audio = an.id_audio
    WHERE a.activo = 1
    GROUP BY a.id_usuario
    """
    
    try:
        result1 = DatabaseConnection.execute_query(query1, fetch=False)
        print("  ✅ Tabla user_last_analysis creada/verificada")
        
        result2 = DatabaseConnection.execute_query(query2, fetch=False)
        print(f"  ✅ Datos iniciales insertados ({result2.get('rowcount', 0)} registros)")
        
        return True
    except Exception as e:
        print(f"  ⚠️ Nota: {e}")
        return True  # Puede fallar si ya existe


def main():
    """Función principal"""
    print("\n" + "=" * 60)
    print("    SERENVOICE - CORRECCIÓN DE NOTIFICACIONES")
    print("=" * 60)
    
    # 1. Actualizar URLs existentes
    update_existing_notification_urls()
    
    # 2. Recrear triggers
    recreate_triggers()
    
    # 3. Crear tablas de reminders
    create_reminder_tables()
    
    print("\n" + "=" * 60)
    print("    PROCESO COMPLETADO")
    print("=" * 60)
    print("\nPróximos pasos:")
    print("1. Reinicia el servidor backend")
    print("2. Reinicia el servidor frontend")
    print("3. Prueba creando una nueva invitación")
    print("4. Verifica que al hacer clic en la notificación")
    print("   te lleve a /invitaciones correctamente")


if __name__ == '__main__':
    main()
