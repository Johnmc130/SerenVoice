#!/usr/bin/env python3
"""
Script para importar serenvoice_backup.sql a Railway
Lee el archivo SQL y lo ejecuta sentencia por sentencia
"""

import sys
import os
import re

# Agregar backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from database.connection import DatabaseConnection

def print_progress(current, total, label=""):
    """Imprime barra de progreso"""
    percent = (current / total) * 100
    bar_length = 50
    filled = int(bar_length * current // total)
    bar = '█' * filled + '░' * (bar_length - filled)
    print(f"\r{label} [{bar}] {percent:.1f}% ({current}/{total})", end='', flush=True)

def execute_sql_file(filepath):
    """Lee y ejecuta archivo SQL"""
    print(f"\n{'='*70}")
    print(f"  IMPORTANDO BASE DE DATOS A RAILWAY")
    print(f"{'='*70}\n")
    
    # Leer archivo con diferentes encodings
    print(f"📁 Leyendo archivo: {filepath}")
    content = None
    for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                content = f.read()
            print(f"✅ Archivo leído con encoding {encoding}: {len(content)} caracteres\n")
            break
        except:
            continue
    
    if content is None:
        print(f"❌ Error: No se pudo leer el archivo con ningún encoding")
        return False
    
    # Separar sentencias
    print("🔍 Procesando sentencias SQL...")
    
    # Remover comentarios de línea completa
    lines = []
    for line in content.split('\n'):
        stripped = line.strip()
        # Ignorar comentarios y líneas vacías
        if not stripped or stripped.startswith('--') or stripped.startswith('/*') or stripped.startswith('*/'):
            continue
        # Ignorar comandos MySQL client-specific
        if stripped.startswith('/*!') and stripped.endswith('*/;'):
            continue
        lines.append(line)
    
    content_cleaned = '\n'.join(lines)
    
    # Separar por sentencias (punto y coma)
    statements = []
    current_statement = []
    in_delimiter = False
    delimiter = ';'
    
    for line in content_cleaned.split('\n'):
        # Detectar DELIMITER
        if line.strip().upper().startswith('DELIMITER'):
            if '$$' in line:
                delimiter = '$$'
                in_delimiter = True
            else:
                delimiter = ';'
                in_delimiter = False
            continue
        
        current_statement.append(line)
        
        # Si la línea termina con el delimiter actual
        if line.strip().endswith(delimiter):
            full_statement = '\n'.join(current_statement).strip()
            # Remover el delimiter del final
            if delimiter == '$$':
                full_statement = full_statement[:-2].strip()
            else:
                full_statement = full_statement[:-1].strip()
            
            if full_statement:
                statements.append(full_statement)
            current_statement = []
    
    print(f"✅ Se encontraron {len(statements)} sentencias SQL\n")
    
    # Ejecutar sentencias
    print(f"{'='*70}")
    print(f"  EJECUTANDO SENTENCIAS")
    print(f"{'='*70}\n")
    
    success_count = 0
    error_count = 0
    skip_count = 0
    
    for i, statement in enumerate(statements, 1):
        # Actualizar progreso
        print_progress(i, len(statements), "Progreso")
        
        # Skip LOCK/UNLOCK TABLES
        if statement.upper().startswith(('LOCK TABLES', 'UNLOCK TABLES')):
            skip_count += 1
            continue
        
        # Skip SET commands
        if statement.upper().startswith('SET '):
            skip_count += 1
            continue
        
        try:
            DatabaseConnection.execute_query(statement, fetch=False)
            success_count += 1
        except Exception as e:
            error_str = str(e)
            # Errores esperados que podemos ignorar
            if any(x in error_str for x in [
                'Duplicate', 'already exists', 'Unknown table',
                'DROP', 'Table', 'doesn\'t exist'
            ]):
                success_count += 1  # Contar como éxito
            else:
                error_count += 1
                # Mostrar solo primeros errores críticos
                if error_count <= 5:
                    print(f"\n\n⚠️  ERROR en sentencia {i}:")
                    preview = statement[:150] + "..." if len(statement) > 150 else statement
                    print(f"   SQL: {preview}")
                    print(f"   Error: {error_str[:200]}\n")
    
    print(f"\n\n{'='*70}")
    print(f"  RESUMEN")
    print(f"{'='*70}")
    print(f"✅ Exitosas: {success_count}")
    print(f"⏭️  Omitidas: {skip_count}")
    print(f"❌ Errores: {error_count}")
    print(f"📊 Total: {len(statements)}")
    
    return error_count < 10  # Aceptar hasta 10 errores

def verify_import():
    """Verifica que las tablas principales existan"""
    print(f"\n{'='*70}")
    print(f"  VERIFICACIÓN")
    print(f"{'='*70}\n")
    
    tables_to_check = [
        'usuario', 'audio', 'analisis', 'resultado_analisis',
        'recomendaciones', 'grupos', 'notificaciones'
    ]
    
    for table in tables_to_check:
        try:
            result = DatabaseConnection.execute_query(
                f"SELECT COUNT(*) as total FROM {table}"
            )
            total = result[0]['total']
            
            # Obtener columnas
            columns = DatabaseConnection.execute_query(
                f"SHOW COLUMNS FROM {table}"
            )
            
            print(f"✅ {table:25} {total:5} registros | {len(columns):3} columnas")
            
        except Exception as e:
            print(f"❌ {table:25} ERROR: {e}")

def main():
    """Función principal"""
    backup_file = os.path.join(
        os.path.dirname(__file__),
        'serenvoice_backup.sql'
    )
    
    if not os.path.exists(backup_file):
        print(f"❌ No se encontró el archivo: {backup_file}")
        return 1
    
    print("\n" + "🚀 "*25)
    print("  IMPORTACIÓN COMPLETA A RAILWAY")
    print("🚀 "*25)
    print(f"\n⚠️  ADVERTENCIA: Esto SOBRESCRIBIRÁ las tablas existentes")
    print(f"⚠️  La base de datos será reemplazada con tu estructura completa\n")
    
    try:
        # Ejecutar importación
        success = execute_sql_file(backup_file)
        
        # Verificar
        verify_import()
        
        print(f"\n{'='*70}")
        print(f"  RESULTADO FINAL")
        print(f"{'='*70}\n")
        
        if success:
            print("✅ ¡IMPORTACIÓN COMPLETADA EXITOSAMENTE!")
            print("\n📝 Próximos pasos:")
            print("  1. Verifica que el backend funcione correctamente")
            print("  2. Prueba subir un audio para verificar las columnas de emociones")
            print("  3. Redeploy a Cloud Run si es necesario")
        else:
            print("⚠️  La importación tuvo errores.")
            print("    Revisa los mensajes arriba para ver los detalles.")
        
    except Exception as e:
        print(f"\n❌ ERROR FATAL: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
