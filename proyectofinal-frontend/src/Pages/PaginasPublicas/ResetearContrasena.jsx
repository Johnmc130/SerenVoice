// src/Pages/ResetearContrasena.jsx
import React, { useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import NavbarPublic from "../../components/Publico/NavbarPublic";
import { ThemeContext } from "../../context/themeContextDef";
import PaisajeClaro from "../../assets/PaisajeClaro.svg";
import PaisajeOscuro from "../../assets/PaisajeOscuro.svg";
import "../../global.css";

const ResetearContrasena = () => {
  const { isDark } = useContext(ThemeContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    nueva_contrasena: "",
    confirmar_contrasena: "",
  });
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.nueva_contrasena !== formData.confirmar_contrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.nueva_contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!token) {
      setError("Token de recuperación no válido");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post(
        api.endpoints.auth.resetPassword,
        {
          token: token,
          nueva_contrasena: formData.nueva_contrasena,
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.data.error || "Error al restablecer contraseña");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Error al restablecer contraseña. El enlace puede haber expirado."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <NavbarPublic />
        <main
          className="auth-container"
          style={{
            paddingTop: "2rem",
            paddingBottom: "4rem",
            backgroundImage: `url(${isDark ? PaisajeOscuro : PaisajeClaro})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundAttachment: "fixed",
            minHeight: "100vh",
          }}
        >
        <div className="auth-card">
          <div className="auth-header">
            <h1>¡Contraseña Actualizada!</h1>
          </div>

          <div className="success-message">
            <p>Tu contraseña ha sido restablecida exitosamente.</p>
            <p className="redirect-message">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        </div>
      </main>
      <footer className="footer">
        © {new Date().getFullYear()} SerenVoice — Todos los derechos reservados.
      </footer>
      </>
    );
  }

  return (
    <>
      <NavbarPublic />
      <main
        className="auth-container"
        style={{
          paddingTop: "2rem",
          paddingBottom: "4rem",
          backgroundImage: `url(${isDark ? PaisajeOscuro : PaisajeClaro})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          minHeight: "auto",
        }}
      >
      <div className="auth-card">
        <div className="auth-header">
          <h1>Restablecer Contraseña</h1>
          <p>Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showPassword.new ? "text" : "password"}
                name="nueva_contrasena"
                placeholder="Nueva contraseña"
                value={formData.nueva_contrasena}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword({ ...showPassword, new: !showPassword.new })
                }
              >
                {showPassword.new ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showPassword.confirm ? "text" : "password"}
                name="confirmar_contrasena"
                placeholder="Confirmar contraseña"
                value={formData.confirmar_contrasena}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    confirm: !showPassword.confirm,
                  })
                }
              >
                {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Actualizando..." : "Restablecer Contraseña"}
          </button>
        </form>
      </div>
    </main>
    <footer className="footer">
      © {new Date().getFullYear()} SerenVoice — Todos los derechos reservados.
    </footer>
    </>
  );
};

export default ResetearContrasena;
