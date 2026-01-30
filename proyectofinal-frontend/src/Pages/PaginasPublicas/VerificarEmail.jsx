// src/Pages/VerificarEmail.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import NavbarPublic from "../../components/Publico/NavbarPublic";
import { ThemeContext } from "../../context/themeContextDef";
import PaisajeClaro from "../../assets/PaisajeClaro.svg";
import PaisajeOscuro from "../../assets/PaisajeOscuro.svg";
import "../../global.css";

const VerificarEmail = () => {
  const { isDark } = useContext(ThemeContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const isMountedRef = useRef(true);
  const verifyingRef = useRef(false);

  useEffect(() => {
    const verificarEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Token de verificación no encontrado");
        return;
      }

      // Evitar múltiples verificaciones para el mismo token (StrictMode o clicks múltiples)
      const key = `emailVerified_${token}`;
      if (sessionStorage.getItem(key)) {
        setStatus("success");
        setMessage("Tu email ya ha sido verificado");
        navigate("/login");
        return;
      }

      if (verifyingRef.current) return;
      verifyingRef.current = true;

      try {
        const response = await apiClient.get(`${api.endpoints.auth.verifyEmail}/${token}`);

        if (response.data && response.data.success) {
          sessionStorage.setItem(key, '1');
          setStatus("success");
          setMessage(response.data.message || "Email verificado exitosamente");
          // Redirigir inmediatamente al login
          navigate("/login");
          return;
        }

        setStatus("error");
        setMessage(response.data?.error || "Error al verificar email");
      } catch (error) {
        const errorMsg = error.response?.data?.error || "Error al verificar email";
        if (errorMsg.includes("ya verificado")) {
          // Marcar en sessionStorage para evitar reintentos
          sessionStorage.setItem(key, '1');
          setStatus("success");
          setMessage("Tu email ya ha sido verificado");
          navigate("/login");
        } else {
          setStatus("error");
          setMessage(errorMsg);
        }
      } finally {
        verifyingRef.current = false;
      }
    };

    verificarEmail();

    return () => {
      isMountedRef.current = false;
    };
  }, [searchParams, navigate]);

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
      <div className="auth-card verification-card">
        <div className="verification-content">
          {status === "loading" && (
            <>
              <FaSpinner className="verification-icon spinning" />
              <h2>Verificando tu email...</h2>
              <p>Por favor espera un momento</p>
            </>
          )}

          {status === "success" && (
            <>
              <FaCheckCircle className="verification-icon success" />
              <h2>¡Email Verificado!</h2>
              <p>{message}</p>
              <p className="redirect-message">
                Redirigiendo al inicio de sesión...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <FaTimesCircle className="verification-icon error" />
              <h2>Error en la verificación</h2>
              <p>{message}</p>
              <button
                className="auth-button"
                onClick={() => navigate("/login")}
              >
                Ir al inicio de sesión
              </button>
            </>
          )}
        </div>
      </div>
    </main>
    <footer className="footer">
      © {new Date().getFullYear()} SerenVoice — Todos los derechos reservados.
    </footer>
    </>
  );
};

export default VerificarEmail;
