import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../global.css";
import PageCard from "../../components/Shared/PageCard";
import { FaFileDownload, FaCalendarAlt, FaArrowLeft } from "react-icons/fa";

const ReportesUsuario = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState({ desde: "", hasta: "" });
  const [msg, setMsg] = useState("");
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const els = cardRef.current.querySelectorAll(".reveal");
    els.forEach((el) => el.classList.add("reveal-visible"));
    if (cardRef.current.classList.contains("reveal"))
      cardRef.current.classList.add("reveal-visible");
  }, []);

  const generate = () => {
    // Generate report immediately (simulado)
    setMsg("Reporte listo: reporte_usuario.csv (simulado)");
  };

  return (
    <div className="reportes-usuario-content page-content">
        <PageCard
          ref={cardRef}
          size="xl"
          className="reveal"
          data-revealdelay="60"
        >
          {/* Botón Volver */}
          <button
            onClick={() => navigate(-1)}
            className="btn-volver"
            style={{
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
              marginBottom: "1rem",
              transition: "all 0.2s ease"
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

          <h2>
            <FaFileDownload /> Mis Reportes
          </h2>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Genera y descarga reportes personales de tus análisis.
          </p>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <div className="form-group">
              <label>Desde</label>
              <input
                type="date"
                value={range.desde}
                onChange={(e) => setRange({ ...range, desde: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Hasta</label>
              <input
                type="date"
                value={range.hasta}
                onChange={(e) => setRange({ ...range, hasta: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button onClick={generate}>
              <FaCalendarAlt /> Generar Reporte
            </button>
            {msg && (
              <div style={{ marginTop: "0.75rem" }} className="success-message">
                {msg}
              </div>
            )}
          </div>
        </PageCard>
    </div>
  );
};

export default ReportesUsuario;
