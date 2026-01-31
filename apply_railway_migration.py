#!/usr/bin/env python3
"""
Script para aplicar la migración completa a Railway
Ejecuta el SQL y verifica los resultados
"""

import sys
import os

# Agregar backend al path para importar DatabaseConnection
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from database.connection import DatabaseConnection

def print_separator(title=""):
    """Imprime un separador visual"""
    print("\n" + "="*70)
    if title:
        print(f"  {title}")
        print("="*70)

def execute_migration():
    """Ejecuta el archivo de migración SQL"""
    print_separator("INICIANDO MIGRACIÓN DE RAILWAY")
    
    # Leer el archivo SQL
    migration_file = os.path.join(os.path.dirname(__file__), 
                                  'migrations', 
                                  'fix_railway_schema_complete.sql')
    
    try:
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print(f"\n✅ Archivo de migración cargado: {migration_file}")
        print(f"📊 Tamaño: {len(sql_content)} caracteres")
        
    except FileNotFoundError:
        print(f"❌ ERROR: No se encontró el archivo {migration_file}")
        return False
    
    # Separar las sentencias SQL (por líneas que no son comentarios)
    statements = []
    current_statement = []
    
    for line in sql_content.split('\n'):
        line = line.strip()
        # Ignorar líneas vacías y comentarios
        if not line or line.startswith('--'):
            continue
        
        current_statement.append(line)
        
        # Si termina en ;, es el fin de una sentencia
        if line.endswith(';'):
            full_statement = ' '.join(current_statement)
            statements.append(full_statement)
            current_statement = []
    
    print(f"📝 Se encontraron {len(statements)} sentencias SQL para ejecutar")
    
    # Ejecutar cada sentencia
    print_separator("EJECUTANDO SENTENCIAS SQL")
    
    success_count = 0
    error_count = 0
    
    for i, statement in enumerate(statements, 1):
        # Mostrar preview de la sentencia
        preview = statement[:100] + "..." if len(statement) > 100 else statement
        print(f"\n[{i}/{len(statements)}] Ejecutando: {preview}")
        
        try:
            # Ejecutar la sentencia
            DatabaseConnection.execute_query(statement, fetch=False)
            print("✅ Éxito")
            success_count += 1
            
        except Exception as e:
            error_str = str(e)
            # Algunos errores son esperados (ej: columna ya existe)
            if "Duplicate column name" in error_str or "already exists" in error_str:
                print(f"⚠️  Ya existe (ok): {error_str}")
                success_count += 1
            else:
                print(f"❌ ERROR: {error_str}")
                error_count += 1
    
    print_separator("RESUMEN DE EJECUCIÓN")
    print(f"✅ Exitosas: {success_count}")
    print(f"❌ Errores: {error_count}")
    
    return error_count == 0

def verify_migration():
    """Verifica que las columnas se hayan agregado correctamente"""
    print_separator("VERIFICACIÓN DE MIGRACIÓN")
    
    tables_to_check = {
        'audio': [
            'nivel_estres', 'nivel_ansiedad', 'nivel_felicidad', 
            'nivel_tristeza', 'nivel_miedo', 'nivel_neutral', 
            'nivel_enojo', 'nivel_sorpresa', 'procesado_por_ia',
            'eliminado', 'activo'
        ],
        'analisis': [
            'duracion_procesamiento', 'eliminado', 'activo'
        ],
        'resultado_analisis': [
            'fecha_resultado', 'activo'
        ]
    }
    
    all_good = True
    
    for table, expected_columns in tables_to_check.items():
        print(f"\n📋 Verificando tabla: {table}")
        
        try:
            # Obtener columnas actuales
            result = DatabaseConnection.execute_query(
                f"SHOW COLUMNS FROM {table}"
            )
            
            current_columns = [col['Field'] for col in result]
            
            # Verificar cada columna esperada
            missing = []
            present = []
            
            for col in expected_columns:
                if col in current_columns:
                    present.append(col)
                else:
                    missing.append(col)
                    all_good = False
            
            # Mostrar resultados
            if present:
                print(f"  ✅ Columnas presentes ({len(present)}):")
                for col in present:
                    print(f"     • {col}")
            
            if missing:
                print(f"  ❌ Columnas FALTANTES ({len(missing)}):")
                for col in missing:
                    print(f"     • {col}")
            
            # Mostrar conteo de registros
            count_result = DatabaseConnection.execute_query(
                f"SELECT COUNT(*) as total FROM {table}"
            )
            total = count_result[0]['total']
            print(f"  📊 Total de registros: {total}")
            
        except Exception as e:
            print(f"  ❌ ERROR al verificar tabla {table}: {e}")
            all_good = False
    
    return all_good

