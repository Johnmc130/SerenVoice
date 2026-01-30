import React, { useState, useContext } from "react";
import { ThemeContext } from "../../context/themeContextDef";
import { FaCog } from "react-icons/fa";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";

const ConfiguracionAdmin = () => {
  useContext(ThemeContext);
  const [msg, setMsg] = useState("");

  const handleSave = () => {
    setMsg("Guardado (simulado)");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="admin-configuracion-page">
      <div className="admin-page-content">
        {/* Header */}
        <div className="admin-page-header">
          <h2><FaCog /> Configuración del Administrador</h2>
        </div>

        <div className="admin-card" style={{ maxWidth: "600px" }}>
          <div className="admin-card-body">
            <div className="admin-form-group">
              <label className="admin-form-label">Notificaciones globales</label>
              <select className="admin-form-input">
                <option>Activadas</option>
                <option>Desactivadas</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Idioma del sistema</label>
              <select className="admin-form-input">
                <option>Español</option>
                <option>English</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Zona horaria</label>
              <select className="admin-form-input">
                <option>America/Mexico_City</option>
                <option>America/Bogota</option>
                <option>America/Lima</option>
                <option>Europe/Madrid</option>
              </select>
            </div>

            <button onClick={handleSave} className="admin-btn admin-btn-primary" style={{ marginTop: "1rem" }}>
              Guardar Configuración
            </button>
            
            {msg && <div className="admin-message admin-message-success" style={{ marginTop: "1rem" }}>{msg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionAdmin;