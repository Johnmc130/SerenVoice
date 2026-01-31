#!/usr/bin/env python3
"""
Script para recrear tablas audio y analisis con tu estructura original
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from database.connection import DatabaseConnection

def recreate_audio_table():
    """Recrea tabla audio con TODAS las columnas de emociones"""
    print("\n🔄 Recreando tabla AUDIO...")
    
    # 0. Desactivar FK checks
    DatabaseConnection.execute_query('SET FOREIGN_KEY_CHECKS=0', fetch=False)
    print("  ⚠️  Foreign keys temporalmente desactivadas")
    
    # 1. Hacer backup
    try:
        DatabaseConnection.execute_query('DROP TABLE IF EXISTS audio_backup_old', fetch=False)
        DatabaseConnection.execute_query('CREATE TABLE audio_backup_old AS SELECT * FROM audio', fetch=False)
        print("  ✅ Backup de datos actual creado")
    except Exception as e:
        print(f"  ⚠️  No se pudo hacer backup: {e}")
    
    # 2. Drop tabla actual
    try:
        DatabaseConnection.execute_query('DROP TABLE IF EXISTS audio', fetch=False)
        print("  ✅ Tabla actual eliminada")
    except Exception as e:
        print(f"  ❌ Error eliminando tabla: {e}")
        DatabaseConnection.execute_query('SET FOREIGN_KEY_CHECKS=1', fetch=False)
        return False
    
    # 3. Crear con estructura completa
    create_sql = """
    CREATE TABLE audio (
      id_audio int NOT NULL AUTO_INCREMENT,
      id_usuario int NOT NULL,
      nombre_archivo varchar(255) NOT NULL,
      ruta_archivo varchar(500) NOT NULL,
      duracion float DEFAULT NULL,
      tamano_archivo float DEFAULT NULL COMMENT 'En MB',
      fecha_grabacion datetime DEFAULT CURRENT_TIMESTAMP,
      nivel_estres float DEFAULT NULL,
      nivel_ansiedad float DEFAULT NULL,
      nivel_felicidad float DEFAULT NULL,
      nivel_tristeza float DEFAULT NULL,
      nivel_miedo float DEFAULT NULL,
      nivel_neutral float DEFAULT NULL,
      nivel_enojo float DEFAULT NULL,
      nivel_sorpresa float DEFAULT NULL,
      procesado_por_ia tinyint(1) DEFAULT 0,
      eliminado tinyint(1) DEFAULT 0,
      activo tinyint(1) DEFAULT 1,
      PRIMARY KEY (id_audio),
      KEY id_usuario (id_usuario),
      KEY idx_audio_usuario_activo (id_usuario, activo, fecha_grabacion),
      KEY idx_fecha_grabacion (fecha_grabacion),
      CONSTRAINT audio_ibfk_1 FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    try:
        DatabaseConnection.execute_query(create_sql, fetch=False)
        print("  ✅ Tabla audio recreada con 18 columnas (8 de emociones)")
    except Exception as e:
        print(f"  ❌ Error creando tabla: {e}")
        return False
    
    # 4. Restaurar datos
    try:
        DatabaseConnection.execute_query('''
            INSERT INTO audio (
                id_audio, id_usuario, nombre_archivo, ruta_archivo, 
                duracion, fecha_grabacion, activo
            )
            SELECT 
                id_audio, id_usuario, nombre_archivo, ruta_archivo,
                duracion_segundos, fecha_subida, 1
            FROM audio_backup_old
        ''', fetch=False)
        result = DatabaseConnection.execute_query('SELECT COUNT(*) as total FROM audio')
        print(f"  ✅ Datos restaurados: {result[0]['total']} registros")
    except Exception as e:
        print(f"  ⚠️  No se pudieron restaurar datos: {e}")
    
    # 5. Reactivar FK checks
    DatabaseConnection.execute_query('SET FOREIGN_KEY_CHECKS=1', fetch=False)
    print("  ✅ Foreign keys reactivadas")
    
    return True

def recreate_analisis_table():
    """Recrea tabla analisis con columnas activo, eliminado"""
    print("\n🔄 Recreando tabla ANALISIS...")
    
    # 1. Backup
    try:
        DatabaseConnection.execute_query('DROP TABLE IF EXISTS analisis_backup_old', fetch=False)
        DatabaseConnection.execute_query('CREATE TABLE analisis_backup_old AS SELECT * FROM analisis', fetch=False)
        print("  ✅ Backup creado")
    except Exception as e:
        print(f"  ⚠️  No se pudo hacer backup: {e}")
    
    # 2. Drop
    try:
        DatabaseConnection.execute_query('DROP TABLE IF EXISTS analisis', fetch=False)
        print("  ✅ Tabla eliminada")
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False
    
    # 3. Crear
    create_sql = """
    CREATE TABLE analisis (
      id_analisis int NOT NULL AUTO_INCREMENT,
      id_audio int NOT NULL,
      modelo_usado varchar(100) DEFAULT NULL,
      fecha_analisis date DEFAULT NULL,
      estado_analisis enum('procesando','completado','error') DEFAULT 'procesando',
      duracion_procesamiento float DEFAULT NULL COMMENT 'En segundos',
      eliminado tinyint(1) DEFAULT 0,
      activo tinyint(1) DEFAULT 1,
      PRIMARY KEY (id_analisis),
      KEY id_audio (id_audio),
      KEY idx_analisis_estado (estado_analisis, activo),
      KEY idx_fecha_analisis (fecha_analisis),
      CONSTRAINT analisis_ibfk_1 FOREIGN KEY (id_audio) REFERENCES audio (id_audio) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    try:
        DatabaseConnection.execute_query(create_sql, fetch=False)
        print("  ✅ Tabla analisis recreada con columnas activo y eliminado")
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False
    
    # 4. Restaurar datos
    try:
        DatabaseConnection.execute_query('''
            INSERT INTO analisis (
                id_analisis, id_audio, modelo_usado, fecha_analisis, 
                estado_analisis, activo
            )
            SELECT 
                id_analisis, id_audio, modelo_usado, fecha_analisis,
                estado_analisis, 1
            FROM analisis_backup_old
        ''', fetch=False)
        result = DatabaseConnection.execute_query('SELECT COUNT(*) as total FROM analisis')
        print(f"  ✅ Datos restaurados: {result[0]['total']} registros")
    except Exception as e:
        print(f"  ⚠️  No se pudieron restaurar datos: {e}")
    
    return True

def recreate_resultado_analisis_table():
    """Recrea tabla resultado_analisis con columna activo"""
    print("\n🔄 Recreando tabla RESULTADO_ANALISIS...")
    
    # 1. Backup
    try:
        DatabaseConnection.execute_query('DROP TABLE IF EXISTS resultado_backup_old', fetch=False)
        DatabaseConnection.execute_query('CREATE TABLE resultado_backup_old AS SELECT * FROM resultado_analisis', fetch=False)
        print("  ✅ Backup creado")
    except Exception as e:
        print(f"  ⚠️  No se pudo hacer backup: {e}")
    
    # 2. Drop
    try:
        DatabaseConnection.execute_query('DROP TABLE IF EXISTS resultado_analisis', fetch=False)
        print("  ✅ Tabla eliminada")
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False
    
    # 3. Crear
    create_sql = """
    CREATE TABLE resultado_analisis (
      id_resultado int NOT NULL AUTO_INCREMENT,
      id_analisis int NOT NULL,
      emociones_json text,
      metricas_adicionales text,
      fecha_generacion datetime DEFAULT CURRENT_TIMESTAMP,
      nivel_estres float DEFAULT NULL,
      nivel_ansiedad float DEFAULT NULL,
      clasificacion varchar(50) DEFAULT NULL,
      confianza_modelo float DEFAULT NULL,
      nivel_felicidad float DEFAULT NULL,
      nivel_tristeza float DEFAULT NULL,
      nivel_miedo float DEFAULT NULL,
      nivel_neutral float DEFAULT NULL,
      nivel_enojo float DEFAULT NULL,
      nivel_sorpresa float DEFAULT NULL,
      emocion_dominante varchar(50) DEFAULT NULL,
      confianza float DEFAULT NULL,
      activo tinyint(1) DEFAULT 1,
      PRIMARY KEY (id_resultado),
      KEY id_analisis (id_analisis),
      CONSTRAINT resultado_analisis_ibfk_1 FOREIGN KEY (id_analisis) REFERENCES analisis (id_analisis) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    try:
        DatabaseConnection.execute_query(create_sql, fetch=False)
        print("  ✅ Tabla resultado_analisis recreada con columna activo")
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False
    
    # 4. Restaurar datos
    try:
        DatabaseConnection.execute_query('''
            INSERT INTO resultado_analisis (
                id_resultado, id_analisis, emociones_json, metricas_adicionales,
                fecha_generacion, nivel_estres, nivel_ansiedad, clasificacion,
                confianza_modelo, nivel_felicidad, nivel_tristeza, nivel_miedo,
                nivel_neutral, nivel_enojo, nivel_sorpresa, emocion_dominante,
                confianza, activo
            )
            SELECT 
                id_resultado, id_analisis, emociones_json, metricas_adicionales,
                fecha_generacion, nivel_estres, nivel_ansiedad, clasificacion,
                confianza_modelo, nivel_felicidad, nivel_tristeza, nivel_miedo,
                nivel_neutral, nivel_enojo, nivel_sorpresa, emocion_dominante,
                confianza, 1
            FROM resultado_backup_old
        ''', fetch=False)
        result = DatabaseConnection.execute_query('SELECT COUNT(*) as total FROM resultado_analisis')
        print(f"  ✅ Datos restaurados: {result[0]['total']} registros")
    except Exception as e:
        print(f"  ⚠️  No se pudieron restaurar datos: {e}")
    
    return True

def verify_structure():
    """Verifica la estructura final"""
    print(f"\n{'='*70}")
    print("  VERIFICACIÓN FINAL")
    print(f"{'='*70}\n")
    
    tables = ['audio', 'analisis', 'resultado_analisis']
    
    for table in tables:
        try:
            columns = DatabaseConnection.execute_query(f"SHOW COLUMNS FROM {table}")
            count = DatabaseConnection.execute_query(f"SELECT COUNT(*) as total FROM {table}")
            
            print(f"📋 {table}:")
            print(f"  Columnas: {len(columns)}")
            print(f"  Registros: {count[0]['total']}")
            
            # Mostrar columnas específicas
            if table == 'audio':
                emotion_cols = [c['Field'] for c in columns if 'nivel_' in c['Field']]
                print(f"  Emociones: {', '.join(emotion_cols)}")
            
            if table in ['analisis', 'resultado_analisis']:
                control_cols = [c['Field'] for c in columns if c['Field'] in ['activo', 'eliminado']]
                print(f"  Control: {', '.join(control_cols)}")
            
            print()
        except Exception as e:
            print(f"❌ Error en {table}: {e}\n")

def main():
    print("\n" + "🚀 "*25)
    print("  RECREAR TABLAS CON TU ESTRUCTURA ORIGINAL")
    print("🚀 "*25)
    
    try:
        # IMPORTANTE: Orden para evitar problemas de FK
        # Primero resultado_analisis, luego analisis, luego audio
        
        if not recreate_resultado_analisis_table():
            print("\n❌ Error recreando resultado_analisis")
            return 1
        
        if not recreate_analisis_table():
            print("\n❌ Error recreando analisis")
            return 1
        
        if not recreate_audio_table():
            print("\n❌ Error recreando audio")
            return 1
        
        # Verificar
        verify_structure()
        
        print(f"{'='*70}")
        print("  ✅ ¡MIGRACIÓN COMPLETADA!")
        print(f"{'='*70}\n")
        print("📝 Ahora la base de Railway tiene TU estructura original:")
        print("  - audio: 18 columnas (incluye 8 emociones + activo + eliminado)")
        print("  - analisis: incluye activo, eliminado")
        print("  - resultado_analisis: incluye activo")
        print("\n👉 Próximos pasos:")
        print("  1. El código Python ya está adaptado para usar estas columnas")
        print("  2. Haz commit de estos scripts:")
        print("     git add import_to_railway.py recreate_tables.py")
        print("     git commit -m 'Add: Scripts de migración Railway'")
        print("  3. Redeploy a Cloud Run si quieres")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
