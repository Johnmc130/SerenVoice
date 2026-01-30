# backend/services/auditoria_service.py
"""
Servicio de auditoría para registrar eventos de seguridad.
Cumple con requisitos de privacidad y trazabilidad.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from backend.database.connection import DatabaseConnection
from backend.utils.security_middleware import SecureLogger


class AuditoriaService:
    """
    Servicio para registrar eventos de auditoría.
    Registra acciones críticas sin almacenar datos sensibles.
    """
    
    # Tipos de eventos de auditoría
    EVENTO_LOGIN = 'LOGIN'
    EVENTO_LOGOUT = 'LOGOUT'
    EVENTO_LOGIN_FALLIDO = 'LOGIN_FALLIDO'
    EVENTO_REGISTRO = 'REGISTRO'
    EVENTO_CAMBIO_PASSWORD = 'CAMBIO_PASSWORD'
    EVENTO_CAMBIO_PERFIL = 'CAMBIO_PERFIL'
    EVENTO_ACCESO_DATOS = 'ACCESO_DATOS'
    EVENTO_MODIFICACION_DATOS = 'MODIFICACION_DATOS'
    EVENTO_ELIMINACION_DATOS = 'ELIMINACION_DATOS'
    EVENTO_ACCESO_ADMIN = 'ACCESO_ADMIN'
    EVENTO_ERROR_SEGURIDAD = 'ERROR_SEGURIDAD'
    EVENTO_RATE_LIMIT = 'RATE_LIMIT_EXCEEDED'
    
    @staticmethod
    def registrar_evento(
        tipo_evento: str,
        id_usuario: Optional[int] = None,
        descripcion: str = None,
        ip_address: str = None,
        user_agent: str = None,
        datos_adicionales: Dict[str, Any] = None,
        exitoso: bool = True
    ) -> bool:
        """
        Registra un evento de auditoría en la base de datos.
        
        Args:
            tipo_evento: Tipo de evento (usar constantes de clase)
            id_usuario: ID del usuario (puede ser None para eventos anónimos)
            descripcion: Descripción breve del evento
            ip_address: Dirección IP del cliente
            user_agent: User-Agent del navegador/cliente
            datos_adicionales: Datos extra (serán sanitizados)
            exitoso: Si la acción fue exitosa o no
        
        Returns:
            bool: True si se registró correctamente
        """
        try:
            # Sanitizar datos adicionales
            datos_safe = None
            if datos_adicionales:
                datos_safe = SecureLogger.sanitize_dict(datos_adicionales)
                # Convertir a JSON string
                import json
                datos_safe = json.dumps(datos_safe, default=str)
            
            with DatabaseConnection.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO auditoria_seguridad 
                    (tipo_evento, id_usuario, descripcion, ip_address, user_agent, 
                     datos_adicionales, exitoso, fecha_evento)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    tipo_evento,
                    id_usuario,
                    descripcion,
                    ip_address,
                    user_agent[:500] if user_agent else None,  # Limitar longitud
                    datos_safe,
                    exitoso,
                    datetime.now()
                ))
                
                conn.commit()
                return True
                
        except Exception as e:
            # Si falla el registro de auditoría, al menos loguearlo
            SecureLogger.error(
                "Error registrando evento de auditoría",
                data={
                    "tipo_evento": tipo_evento,
                    "error": str(e)
                }
            )
            return False
    
    @staticmethod
    def registrar_login(id_usuario: int, ip: str, user_agent: str, exitoso: bool = True):
        """Registra un intento de login."""
        return AuditoriaService.registrar_evento(
            tipo_evento=AuditoriaService.EVENTO_LOGIN if exitoso else AuditoriaService.EVENTO_LOGIN_FALLIDO,
            id_usuario=id_usuario,
            descripcion="Inicio de sesión" if exitoso else "Intento de login fallido",
            ip_address=ip,
            user_agent=user_agent,
            exitoso=exitoso
        )
    
    @staticmethod
    def registrar_logout(id_usuario: int, ip: str):
        """Registra un cierre de sesión."""
        return AuditoriaService.registrar_evento(
            tipo_evento=AuditoriaService.EVENTO_LOGOUT,
            id_usuario=id_usuario,
            descripcion="Cierre de sesión",
            ip_address=ip,
            exitoso=True
        )
    
    @staticmethod
    def registrar_cambio_password(id_usuario: int, ip: str, exitoso: bool = True):
        """Registra un cambio de contraseña."""
        return AuditoriaService.registrar_evento(
            tipo_evento=AuditoriaService.EVENTO_CAMBIO_PASSWORD,
            id_usuario=id_usuario,
            descripcion="Cambio de contraseña",
            ip_address=ip,
            exitoso=exitoso
        )
    
    @staticmethod
    def registrar_acceso_datos_sensibles(
        id_usuario: int, 
        recurso: str, 
        accion: str,
        ip: str = None
    ):
        """Registra acceso a datos sensibles (cumplimiento GDPR/privacidad)."""
        return AuditoriaService.registrar_evento(
            tipo_evento=AuditoriaService.EVENTO_ACCESO_DATOS,
            id_usuario=id_usuario,
            descripcion=f"Acceso a {recurso}",
            ip_address=ip,
            datos_adicionales={"recurso": recurso, "accion": accion},
            exitoso=True
        )
    
    @staticmethod
    def registrar_error_seguridad(
        descripcion: str,
        id_usuario: Optional[int] = None,
        ip: str = None,
        datos: Dict = None
    ):
        """Registra un evento de seguridad sospechoso."""
        return AuditoriaService.registrar_evento(
            tipo_evento=AuditoriaService.EVENTO_ERROR_SEGURIDAD,
            id_usuario=id_usuario,
            descripcion=descripcion,
            ip_address=ip,
            datos_adicionales=datos,
            exitoso=False
        )
    
    @staticmethod
    def obtener_eventos_usuario(id_usuario: int, limite: int = 50) -> list:
        """
        Obtiene los eventos de auditoría de un usuario.
        Útil para que el usuario vea su actividad reciente.
        """
        try:
            with DatabaseConnection.get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                
                cursor.execute("""
                    SELECT id_auditoria, tipo_evento, descripcion, 
                           ip_address, exitoso, fecha_evento
                    FROM auditoria_seguridad
                    WHERE id_usuario = %s
                    ORDER BY fecha_evento DESC
                    LIMIT %s
                """, (id_usuario, limite))
                
                return cursor.fetchall()
                
        except Exception as e:
            SecureLogger.error("Error obteniendo eventos de auditoría", 
                            data={"error": str(e)})
            return []
    
    @staticmethod
    def obtener_eventos_sospechosos(horas: int = 24, limite: int = 100) -> list:
        """
        Obtiene eventos sospechosos recientes (para panel admin).
        """
        try:
            with DatabaseConnection.get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                
                cursor.execute("""
                    SELECT a.*, u.correo as usuario_correo
                    FROM auditoria_seguridad a
                    LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
                    WHERE a.tipo_evento IN (%s, %s, %s)
                    AND a.fecha_evento >= DATE_SUB(NOW(), INTERVAL %s HOUR)
                    ORDER BY a.fecha_evento DESC
                    LIMIT %s
                """, (
                    AuditoriaService.EVENTO_LOGIN_FALLIDO,
                    AuditoriaService.EVENTO_ERROR_SEGURIDAD,
                    AuditoriaService.EVENTO_RATE_LIMIT,
                    horas,
                    limite
                ))
                
                return cursor.fetchall()
                
        except Exception as e:
            SecureLogger.error("Error obteniendo eventos sospechosos",
                            data={"error": str(e)})
            return []


# Singleton para uso fácil
auditoria = AuditoriaService()
