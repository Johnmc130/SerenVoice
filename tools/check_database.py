#!/usr/bin/env python3
"""
Script para verificar qué tablas faltan en la base de datos de la nube
Compara la estructura local vs la nube
"""

import sys
import os
from pathlib import Path
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

# Cargar variables de entorno
root_dir = Path(__file__).parent.parent
load_dotenv(root_dir / '.env')

# Tablas que DEBEN existir en SerenVoice
REQUIRED_TABLES = [
    'usuario',
    'rol',
    'rol_usuario',
    'audio',
    'analisis',
    'resultado_analisis',
    'recomendaciones',
    'alerta_analisis',
    'historial_alerta',
    'refresh_token',
    'sesion',
    'reporte',
    'reporte_resultado',
    'grupos',
    'grupo_miembros',
    'invitaciones_grupo',
    'actividades_grupo',
    'participacion_actividad',
    'analisis_voz_actividad',
    'analisis_voz_participante',
    'analisis_participante_actividad',
    'participacion_sesion_grupal',
    'notificaciones',
    'plantillas_notificacion',
    'preferencias_notificacion',
    'juegos_terapeuticos',
    'auditoria_seguridad',
]


def check_database():
    """Verifica el estado de la base de datos"""
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME', 'serenvoice'),
        'port': int(os.getenv('DB_PORT', 3306)),
    }
    
    print("="*70)
    print("🔍 VERIFICADOR DE BASE DE DATOS SERENVOICE")
    print("="*70)
    
    # Detectar plataforma
    platform = "☁️  Railway" if "railway.app" in config['host'] else "☁️  GCP Cloud SQL" if config['host'] != 'localhost' else "💻 Local"
    print(f"\n🌐 Plataforma: {platform}")
    print(f"📡 Conectando a: {config['host']}:{config['port']}")
    print(f"📊 Base de datos: {config['database']}")
    print(f"👤 Usuario: {config['user']}")
    
    try:
        connection = mysql.connector.connect(**config)
        
        if not connection.is_connected():
            print("❌ No se pudo establecer conexión")
            return False
            
        print("✅ Conexión establecida\n")
        
        cursor = connection.cursor()
        
        # Obtener tablas existentes
        cursor.execute("SHOW TABLES;")
        existing_tables = [table[0] for table in cursor.fetchall()]
        
        print(f"📋 Tablas encontradas: {len(existing_tables)}")
        print(f"📋 Tablas requeridas: {len(REQUIRED_TABLES)}\n")
        
        # Verificar tablas faltantes
        missing_tables = [t for t in REQUIRED_TABLES if t not in existing_tables]
        extra_tables = [t for t in existing_tables if t not in REQUIRED_TABLES]
        
        if missing_tables:
            print("❌ TABLAS FALTANTES:")
            print("="*70)
            for i, table in enumerate(missing_tables, 1):
                print(f"   {i}. {table}")
            print()
            
            print(f"📊 Resumen: {len(existing_tables)} existentes, {len(missing_tables)} faltantes")
            print()
            
            print("💡 SOLUCIÓN:")
            print("   Ejecuta el script de importación:")
            print("   python tools\\import_database_to_cloud.py")
            print("   O usa la interfaz visual:")
            print("   .\\database-manager.bat")
            print()
            return False
        else:
            print("✅ Todas las tablas requeridas existen")
            if extra_tables:
                print(f"📋 Nota: {len(extra_tables)} tabla(s) adicional(es) detectada(s)")
            print()
            
        # Mostrar resumen de cada tabla
        print("📊 RESUMEN DE TABLAS:")
        print("="*70)
        print(f"{'Tabla':<40} {'Registros':>15} {'Estado':>10}")
        print("-"*70)
        
        all_good = True
        for table in sorted(existing_tables):
            try:
                cursor.execute(f"SELECT COUNT(*) FROM `{table}`;")
                count = cursor.fetchone()[0]
                status = "✅" if count > 0 else "⚠️ "
                print(f"{table:<40} {count:>15,} {status:>10}")
                
                # Verificar tabla usuario específicamente
                if table == 'usuario' and count == 0:
                    print("   ⚠️  Advertencia: No hay usuarios registrados")
                    all_good = False
                    
            except Error as e:
                print(f"{table:<40} {'ERROR':>15} {'❌':>10}")
                print(f"   Error: {e}")
                all_good = False
                
        cursor.close()
        connection.close()
        
        print()
        print("="*70)
        if all_good and not missing_tables:
            print("✅ BASE DE DATOS COMPLETAMENTE FUNCIONAL")
            print("="*70)
            print("\n💡 Próximos pasos:")
            print("   1. Inicia el backend: cd backend && python app.py")
            print("   2. Inicia el frontend: cd proyectofinal-frontend && npm run dev")
            print("   3. Accede a http://localhost:5173")
            return True
        else:
            print("⚠️  HAY PROBLEMAS EN LA BASE DE DATOS")
            print("="*70)
            print("\n💡 Recomendaciones:")
            if missing_tables:
                print("   • Ejecuta: python tools\\import_database_to_cloud.py")
            if not all_good:
                print("   • Revisa los errores mostrados arriba")
                print("   • Verifica permisos del usuario de BD")
            return False
        
    except Error as e:
        print(f"\n❌ ERROR DE CONEXIÓN: {e}\n")
        print("💡 Posibles causas:")
        print("   1. Credenciales incorrectas en .env")
        print("   2. IP no autorizada en Cloud SQL")
        print("   3. Base de datos no existe")
        print("   4. Cloud SQL está pausado o inactivo")
        print("\n📝 Verifica tu archivo .env:")
        print(f"   DB_HOST={config['host']}")
        print(f"   DB_PORT={config['port']}")
        print(f"   DB_USER={config['user']}")
        print(f"   DB_NAME={config['database']}")
        print(f"   DB_PASSWORD=*** (configurada: {'✅' if config.get('password') else '❌'})")
        return False
        
    except Exception as e:
        print(f"\n❌ ERROR INESPERADO: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = check_database()
    sys.exit(0 if success else 1)
