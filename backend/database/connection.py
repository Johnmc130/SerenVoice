import mysql.connector
from mysql.connector import pooling, Error
import os
from dotenv import load_dotenv
from pathlib import Path

# Cargar variables de entorno desde la raíz del proyecto
root_dir = Path(__file__).parent.parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)


class DatabaseConnection:
    """
    Manejo global (estático) del pool de conexiones.
    """
    pool = None
    _initialized = False  # Flag para evitar re-inicialización

    # ------------------------------------------------------------
    # Inicializar pool de conexiones — se llama una sola vez
    # ------------------------------------------------------------
    @staticmethod
    def initialize_pool():
        # ✅ Evitar re-inicialización si ya existe el pool
        if DatabaseConnection._initialized and DatabaseConnection.pool is not None:
            print("[DB] Pool ya inicializado, reutilizando...")
            return
        
        # Pool size configurable, default bajo para Railway (151 max)
        pool_size = int(os.getenv('DB_POOL_SIZE', 5))
        
        try:
            DatabaseConnection.pool = pooling.MySQLConnectionPool(
                pool_name="serenvoice_pool",
                pool_size=pool_size,  # Configurable via env
                pool_reset_session=True,  # Resetear sesión al devolver al pool
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', '1234'),
                database=os.getenv('DB_NAME', 'serenvoice'),
                port=int(os.getenv('DB_PORT', 3306)),
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci',
                use_unicode=True,
                connection_timeout=10,  # Timeout de conexión
                autocommit=True,  # Auto-commit para lecturas
                get_warnings=False,  # Reducir overhead
            )
            DatabaseConnection._initialized = True
            print(f"[DB] Pool de conexiones inicializado correctamente (UTF-8, pool_size={pool_size})")
        except Error as e:
            print(f"[DB] Error al crear pool: {e}")
            raise

    # ------------------------------------------------------------
    # Obtener conexión desde el pool
    # ------------------------------------------------------------
    @staticmethod
    def get_connection():
        # ✅ Auto-inicializar el pool si no existe (lazy initialization)
        if DatabaseConnection.pool is None:
            print("[DB] Pool no inicializado, inicializando automáticamente...")
            DatabaseConnection.initialize_pool()
        
        try:
            raw_conn = DatabaseConnection.pool.get_connection()

            # Wrapper que permite usar `with DatabaseConnection.get_connection() as conn:`
            # sin forzar a que el objeto devuelto sea el tipo original de mysql.connector.
            class _ConnectionContext:
                def __init__(self, inner):
                    self._inner = inner

                def __enter__(self):
                    return self._inner

                def __exit__(self, exc_type, exc, tb):
                    DatabaseConnection.release_connection(self._inner)

                def __getattr__(self, name):
                    return getattr(self._inner, name)

            return _ConnectionContext(raw_conn)
        except Error as e:
            print(f"[DB] Error obteniendo conexión del pool: {e}")
            raise

    # ------------------------------------------------------------
    # Liberar conexión
    # ------------------------------------------------------------
    @staticmethod
    def release_connection(conn):
        if conn:
            conn.close()

    @staticmethod
    def return_connection(conn):
        """
        Compatibilidad: alias para devolver una conexión al pool.
        Mantiene compatibilidad con llamadas antiguas a `return_connection`.
        """
        DatabaseConnection.release_connection(conn)

    # ------------------------------------------------------------
    # Probar conexión
    # ------------------------------------------------------------
    @staticmethod
    def test_connection():
        conn = None
        cursor = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT DATABASE()")
            db_name = cursor.fetchone()[0]

            print(f"[DB] Conexión OK — Base de datos actual: {db_name}")
            return True
        except Error as e:
            print(f"[DB] Error al probar conexión: {e}")
            return False
        except Exception as e:
            print(f"[DB] Error inesperado al probar conexión: {e}")
            return False
        finally:
            if cursor:
                cursor.close()
            if conn:
                DatabaseConnection.release_connection(conn)

    # ------------------------------------------------------------
    # Ejecutar consultas (SELECT, INSERT, UPDATE, DELETE)
    # ------------------------------------------------------------
    @staticmethod
    def execute_query(query, params=None, fetch=True):
        conn = None
        cursor = None

        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(query, params)

            if fetch:
                result = cursor.fetchall()
                return result

            conn.commit()
            # Cuando no se solicita fetch (INSERT/UPDATE/DELETE), devolver información útil
            try:
                last_id = cursor.lastrowid
            except Exception:
                last_id = None
            return {"ok": True, "last_id": last_id, "rowcount": cursor.rowcount}

        except Error as e:
            print(f"[DB] Error ejecutando query: {e}")
            raise

        finally:
            if cursor:
                cursor.close()
            if conn:
                DatabaseConnection.release_connection(conn)

    @staticmethod
    def execute_update(query, params=None):
        """
        Compatibilidad: ejecutar una consulta de modificación (INSERT/UPDATE/DELETE)
        y devolver un dict con el last_id y rowcount.
        """
        return DatabaseConnection.execute_query(query, params, fetch=False)


# ------------------------------------------------------------
# Compatibilidad con proyectos antiguos
# ------------------------------------------------------------
def get_db_connection():
    return DatabaseConnection.get_connection()


# ------------------------------------------------------------
# Prueba manual
# ------------------------------------------------------------
if __name__ == "__main__":
    DatabaseConnection.initialize_pool()
    DatabaseConnection.test_connection()
