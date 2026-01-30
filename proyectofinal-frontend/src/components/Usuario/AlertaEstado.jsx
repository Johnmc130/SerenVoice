// components/AlertaEstado.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const AlertaEstado = ({ estado, onClose }) => {
  const navigate = useNavigate();

  const irAlJuego = () => {
    navigate("/juego-recomendado", { state: { estado } });
  };

  return (
    <div className="alert-overlay">
      <div className="alert-box">
        <h2>⚠ Estado Detectado</h2>

        <p style={{ fontSize: "18px", marginTop: "10px" }}>
          🔸 Tu estado actual es:  
          <strong style={{ color: "red", fontSize: "20px" }}> {estado.toUpperCase()} </strong>
        </p>

        {estado === "critico" && (
          <p style={{ marginTop: "10px" }}>
            🚨 <strong>Tu estado es crítico</strong>.  
            Ingresa a este juego para estabilizarte.
          </p>
        )}

        <div className="alert-actions">
          <button className="btn-danger" onClick={irAlJuego}>
            Ir al Juego 🎮
          </button>

          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertaEstado;
