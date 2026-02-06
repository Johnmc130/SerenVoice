# backend/services/login_attempts_service.py
"""
Servicio para gestionar los intentos de inicio de sesión y bloqueo temporal.
"""
from datetime import datetime, timedelta
from backend.database.connection import DatabaseConnection


class LoginAttemptsService:
    """Servicio para controlar intentos de login fallidos."""
    
    # Configuración
    MAX_ATTEMPTS = 5  # Máximo intentos antes de bloquear
    BLOCK_DURATION_MINUTES = 15  # Tiempo de bloqueo en minutos
    RESET_AFTER_MINUTES = 30  # Resetear contador después de X minutos sin intentos
    
    @staticmethod
    def check_if_blocked(correo: str, ip_address: str = None) -> dict:
        """
        Verifica si un correo o IP está bloqueado.
        
        Returns:
            dict con keys: blocked (bool), remaining_time (int segundos), message (str)
        """
        try:
            # Buscar por correo
            query = """
                SELECT intentos, bloqueado_hasta, ultimo_intento
                FROM login_attempts 
                WHERE correo = %s
                ORDER BY ultimo_intento DESC
                LIMIT 1
            """
            result = DatabaseConnection.execute_query(query, (correo,), fetch=True)
            
            if result and len(result) > 0:
                record = result[0]
                bloqueado_hasta = record.get('bloqueado_hasta')
                
                if bloqueado_hasta:
                    now = datetime.now()
                    if isinstance(bloqueado_hasta, str):
                        bloqueado_hasta = datetime.fromisoformat(bloqueado_hasta)
                    
                    if now < bloqueado_hasta:
                        remaining = (bloqueado_hasta - now).total_seconds()
                        minutes = int(remaining // 60)
                        seconds = int(remaining % 60)
                        return {
                            'blocked': True,
                            'remaining_time': int(remaining),
                            'message': f'Demasiados intentos fallidos. Intenta de nuevo en {minutes}:{seconds:02d} minutos.'
                        }
            
            return {'blocked': False, 'remaining_time': 0, 'message': ''}
            
        except Exception as e:
            print(f"[LOGIN_ATTEMPTS] Error verificando bloqueo: {e}")
            return {'blocked': False, 'remaining_time': 0, 'message': ''}
    
    @staticmethod
    def record_failed_attempt(correo: str, ip_address: str = None) -> dict:
        """
        Registra un intento fallido de login.
        
        Returns:
            dict con: attempts_left (int), blocked (bool), block_duration (int minutos)
        """
        try:
            now = datetime.now()
            
            # Buscar intentos existentes
            query = """
                SELECT id, intentos, ultimo_intento
                FROM login_attempts 
                WHERE correo = %s
                ORDER BY ultimo_intento DESC
                LIMIT 1
            """
            result = DatabaseConnection.execute_query(query, (correo,), fetch=True)
            
            if result and len(result) > 0:
                record = result[0]
                ultimo_intento = record.get('ultimo_intento')
                
                # Si el último intento fue hace más de RESET_AFTER_MINUTES, resetear
                if ultimo_intento:
                    if isinstance(ultimo_intento, str):
                        ultimo_intento = datetime.fromisoformat(ultimo_intento)
                    
                    if (now - ultimo_intento).total_seconds() > LoginAttemptsService.RESET_AFTER_MINUTES * 60:
                        # Resetear contador
                        intentos = 1
                    else:
                        intentos = record.get('intentos', 0) + 1
                else:
                    intentos = record.get('intentos', 0) + 1
                
                # Actualizar registro
                bloqueado_hasta = None
                if intentos >= LoginAttemptsService.MAX_ATTEMPTS:
                    bloqueado_hasta = now + timedelta(minutes=LoginAttemptsService.BLOCK_DURATION_MINUTES)
                
                update_query = """
                    UPDATE login_attempts 
                    SET intentos = %s, ultimo_intento = %s, bloqueado_hasta = %s, ip_address = %s
                    WHERE id = %s
                """
                DatabaseConnection.execute_query(
                    update_query, 
                    (intentos, now, bloqueado_hasta, ip_address, record['id']),
                    fetch=False
                )
                
            else:
                # Crear nuevo registro
                intentos = 1
                bloqueado_hasta = None
                
                insert_query = """
                    INSERT INTO login_attempts (correo, ip_address, intentos, ultimo_intento, bloqueado_hasta)
                    VALUES (%s, %s, %s, %s, %s)
                """
                DatabaseConnection.execute_query(
                    insert_query,
                    (correo, ip_address, intentos, now, bloqueado_hasta),
                    fetch=False
                )
            
            attempts_left = max(0, LoginAttemptsService.MAX_ATTEMPTS - intentos)
            is_blocked = intentos >= LoginAttemptsService.MAX_ATTEMPTS
            
            return {
                'attempts_left': attempts_left,
                'blocked': is_blocked,
                'block_duration': LoginAttemptsService.BLOCK_DURATION_MINUTES if is_blocked else 0
            }
            
        except Exception as e:
            print(f"[LOGIN_ATTEMPTS] Error registrando intento: {e}")
            return {'attempts_left': LoginAttemptsService.MAX_ATTEMPTS, 'blocked': False, 'block_duration': 0}
    
    @staticmethod
    def clear_attempts(correo: str) -> bool:
        """
        Limpia los intentos fallidos después de un login exitoso.
        """
        try:
            query = "DELETE FROM login_attempts WHERE correo = %s"
            DatabaseConnection.execute_query(query, (correo,), fetch=False)
            return True
        except Exception as e:
            print(f"[LOGIN_ATTEMPTS] Error limpiando intentos: {e}")
            return False
