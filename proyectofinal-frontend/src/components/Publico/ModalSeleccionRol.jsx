import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaUser, FaArrowRight } from "react-icons/fa";
import { useAuth } from "../../context/useAuth";

const ModalSeleccionRol = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    if (selectedRole) {
      if (auth && auth.setUserRole) {
        auth.setUserRole(selectedRole);
      } else {
        localStorage.setItem("userRole", selectedRole);
      }

      if (selectedRole === "ADMINISTRADOR") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }

      setSelectedRole(null);
      if (onClose) onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "var(--color-panel)",
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "600px",
          width: "90%",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.8rem" }}>
            ¿Cuál es tu rol?
          </h2>
          <p
            style={{
              margin: "0",
              color: "var(--color-text-secondary)",
              fontSize: "0.95rem",
            }}
          >
            Selecciona el rol con el que deseas continuar
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            onClick={() => handleSelectRole("USUARIO")}
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              border:
                selectedRole === "USUARIO"
                  ? "2px solid #5ad0d2"
                  : "2px solid rgba(255, 255, 255, 0.2)",
              background:
                selectedRole === "USUARIO"
                  ? "rgba(90, 208, 210, 0.1)"
                  : "transparent",
              cursor: "pointer",
              transition: "all 0.3s",
              textAlign: "center",
            }}
            onMouseEnter={(e) => {
              if (selectedRole !== "USUARIO") {
                e.currentTarget.style.borderColor = "#5ad0d2";
                e.currentTarget.style.background = "rgba(90, 208, 210, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedRole !== "USUARIO") {
                e.currentTarget.style.borderColor =
                  "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <div
              style={{
                fontSize: "2.5rem",
                color: "#5ad0d2",
                marginBottom: "0.75rem",
              }}
            >
              <FaUser />
            </div>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem" }}>
              Usuario
            </h3>
            <p
              style={{
                margin: "0",
                color: "var(--color-text-secondary)",
                fontSize: "0.85rem",
              }}
            >
              Acceso a análisis de voz, historial y alertas personalizadas
            </p>
          </div>

          <div
            onClick={() => handleSelectRole("ADMINISTRADOR")}
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              border:
                selectedRole === "ADMINISTRADOR"
                  ? "2px solid #ff6b6b"
                  : "2px solid rgba(255, 255, 255, 0.2)",
              background:
                selectedRole === "ADMINISTRADOR"
                  ? "rgba(255, 107, 107, 0.1)"
                  : "transparent",
              cursor: "pointer",
              transition: "all 0.3s",
              textAlign: "center",
            }}
            onMouseEnter={(e) => {
              if (selectedRole !== "ADMINISTRADOR") {
                e.currentTarget.style.borderColor = "#ff6b6b";
                e.currentTarget.style.background = "rgba(255, 107, 107, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedRole !== "ADMINISTRADOR") {
                e.currentTarget.style.borderColor =
                  "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <div
              style={{
                fontSize: "2.5rem",
                color: "#ff6b6b",
                marginBottom: "0.75rem",
              }}
            >
              <FaShieldAlt />
            </div>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem" }}>
              Administrador
            </h3>
            <p
              style={{
                margin: "0",
                color: "var(--color-text-secondary)",
                fontSize: "0.85rem",
              }}
            >
              Acceso a gestión de usuarios, reportes y configuración del sistema
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "transparent",
              color: "var(--color-text-main)",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: "500",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!selectedRole}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              background:
                selectedRole === "ADMINISTRADOR"
                  ? "#ff6b6b"
                  : selectedRole === "USUARIO"
                    ? "#5ad0d2"
                    : "#666666",
              color: "#fff",
              cursor: selectedRole ? "pointer" : "not-allowed",
              fontSize: "0.95rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.3s",
              opacity: selectedRole ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (selectedRole) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            Continuar <FaArrowRight style={{ fontSize: "0.8rem" }} />
          </button>
        </div>

        {selectedRole && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              borderLeft:
                selectedRole === "ADMINISTRADOR"
                  ? "4px solid #ff6b6b"
                  : "4px solid #5ad0d2",
            }}
          >
            <p style={{ margin: "0", fontSize: "0.85rem" }}>
              <strong>Nota:</strong> Puedes cambiar de rol en cualquier momento
              desde la configuración de tu cuenta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalSeleccionRol;
