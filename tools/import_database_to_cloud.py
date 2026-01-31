#!/usr/bin/env python3
"""
Script para importar la base de datos completa a la nube (GCP Cloud SQL)
Ejecuta todas las migraciones y el backup completo
"""

import sys
import os
from pathlib import Path
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import time

# Agregar el directorio backend al path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

# Cargar variables de entorno
root_dir = Path(__file__).parent.parent
load_dotenv(root_dir / '.env')


class DatabaseImporter:
    def __init__(self):
        """Inicializa el importador con configuración de la nube"""
        self.config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD'),
            'database': os.getenv('DB_NAME', 'serenvoice'),
            'port': int(os.getenv('DB_PORT', 3306)),
            'charset': 'utf8mb4',
            'use_unicode': True,
            'autocommit': False
        }
        
        self.connection = None
        self.root_dir = root_dir
        
    def connect(self):
        """Establece conexión con la base de datos"""
        try:
            print(f"🔌 Conectando a {self.config['host']}:{self.config['port']}...")
            self.connection = mysql.connector.connect(**self.config)
            
            if self.connection.is_connected():
                db_info = self.connection.get_server_info()
                print(f"✅ Conectado a MySQL Server version {db_info}")
                cursor = self.connection.cursor()
                cursor.execute("SELECT DATABASE();")
                record = cursor.fetchone()
                print(f"📊 Base de datos actual: {record[0]}")
                cursor.close()
                return True
        except Error as e:
            print(f"❌ Error al conectar a MySQL: {e}")
            return False
            
    def disconnect(self):
        """Cierra la conexión"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("🔌 Conexión cerrada")
            
    def execute_sql_file(self, file_path, description=""):
        """Ejecuta un archivo SQL"""
        if not file_path.exists():
            print(f"⚠️  Archivo no encontrado: {file_path}")
            return False
            
        try:
            print(f"\n📄 Ejecutando: {file_path.name}")
            if description:
                print(f"   {description}")
                
            with open(file_path, 'r', encoding='utf8') as f:
                sql_content = f.read()
                
            # Dividir por comandos (punto y coma)
            # Pero respetar delimiters
            commands = []
            current_command = []
            in_delimiter = False
            delimiter = ';'
            
            for line in sql_content.split('\n'):
                line_stripped = line.strip()
                
                # Detectar cambio de delimiter
                if line_stripped.upper().startswith('DELIMITER'):
                    if 'DELIMITER ;;' in line:
                        delimiter = ';;'
                        in_delimiter = True
                    elif 'DELIMITER ;' in line:
                        delimiter = ';'
                        in_delimiter = False
                    continue
                    
                # Ignorar comentarios y líneas vacías
                if not line_stripped or line_stripped.startswith('--') or line_stripped.startswith('/*'):
                    if '/*!' in line_stripped:  # MySQL specific commands
                        current_command.append(line)
                    continue
                    
                current_command.append(line)
                
                # Verificar si es fin de comando
                if delimiter in line and not line_stripped.startswith('--'):
                    command_text = '\n'.join(current_command)
                    if command_text.strip():
                        commands.append(command_text)
                    current_command = []
            
            # Agregar último comando si existe
            if current_command:
                command_text = '\n'.join(current_command)
                if command_text.strip():
                    commands.append(command_text)
            
            cursor = self.connection.cursor()
            executed = 0
            failed = 0
            
            for i, command in enumerate(commands, 1):
                command = command.strip()
                if not command or command == ';':
                    continue
                    
                try:
                    # Ejecutar cada statement
                    for statement in command.split(delimiter):
                        statement = statement.strip()
                        if statement and statement != '':
                            cursor.execute(statement)
                    executed += 1
                    
                except Error as e:
                    error_msg = str(e)
                    # Ignorar errores de "ya existe" o duplicados
                    if 'already exists' in error_msg.lower() or 'duplicate' in error_msg.lower():
                        print(f"   ⚠️  Comando {i}: {error_msg.split(':')[0]} (ignorado)")
                    else:
                        print(f"   ❌ Error en comando {i}: {error_msg}")
                        failed += 1
                        
            self.connection.commit()
            cursor.close()
            
            print(f"   ✅ Ejecutados: {executed} | Fallidos: {failed}")
            return failed == 0
            
        except Exception as e:
            print(f"   ❌ Error al procesar archivo: {e}")
            self.connection.rollback()
            return False
            
    def drop_all_tables(self):
        """Elimina todas las tablas (PELIGROSO - usar solo si es necesario)"""
        print("\n⚠️  ¿Estás seguro de que quieres ELIMINAR TODAS LAS TABLAS?")
        print("    Esto borrará todos los datos existentes.")
        respuesta = input("    Escribe 'SI ELIMINAR TODO' para confirmar: ")
        
        if respuesta != "SI ELIMINAR TODO":
            print("❌ Operación cancelada")
            return False
            
        try:
            cursor = self.connection.cursor()
            
            # Desactivar foreign key checks
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            
            # Obtener todas las tablas
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            
            print(f"\n🗑️  Eliminando {len(tables)} tablas...")
            for (table_name,) in tables:
                print(f"   Eliminando: {table_name}")
                cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`;")
                
            # Reactivar foreign key checks
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
            self.connection.commit()
            cursor.close()
            
            print("✅ Todas las tablas eliminadas")
            return True
            
        except Error as e:
            print(f"❌ Error al eliminar tablas: {e}")
            self.connection.rollback()
            return False
            
    def import_all(self, clean_install=False):
        """Importa toda la base de datos"""
        if not self.connect():
            return False
            
        try:
            print("\n" + "="*60)
            print("🚀 IMPORTACIÓN DE BASE DE DATOS SERENVOICE")
            print("="*60)
            
            # Opción de limpieza
            if clean_install:
                if not self.drop_all_tables():
                    return False
                    
            # 1. Schema base
            print("\n📦 PASO 1: Creando schema base...")
            base_schema = self.root_dir / 'migrations' / '00_create_base_schema.sql'
            self.execute_sql_file(base_schema, "Tablas principales y roles")
            
            # 2. Migraciones adicionales
            print("\n📦 PASO 2: Aplicando migraciones...")
            migrations = [
                ('actividades_grupales_v2.sql', 'Actividades grupales y participantes'),
                ('invitaciones_grupo.sql', 'Sistema de invitaciones'),
                ('create_auditoria_seguridad.sql', 'Auditoría de seguridad'),
                ('fix_pk_fk.sql', 'Corrección de llaves'),
                ('add_musica_tipo_recomendacion.sql', 'Tipo música en recomendaciones'),
                ('fix_encoding_notificaciones.sql', 'Encoding de notificaciones'),
                ('fix_notifications_urls.sql', 'URLs de notificaciones'),
                ('add_resultado_to_participacion_actividad.sql', 'Campo resultado en participación'),
            ]
            
            for migration_file, description in migrations:
                migration_path = self.root_dir / 'migrations' / migration_file
                if migration_path.exists():
                    self.execute_sql_file(migration_path, description)
                else:
                    print(f"   ⚠️  No encontrado: {migration_file}")
                    
            # 3. Importar datos desde backup
            print("\n📦 PASO 3: Importando datos desde backup...")
            backup_file = self.root_dir / 'serenvoice_backup.sql'
            if backup_file.exists():
                print("   ⚠️  NOTA: Esto puede tardar varios minutos...")
                self.execute_sql_file(backup_file, "Datos completos de backup")
            else:
                print("   ⚠️  Archivo de backup no encontrado")
                
            # 4. Verificar instalación
            print("\n✅ VERIFICANDO INSTALACIÓN...")
            cursor = self.connection.cursor()
            
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            print(f"\n📊 Tablas creadas: {len(tables)}")
            for (table_name,) in tables:
                cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`;")
                count = cursor.fetchone()[0]
                print(f"   ✓ {table_name}: {count} registros")
                
            cursor.close()
            
            print("\n" + "="*60)
            print("✅ IMPORTACIÓN COMPLETADA EXITOSAMENTE")
            print("="*60)
            
            return True
            
        except Exception as e:
            print(f"\n❌ Error durante la importación: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            self.disconnect()
            

def main():
    print("""