def show_sample_data():
    """Muestra datos de ejemplo para verificar funcionamiento"""
    print_separator("DATOS DE EJEMPLO")
    
    try:
        # Últimos 3 audios
        print("\n🎵 Últimos 3 audios:")
        audios = DatabaseConnection.execute_query("""
            SELECT id_audio, id_usuario, duracion_segundos, 
                   nivel_estres, nivel_ansiedad, procesado, activo
            FROM audio 
            ORDER BY fecha_grabacion DESC 
            LIMIT 3
        """)
        
        if audios:
            for audio in audios:
                print(f"  ID: {audio['id_audio']} | "
                      f"Usuario: {audio['id_usuario']} | "
                      f"Duración: {audio['duracion_segundos']}s | "
                      f"Estrés: {audio['nivel_estres']} | "
                      f"Ansiedad: {audio['nivel_ansiedad']} | "
                      f"Procesado: {audio['procesado']} | "
                      f"Activo: {audio['activo']}")
        else:
            print("  (No hay audios)")
        
        # Últimos 3 análisis
        print("\n🔬 Últimos 3 análisis:")
        analisis = DatabaseConnection.execute_query("""
            SELECT id_analisis, id_usuario, emocion_detectada,
                   nivel_estres, nivel_ansiedad, activo
            FROM analisis 
            ORDER BY fecha_analisis DESC 
            LIMIT 3
        """)
        
        if analisis:
            for an in analisis:
                print(f"  ID: {an['id_analisis']} | "
                      f"Usuario: {an['id_usuario']} | "
                      f"Emoción: {an['emocion_detectada']} | "
                      f"Estrés: {an['nivel_estres']} | "
                      f"Ansiedad: {an['nivel_ansiedad']} | "
                      f"Activo: {an['activo']}")
        else:
            print("  (No hay análisis)")
            
    except Exception as e:
        print(f"❌ ERROR al obtener datos de ejemplo: {e}")

def main():
    """Función principal"""
    print("\n" + "🚀 "*25)
    print("  SCRIPT DE MIGRACIÓN RAILWAY - SERENVOICE")
    print("🚀 "*25)
    
    try:
        # 1. Ejecutar migración
        success = execute_migration()
        
        if not success:
            print("\n⚠️  La migración tuvo algunos errores, pero continuamos con verificación...")
        
        # 2. Verificar migración
        verification_ok = verify_migration()
        
        # 3. Mostrar datos de ejemplo
        show_sample_data()
        
        # Resumen final
        print_separator("RESULTADO FINAL")
        
        if verification_ok:
            print("\n✅ ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!")
            print("\n📝 Próximos pasos:")
            print("  1. Verifica que el backend siga funcionando correctamente")
            print("  2. Haz commit de este script de migración:")
            print("     git add migrations/fix_railway_schema_complete.sql apply_railway_migration.py")
            print("     git commit -m 'Add: Script de migración completa para Railway'")
            print("  3. Opcional: Actualiza el código Python para usar las nuevas columnas")
        else:
            print("\n⚠️  La migración tuvo problemas. Revisa los errores arriba.")
            
    except Exception as e:
        print(f"\n❌ ERROR FATAL: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
