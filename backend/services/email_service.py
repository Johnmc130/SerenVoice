# services/email_service.py
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
import os
from datetime import datetime, timedelta
import secrets

class EmailService:
    def __init__(self):
        # Configurar API key de Brevo
        brevo_api_key = os.getenv('BREVO_API_KEY')
        
        if not brevo_api_key:
            print("[EMAIL WARNING] BREVO_API_KEY no configurada. Funcionalidad de email deshabilitada.")
            print("[EMAIL INFO] Para habilitar emails:")
            print("  1. Crea una cuenta en https://app.brevo.com/")
            print("  2. Obtén tu API key en Settings > SMTP & API > API Keys")
            print("  3. Crea un archivo .env en backend/ con: BREVO_API_KEY=tu_api_key")
            self.api_instance = None
            self.sender = None
            return
        
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = brevo_api_key
        
        self.api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        self.sender = {"name": "SerenVoice", "email": os.getenv('SENDER_EMAIL', 'sebas.games52@gmail.com')}
    
    def generar_token(self):
        """Genera un token seguro de 32 caracteres"""
        return secrets.token_urlsafe(32)
    
    def calcular_expiracion(self, horas=24):
        """Calcula fecha de expiración (por defecto 24 horas)"""
        return datetime.now() + timedelta(hours=horas)
    
    def enviar_email_verificacion(self, destinatario_email, destinatario_nombre, token_verificacion):
        """Envía email de verificación de cuenta"""
        if not self.api_instance:
            print(f"[EMAIL SKIP] API no configurada. Email de verificación no enviado a {destinatario_email}")
            return False
        
        try:
            # URL de verificación (ajustar según tu dominio)
            url_verificacion = f"http://localhost:5173/verificar-email?token={token_verificacion}"
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": destinatario_email, "name": destinatario_nombre}],
                sender=self.sender,
                subject="Bienvenido a SerenVoice — confirma tu correo",
                html_content=f"""
                <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                            <!-- Inline logo SVG (simple, tonal) -->
                            <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <defs>
                                        <linearGradient id="g1" x1="0" x2="1">
                                            <stop offset="0" stop-color="#667eea" />
                                            <stop offset="1" stop-color="#764ba2" />
                                        </linearGradient>
                                    </defs>
                                    <rect width="48" height="48" rx="10" fill="url(#g1)" />
                                    <g transform="translate(8,12)" fill="white">
                                        <path d="M6 4 C8 4 10 6 10 8 C10 10 8 12 6 12 C4 12 2 10 2 8 C2 6 4 4 6 4 Z" opacity="0.9"/>
                                        <path d="M14 6 C16 6 18 8 18 10 C18 12 16 14 14 14 C12 14 10 12 10 10 C10 8 12 6 14 6 Z" opacity="0.7"/>
                                    </g>
                                </svg>
                                <h1 style="color: white; margin: 0; font-size: 20px;">SerenVoice</h1>
                            </div>
                        </div>
                        
                        <div style="background: #fbfbfb; padding: 28px; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #263238; margin-top: 0;">Hola {destinatario_nombre},</h2>
                            <p style="color: #455a64; line-height: 1.6; font-size: 15px;">
                                Bienvenido a SerenVoice. Aquí encontrarás una herramienta pensada para
                                ayudarte a entender tu estado emocional a través de la voz, con respeto
                                por tu privacidad y sin reemplazar la ayuda profesional.
                            </p>

                            <p style="color: #546e7a; line-height: 1.6; font-size: 14px;">
                                Para activar tu cuenta y proteger tu espacio personal, confirma tu correo
                                pulsando el botón que aparece abajo. Solo tú tendrás acceso a estos
                                resultados y tratamos tus datos con cuidado y confidencialidad.
                            </p>

                            <div style="text-align: center; margin: 26px 0;">
                                <a href="{url_verificacion}" 
                                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                          color: white; 
                                          padding: 14px 36px; 
                                          text-decoration: none; 
                                          border-radius: 8px; 
                                          display: inline-block;
                                          font-weight: 600;">
                                    Verificar mi cuenta
                                </a>
                            </div>

                            <p style="color: #90a4ae; font-size: 13px; line-height: 1.5;">
                                Este enlace expirará en 24 horas. Si no solicitaste este registro,
                                puedes ignorar este correo con tranquilidad.
                            </p>

                            <p style="color: #90a4ae; font-size: 13px; margin-top: 16px;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                <a href="{url_verificacion}" style="color: #667eea; word-break: break-all;">
                                    {url_verificacion}
                                </a>
                            </p>

                            <hr style="border:none;border-top:1px solid #e0e6e9;margin:20px 0;" />

                            <p style="color: #607d8b; font-size: 13px; line-height: 1.5;">
                                SerenVoice acompaña tu exploración emocional de forma segura. No reemplaza
                                el consejo médico o terapéutico. Si estás en una situación de emergencia
                                o necesitas ayuda profesional, por favor busca servicio médico o de apoyo.
                            </p>

                            <p style="color: #9aa8af; font-size: 12px; margin-top: 18px;">
                                Con calma, — El equipo de SerenVoice
                            </p>
                        </div>
                    </body>
                </html>
                """
            )
            
            api_response = self.api_instance.send_transac_email(send_smtp_email)
            print(f"[EMAIL] Verificación enviada a {destinatario_email}: {api_response}")
            return True
            
        except ApiException as e:
            print(f"[EMAIL ERROR] Error enviando verificación: {e}")
            return False
    
    def enviar_email_recuperacion(self, destinatario_email, destinatario_nombre, token_reset):
        """Envía email de recuperación de contraseña"""
        if not self.api_instance:
            print(f"[EMAIL SKIP] API no configurada. Email de recuperación no enviado a {destinatario_email}")
            return False
        
        try:
            # URL de recuperación (ajustar según tu dominio)
            url_reset = f"http://localhost:5173/resetear-contrasena?token={token_reset}"
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": destinatario_email, "name": destinatario_nombre}],
                sender=self.sender,
                subject="SerenVoice — restablece tu contraseña de forma segura",
                html_content=f"""
                <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                            <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <defs>
                                        <linearGradient id="g2" x1="0" x2="1">
                                            <stop offset="0" stop-color="#667eea" />
                                            <stop offset="1" stop-color="#764ba2" />
                                        </linearGradient>
                                    </defs>
                                    <rect width="48" height="48" rx="10" fill="url(#g2)" />
                                    <g transform="translate(8,12)" fill="white">
                                        <path d="M6 4 C8 4 10 6 10 8 C10 10 8 12 6 12 C4 12 2 10 2 8 C2 6 4 4 6 4 Z" opacity="0.9"/>
                                        <path d="M14 6 C16 6 18 8 18 10 C18 12 16 14 14 14 C12 14 10 12 10 10 C10 8 12 6 14 6 Z" opacity="0.7"/>
                                    </g>
                                </svg>
                                <h1 style="color: white; margin: 0; font-size: 20px;">SerenVoice</h1>
                            </div>
                        </div>

                        <div style="background: #fbfbfb; padding: 28px; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #263238; margin-top: 0;">Hola {destinatario_nombre},</h2>
                            <p style="color: #455a64; line-height: 1.6; font-size: 15px;">
                                Recibimos una solicitud para ayudarte a restablecer el acceso a tu cuenta.
                                Si fuiste tú, pulsa el botón de abajo para crear una nueva contraseña.
                            </p>

                            <p style="color: #546e7a; line-height: 1.6; font-size: 14px;">
                                Cuidamos tus datos con privacidad y solo usaremos esta información
                                para ayudarte a recuperar tu cuenta. Si no solicitaste este cambio,
                                ignora este mensaje y no se realizarán cambios.
                            </p>

                            <div style="text-align: center; margin: 26px 0;">
                                <a href="{url_reset}" 
                                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                          color: white; 
                                          padding: 14px 36px; 
                                          text-decoration: none; 
                                          border-radius: 8px; 
                                          display: inline-block;
                                          font-weight: 600;">
                                    Crear nueva contraseña
                                </a>
                            </div>

                            <p style="color: #90a4ae; font-size: 13px; line-height: 1.5;">
                                Este enlace expirará en 1 hora. Si no solicitaste este restablecimiento,
                                puedes ignorar este correo con tranquilidad.
                            </p>

                            <p style="color: #90a4ae; font-size: 13px; margin-top: 16px;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                <a href="{url_reset}" style="color: #667eea; word-break: break-all;">
                                    {url_reset}
                                </a>
                            </p>

                            <hr style="border:none;border-top:1px solid #e0e6e9;margin:20px 0;" />

                            <p style="color: #607d8b; font-size: 13px; line-height: 1.5;">
                                SerenVoice está diseñado para acompañar reflexiones sobre el estado
                                emocional, pero no sustituye a profesionales de la salud. Si necesitas
                                ayuda urgente, contacta a los servicios de emergencia o a tu referente
                                de salud.
                            </p>

                            <p style="color: #9aa8af; font-size: 12px; margin-top: 18px;">
                                Con cuidado, — El equipo de SerenVoice
                            </p>
                        </div>
                    </body>
                </html>
                """
            )
            
            api_response = self.api_instance.send_transac_email(send_smtp_email)
            print(f"[EMAIL] Recuperación enviada a {destinatario_email}: {api_response}")
            return True
            
        except ApiException as e:
            print(f"[EMAIL ERROR] Error enviando recuperación: {e}")
            return False

    def enviar_email_contacto(self, remitente_email, remitente_nombre, asunto, mensaje):
        """Envía un email al equipo/administradores con el contenido del formulario de contacto"""
        if not self.api_instance:
            print(f"[EMAIL SKIP] API no configurada. Email de contacto no enviado desde {remitente_email}")
            return False

        try:
            receiver = os.getenv('CONTACT_RECEIVER_EMAIL', self.sender['email'])

            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
                    <h2>Nuevo mensaje de contacto</h2>
                    <p><strong>De:</strong> {remitente_nombre} &lt;{remitente_email}&gt;</p>
                    <p><strong>Asunto:</strong> {asunto}</p>
                    <hr />
                    <div style="white-space:pre-wrap;">{mensaje}</div>
                    <hr />
                    <p style="color: #777; font-size: 12px;">Enviado desde el formulario de contacto de SerenVoice</p>
                </body>
            </html>
            """

            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": receiver}],
                sender=self.sender,
                subject=f"Contacto - {asunto}",
                html_content=html_body
            )

            api_response = self.api_instance.send_transac_email(send_smtp_email)
            print(f"[EMAIL] Contacto enviado a {receiver}: {api_response}")
            return True

        except ApiException as e:
            print(f"[EMAIL ERROR] Error enviando email de contacto: {e}")
            return False

# Instancia global del servicio
email_service = EmailService()