╔═══════════════════════════════════════════════════════════════╗
║   SERENVOICE - IMPORTADOR DE BASE DE DATOS (Railway/Cloud)   ║
╚═══════════════════════════════════════════════════════════════╝
    """)
    
    host = os.getenv('DB_HOST', 'localhost')
    platform = "☁️  Railway" if "railway.app" in host else "☁️  GCP Cloud SQL" if host != 'localhost' else "💻 Local"
    
    print(f"🌐 Plataforma detectada: {platform}")
    print(f"\nConfiguración desde .env:")
    print(f"  Host: {host}")
    print(f"  Puerto: {os.getenv('DB_PORT', '3306')}")
    print(f"  Base de datos: {os.getenv('DB_NAME', 'serenvoice')}")
    print(f"  Usuario: {os.getenv('DB_USER', 'root')}")
    
    if "railway.app" in host:
        print("\n💡 TIP para Railway:")
        print("   • No necesitas autorizar IPs")
        print("   • Las credenciales están en Railway Dashboard → MySQL → Variables")
        print("   • Si cambias la contraseña en Railway, actualiza .env")
    
    print("\n¿Qué deseas hacer?")
    print("  1) Importar SIN eliminar datos existentes (RECOMENDADO para Railway)")
    print("     → Solo agrega tablas/columnas faltantes")
    print("     → Respeta todos tus datos actuales")
    print("  2) LIMPIAR TODO e importar desde cero (⚠️  PELIGROSO)")
    print("     → Elimina TODAS las tablas y datos")
    print("     → Solo usa esto si estás 100% seguro")
    print("  0) Cancelar")
    
    opcion = input("\nSelecciona una opción (1/2/0): ").strip()
    
    if opcion == '0':
        print("❌ Operación cancelada")
        return
        
    clean_install = (opcion == '2')
    
    if clean_install:
        print("\n⚠️  ADVERTENCIA: ¡Eliminarás TODOS los datos existentes!")
        confirmacion = input("Escribe 'CONFIRMAR' para continuar: ").strip()
        if confirmacion != 'CONFIRMAR':
            print("❌ Operación cancelada")
            return
            
    importer = DatabaseImporter()
    success = importer.import_all(clean_install=clean_install)
    
    if success:
        print("\n🎉 ¡Base de datos lista para usar!")
        print("\n💡 Próximos pasos:")
        print("   1. Verifica que el backend pueda conectarse")
        print("   2. Ejecuta: cd backend && python app.py")
        print("   3. Prueba el login en el frontend")
    else:
        print("\n❌ Hubo errores durante la importación")
        print("   Revisa los mensajes arriba para más detalles")
        sys.exit(1)


if __name__ == "__main__":
    main()
