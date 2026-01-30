# tools/list_tables.py
import sys
import os

# Agrega el directorio raíz del proyecto al sys.path
# para que podamos importar desde 'backend'
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if root_path not in sys.path:
    sys.path.append(root_path)

from backend.database.connection import DatabaseConnection
from backend.database.config import Config

def list_db_tables():
    """
    Se conecta a la base de datos configurada y lista sus tablas.
    """
    db_config = Config.DB_CONFIG
    db_name = db_config.get('database')

    print(f"=========================================")
    print(f"Conectando a la base de datos: '{db_name}'")
    print(f"Host: {db_config.get('host')}:{db_config.get('port')}")
    print(f"Usuario: {db_config.get('user')}")
    print(f"=========================================\n")
    
    try:
        DatabaseConnection.initialize_pool()
        with DatabaseConnection.get_connection() as connection:
            print("✅ Conexión a la base de datos exitosa.")
            cursor = connection.cursor()
            
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            
            print(f"\nTablas encontradas en '{db_name}':")
            if not tables:
                print("  -> No se encontraron tablas.")
            else:
                for table in tables:
                    print(f"  - {table[0]}")
            
            print("\n")

    except Exception as e:
        print(f"❌ Error al conectar o consultar la base de datos:")
        print(f"   Error: {e}")
        print("\n   Por favor, verifica lo siguiente:")
        print("   1. ¿El servicio de base de datos (MySQL/MariaDB) está en ejecución?")
        print(f"   2. ¿Existe la base de datos '{db_name}'?")
        print(f"   3. ¿Son correctas las credenciales (host, usuario, contraseña) en tu archivo .env?")
        print("   4. ¿El usuario de la base de datos tiene permisos sobre el schema?")

if __name__ == "__main__":
    list_db_tables()
