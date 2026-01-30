import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../global.css";
import PageCard from "../../components/Shared/PageCard";
import { FaUser, FaEnvelope, FaCalendarAlt, FaArrowLeft } from "react-icons/fa";

const Perfil = ({ user = {} }) => {
  const navigate = useNavigate();
  const u = user.nombres
    ? user
    : {
        nombres: "Juan",
        apellidos: "García",
        correo: "juan.garcia@email.com",
        fechaRegistro: "2025-01-10",
      };
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const els = cardRef.current.querySelectorAll(".reveal");
    els.forEach((el) => el.classList.add("reveal-visible"));
    if (cardRef.current.classList.contains("reveal"))
      cardRef.current.classList.add("reveal-visible");
  }, []);

  return (
    <div className="perfil-content page-content">
        <PageCard
          ref={cardRef}
          size="xl"
          className="reveal"
          data-revealdelay="60"
          style={{ position: 'relative' }}
        >
          {/* Botón Volver - esquina superior izquierda */}
          <button
            onClick={() => navigate(-1)}
            className="btn-volver"
            style={{
              position: 'absolute',
              top: '1.5rem',
              left: '1.5rem',
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "var(--color-panel)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "var(--color-text-main)",
              fontSize: "0.9rem",
              transition: "all 0.2s ease",
              zIndex: 10
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.color = "white";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "var(--color-panel)";
              e.currentTarget.style.color = "var(--color-text-main)";
            }}
          >
            <FaArrowLeft /> Volver
          </button>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "3rem" }}>
            <FaUser size={48} />
            <div>
              <h2>
                {u.nombres} {u.apellidos}
              </h2>
              <div style={{ color: "var(--color-text-secondary)" }}>
                {u.correo}
              </div>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  marginTop: "0.25rem",
                }}
              >
                Miembro desde {u.fechaRegistro}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <h3>Información</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "1rem",
              }}
            >
              <div>
                <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
                  Correo
                </p>
                <p style={{ margin: 0 }}>{u.correo}</p>
              </div>
              <div>
                <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
                  Registrado
                </p>
                <p style={{ margin: 0 }}>{u.fechaRegistro}</p>
              </div>
            </div>
          </div>
        </PageCard>
    </div>
  );
};

export default Perfil;
