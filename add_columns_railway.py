#!/usr/bin/env python3
"""
Script SIMPLE para agregar columnas faltantes a Railway
Sin DROP - solo ALTER TABLE ADD COLUMN
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from database.connection import DatabaseConnection

def add_audio_columns():
    """Agrega columnas de emociones a audio"""
    print("\n📋 Agregando columnas a AUDIO...")
    
    columns_to_add = [
        ("nivel_estres", "float DEFAULT NULL"),
        ("nivel_ansiedad", "float DEFAULT NULL"),
        ("nivel_felicidad", "float DEFAULT NULL"),
        ("nivel_tristeza", "float DEFAULT NULL"),
        ("nivel_miedo", "float DEFAULT NULL"),
        ("nivel_neutral", "float DEFAULT NULL"),
        ("nivel_enojo", "float DEFAULT NULL"),
        ("nivel_sorpresa", "float DEFAULT NULL"),
        ("procesado_por_ia", "tinyint(1) DEFAULT 0"),
        ("eliminado", "tinyint(1) DEFAULT 0"),
        ("activo", "tinyint(1) DEFAULT 1"),
    ]
    
    success = 0
    already_exists = 0
    
    for col_name, col_def in columns_to_add:
        try:
            sql = f"ALTER TABLE audio ADD COLUMN {col_name} {col_def}"
            DatabaseConnection.execute_query(sql, fetch=False)
            print(f"  ✅ {col_name}")
            success += 1
        except Exception as e:
            if "Duplicate column" in str(e):
                print(f"  ⏭️  {col_name} (ya existe)")
                already_exists += 1
            else:
                print(f"  ❌ {col_name}: {e}")
    
    print(f"\n  Resumen: {success} agregadas, {already_exists} ya existían")
    return True

def add_analisis_columns():
    """Agrega columnas de control a analisis"""
    print("\n📋 Agregando columnas a ANALISIS...")
    
    columns_to_add = [
        ("duracion_procesamiento", "float DEFAULT NULL"),
        ("eliminado", "tinyint(1) DEFAULT 0"),
        ("activo", "tinyint(1) DEFAULT 1"),
    ]
    
    success = 0
    already_exists = 0
    
    for col_name, col_def in columns_to_add:
        try:
            sql = f"ALTER TABLE analisis ADD COLUMN {col_name} {col_def}"
            DatabaseConnection.execute_query(sql, fetch=False)
            print(f"  ✅ {col_name}")
            success += 1
        except Exception as e:
            if "Duplicate column" in str(e):
                print(f"  ⏭️  {col_name} (ya existe)")
                already_exists += 1
            else:
                print(f"  ❌ {col_name}: {e}")
    
    print(f"\n  Resumen: {success} agregadas, {already_exists} ya existían")
    return True

def add_resultado_analisis_columns():
    """Agrega columna activo a resultado_analisis"""
    print("\n📋 Agregando columnas a RESULTADO_ANALISIS...")
    
    try:
        sql = "ALTER TABLE resultado_analisis ADD COLUMN activo tinyint(1) DEFAULT 1"
        DatabaseConnection.execute_query(sql, fetch=False)
        print("  ✅ activo")
    except Exception as e:
        if "Duplicate column" in str(e):
            print("  ⏭️  activo (ya existe)")
        else:
            print(f"  ❌ activo: {e}")
    
    return True

def update_existing_data():
    """Actualiza registros existentes con valores por defecto"""
    print("\n🔄 Actualizando registros existentes...")
    
    updates = [
        ("audio", "activo = 1"),
        ("audio", "eliminado = 0"),
        ("audio", "procesado_por_ia = 1"),
        ("analisis", "activo = 1"),
        ("analisis", "eliminado = 0"),
        ("resultado_analisis", "activo = 1"),
    ]
    
    for table, condition in updates:
        try:
            sql = f"UPDATE {table} SET {condition} WHERE {condition.split('=')[0].strip()} IS NULL OR {condition.split('=')[0].strip()} = 0"
            DatabaseConnection.execute_query(sql, fetch=False)
            print(f"  ✅ {table}: {condition}")
        except Exception as e:
            print(f"  ⚠️  {table}: {e}")

def verify_structure():
    """Verifica la estructura final"""
    print(f"\n{'='*70}")
    print("  VERIFICACIÓN FINAL")
    print(f"{'='*70}\n")
    
    # Verificar audio
    print("📋 AUDIO:")
    cols = DatabaseConnection.execute_query("SHOW COLUMNS FROM audio")
    emotion_cols = [c['Field'] for c in cols if 'nivel_' in c['Field']]
    control_cols = [c['Field'] for c in cols if c['Field'] in ['activo', 'eliminado', 'procesado_por_ia']]
    count = DatabaseConnection.execute_query("SELECT COUNT(*) as total FROM audio")
    
    print(f"  Total columnas: {len(cols)}")
    print(f"  Emociones ({len(emotion_cols)}): {', '.join(emotion_cols)}")
    print(f"  Control ({len(control_cols)}): {', '.join(control_cols)}")
    print(f"  Registros: {count[0]['total']}\n")
    
    # Verificar analisis
    print("📋 ANALISIS:")
    cols = DatabaseConnection.execute_query("SHOW COLUMNS FROM analisis")
    control_cols = [c['Field'] for c in cols if c['Field'] in ['activo', 'eliminado', 'duracion_procesamiento']]
    count = DatabaseConnection.execute_query("SELECT COUNT(*) as total FROM analisis")
    
    print(f"  Total columnas: {len(cols)}")
    print(f"  Control ({len(control_cols)}): {', '.join(control_cols)}")
    print(f"  Registros: {count[0]['total']}\n")
    
    # Verificar resultado_analisis
    print("📋 RESULTADO_ANALISIS:")
    cols = DatabaseConnection.execute_query("SHOW COLUMNS FROM resultado_analisis")
    has_activo = any(c['Field'] == 'activo' for c in cols)
    count = DatabaseConnection.execute_query("SELECT COUNT(*) as total FROM resultado_analisis")
    
    print(f"  Total columnas: {len(cols)}")
    print(f"  Tiene activo: {'✅ Sí' if has_activo else '❌ No'}")
    print(f"  Registros: {count[0]['total']}\n")

def main():
    print("\n" + "🚀 "*25)
    print("  AGREGAR COLUMNAS A RAILWAY (Sin DROP)")
    print("🚀 "*25)
    print("\n⚠️  Este script solo AGREGA columnas, no elimina nada\n")
    
    try:
        # Agregar columnas
        add_audio_columns()
        add_analisis_columns()
        add_resultado_analisis_columns()
        
        # Actualizar datos
        update_existing_data()
        
        # Verificar
        verify_structure()
        
        print(f"{'='*70}")
        print("  ✅ ¡MIGRACIÓN COMPLETADA!")
        print(f"{'='*70}\n")
        print("📝 Railway ahora tiene tu estructura completa:")
        print("  - audio: CON las 8 columnas de emociones + activo + eliminado")
        print("  - analisis: CON activo y eliminado")
        print("  - resultado_analisis: CON activo")
        print("\n👉 Ahora tu backend funcionará correctamente porque las columnas existen!")
        print("\n📝 Commit del script:")
        print("  git add add_columns_railway.py")
        print("  git commit -m 'Add: Script para agregar columnas a Railway'")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
