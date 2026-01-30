// src/Pages/PaginasPublicas/RegistroExitoso.jsx
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaEnvelope, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import NavbarPublic from "../../components/Publico/NavbarPublic";
import { ThemeContext } from "../../context/themeContextDef";
import PaisajeClaro from "../../assets/PaisajeClaro.svg";
import PaisajeOscuro from "../../assets/PaisajeOscuro.svg";
import "../../global.css";

const RegistroExitoso = () => {
  const { isDark } = useContext(ThemeContext);
  const location = useLocation();
  const { email, emailSent } = location.state || {};

  return (
    <>
      <NavbarPublic />
      <main
        className="auth-container"
        style={{
          paddingTop: "2rem",
          paddingBottom: "3rem",
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
          <FaCheckCircle size={50} style={{ color: "var(--color-primary)" }} />
          <h1>¡Registro Exitoso!</h1>
        </div>

        {emailSent ? (
          <>
            <FaEnvelope size={40} style={{ color: "var(--color-primary)", marginBottom: "1rem", marginTop: "1rem" }} />
            <p>
              Hemos enviado un correo de verificación a:
            </p>
            <p style={{ fontWeight: "bold", color: "var(--color-primary)" }}>
              {email}
            </p>
            <p>
              Por favor, revisa tu bandeja de entrada y haz clic en el enlace
              de verificación para activar tu cuenta.
            </p>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginTop: "1rem", marginBottom: "1rem" }}>
              <strong>Nota:</strong> Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.
            </p>
            
            <Link to="/login" style={{ display: "block" }}>
              <button className="auth-button" style={{ width: "100%" }}>
                Ir a Iniciar Sesión
              </button>
            </Link>
          </>
        ) : (
          <>
            <p style={{ marginTop: "1rem" }}>
              Tu cuenta ha sido creada exitosamente.
            </p>
            <p style={{ color: "var(--color-warning)", marginTop: "1rem", marginBottom: "1rem" }}>
              <strong>Importante:</strong> No se pudo enviar el correo de verificación.
              Por favor, contacta al administrador para activar tu cuenta.
            </p>
            
            <Link to="/login" style={{ display: "block" }}>
              <button className="auth-button" style={{ width: "100%" }}>
                Ir a Iniciar Sesión
              </button>
            </Link>
          </>
        )}
      </div>
    </main>
    <footer className="footer">
      © {new Date().getFullYear()} SerenVoice — Todos los derechos reservados.
    </footer>
    </>
  );
};

export default RegistroExitoso;
