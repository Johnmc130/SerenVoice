from flask import Blueprint, request, jsonify
from backend.services.email_service import email_service


bp = Blueprint('contact', __name__, url_prefix='/api/contact')

# ======================================================
# 🔵 CONTACTO TEMPORAL (NO GUARDA EN BD)
# ======================================================
@bp.route('/send', methods=['POST'])
def send_contact():
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "No se recibió JSON"}), 400
    nombre = data.get("nombre", "")
    # aceptar ambos nombres de campo: 'correo' (frontend) o 'email'
    correo = data.get("correo", data.get("email", ""))
    asunto = data.get("asunto", "Contacto desde sitio")
    mensaje = data.get("mensaje", "")

    print("Datos recibidos:", nombre, correo, asunto, mensaje)

    # intentar enviar email al equipo
    try:
        sent = email_service.enviar_email_contacto(correo, nombre, asunto, mensaje)
        if sent:
            return jsonify({"ok": True, "message": "Mensaje enviado"}), 200
        else:
            return jsonify({"ok": False, "error": "Fallo al enviar email"}), 500
    except Exception as e:
        print("Error enviando email de contacto:", e)
        return jsonify({"ok": False, "error": "Error interno"}), 500
