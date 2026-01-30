# backend/models/refresh_token.py
from typing import Optional, Dict, List
from backend.database.connection import DatabaseConnection
from datetime import datetime, timedelta
import hashlib
import secrets


class RefreshToken:
    """Modelo para gestión de refresh tokens persistentes."""
    
    @staticmethod
    def _hash_token(token: str) -> str:
        """
        Crear hash del token para almacenamiento seguro.
        No almacenamos el token en texto plano.
        """
        return hashlib.sha256(token.encode()).hexdigest()
    
    @staticmethod
    def create(
        id_usuario: int,
        token: str,
        fecha_expiracion: datetime,
        es_recordarme: bool = False,
        dispositivo: Optional[str] = None,
        navegador: Optional[str] = None,
        sistema_operativo: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Optional[int]:
        """
        Crear un nuevo registro de refresh token.
        
        Args:
            id_usuario: ID del usuario propietario del token
            token: Token JWT (se almacenará hasheado)
            fecha_expiracion: Fecha de expiración del token
            es_recordarme: Si fue creado con "Recuérdame"
            dispositivo: Tipo de dispositivo (Mobile, Desktop, Tablet)
            navegador: Navegador utilizado
            sistema_operativo: SO del cliente
            ip_address: Dirección IP del cliente
            user_agent: User agent completo
        
        Returns:
            ID del registro creado o None si falla
        """
        query = """
            INSERT INTO refresh_token (
                id_usuario, token_hash, fecha_expiracion, es_recordarme,
                dispositivo, navegador, sistema_operativo, ip_address, user_agent
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        token_hash = RefreshToken._hash_token(token)
        
        result = DatabaseConnection.execute_query(
            query,
            (
                id_usuario, token_hash, fecha_expiracion, es_recordarme,
                dispositivo, navegador, sistema_operativo, ip_address, user_agent
            ),
            fetch=False
        )
        
        return result.get('last_id') if result else None
    
    @staticmethod
    def get_by_token(token: str) -> Optional[Dict]:
        """
        Obtener registro de refresh token por el token (hasheado).
        
        Args:
            token: Token JWT a buscar
        
        Returns:
            Diccionario con datos del token o None si no existe
        """
        query = """
            SELECT * FROM refresh_token
            WHERE token_hash = %s 
            AND activo = 1 
            AND revocado = 0
            AND fecha_expiracion > NOW()
            LIMIT 1
        """
        
        token_hash = RefreshToken._hash_token(token)
        results = DatabaseConnection.execute_query(query, (token_hash,))
        
        return results[0] if results else None
    
    @staticmethod
    def get_by_user(id_usuario: int, limit: int = 10) -> List[Dict]:
        """
        Obtener tokens activos de un usuario.
        
        Args:
            id_usuario: ID del usuario
            limit: Número máximo de resultados
        
        Returns:
            Lista de tokens activos del usuario
        """
        query = """
            SELECT 
                id_refresh_token, dispositivo, navegador, sistema_operativo,
                ip_address, fecha_creacion, fecha_expiracion, es_recordarme,
                ultimo_uso, activo
            FROM refresh_token
            WHERE id_usuario = %s 
            AND activo = 1 
            AND revocado = 0
            ORDER BY fecha_creacion DESC
            LIMIT %s
        """
        
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def revoke(id_refresh_token: int) -> bool:
        """
        Revocar un refresh token específico.
        
        Args:
            id_refresh_token: ID del token a revocar
        
        Returns:
            True si se revocó exitosamente
        """
        query = """
            UPDATE refresh_token
            SET revocado = 1, activo = 0, fecha_revocacion = NOW()
            WHERE id_refresh_token = %s
        """
        
        DatabaseConnection.execute_query(query, (id_refresh_token,), fetch=False)
        return True
    
    @staticmethod
    def revoke_by_token(token: str) -> bool:
        """
        Revocar un token por su valor.
        
        Args:
            token: Token JWT a revocar
        
        Returns:
            True si se revocó exitosamente
        """
        query = """
            UPDATE refresh_token
            SET revocado = 1, activo = 0, fecha_revocacion = NOW()
            WHERE token_hash = %s
        """
        
        token_hash = RefreshToken._hash_token(token)
        DatabaseConnection.execute_query(query, (token_hash,), fetch=False)
        return True
    
    @staticmethod
    def revoke_all_user_tokens(id_usuario: int) -> bool:
        """
        Revocar todos los tokens de un usuario (logout de todos los dispositivos).
        
        Args:
            id_usuario: ID del usuario
        
        Returns:
            True si se revocaron exitosamente
        """
        query = """
            UPDATE refresh_token
            SET revocado = 1, activo = 0, fecha_revocacion = NOW()
            WHERE id_usuario = %s AND activo = 1
        """
        
        DatabaseConnection.execute_query(query, (id_usuario,), fetch=False)
        return True
    
    @staticmethod
    def update_last_use(id_refresh_token: int) -> bool:
        """
        Actualizar timestamp de último uso.
        
        Args:
            id_refresh_token: ID del token
        
        Returns:
            True si se actualizó exitosamente
        """
        query = """
            UPDATE refresh_token
            SET ultimo_uso = NOW()
            WHERE id_refresh_token = %s
        """
        
        DatabaseConnection.execute_query(query, (id_refresh_token,), fetch=False)
        return True
    
    @staticmethod
    def cleanup_expired() -> int:
        """
        Limpiar tokens expirados (llamar periódicamente).
        
        Returns:
            Número de tokens eliminados
        """
        # Marcar como inactivos
        query1 = """
            UPDATE refresh_token
            SET activo = 0
            WHERE fecha_expiracion < NOW() AND activo = 1
        """
        DatabaseConnection.execute_query(query1, fetch=False)
        
        # Eliminar tokens muy antiguos (más de 90 días expirados)
        query2 = """
            DELETE FROM refresh_token
            WHERE fecha_expiracion < DATE_SUB(NOW(), INTERVAL 90 DAY)
        """
        result = DatabaseConnection.execute_query(query2, fetch=False)
        
        return result.get('affected_rows', 0) if result else 0
    
    @staticmethod
    def count_active_sessions(id_usuario: int) -> int:
        """
        Contar sesiones activas de un usuario.
        
        Args:
            id_usuario: ID del usuario
        
        Returns:
            Número de sesiones activas
        """
        query = """
            SELECT COUNT(*) as total
            FROM refresh_token
            WHERE id_usuario = %s 
            AND activo = 1 
            AND revocado = 0
            AND fecha_expiracion > NOW()
        """
        
        results = DatabaseConnection.execute_query(query, (id_usuario,))
        return results[0]['total'] if results else 0
