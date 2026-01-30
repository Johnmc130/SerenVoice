// src/Pages/OlvideMiContrasena.jsx
import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import NavbarPublic from "../../components/Publico/NavbarPublic";
import { ThemeContext } from "../../context/themeContextDef";
import PaisajeClaro from "../../assets/PaisajeClaro.svg";
import PaisajeOscuro from "../../assets/PaisajeOscuro.svg";
import "../../global.css";

const OlvideMiContrasena = () => {
  const { isDark } = useContext(ThemeContext);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post(
        api.endpoints.auth.forgotPassword,
        { correo: email }
      );

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.error || "Error al enviar email");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Error al procesar la solicitud. Intenta nuevamente."
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
            <h1>Revisa tu correo</h1>
          </div>

          <div className="success-message">
            <FaEnvelope size={50} style={{ color: "var(--color-primary)" }} />
            <p>
              Te hemos enviado un correo con instrucciones para restablecer tu
              contraseña.
            </p>
            <p>Por favor, revisa tu bandeja de entrada y spam.</p>
          </div>

          <Link to="/login" className="back-link">
            <FaArrowLeft /> Volver al inicio de sesión
          </Link>
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
          <h1>Recuperar Contraseña</h1>
          <p>Ingresa tu correo para recibir instrucciones</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar Instrucciones"}
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

export default OlvideMiContrasena;
