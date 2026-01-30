// src/components/Juegos/JuegoRespiracion.jsx
import React, { useState, useEffect } from "react";
import "../../styles/Juegos.css";

const JuegoRespiracion = ({ juego, onFinish, onExit }) => {
  const [fase, setFase] = useState("preparacion"); // preparacion, inhalar, mantener, exhalar, completado
  const [ciclo, setCiclo] = useState(0);
  const [segundos, setSegundos] = useState(4);
  const [iniciado, setIniciado] = useState(false);

  const CICLOS_TOTALES = 5;
  const TIEMPO_INHALAR = 4;
  const TIEMPO_MANTENER = 4;
  const TIEMPO_EXHALAR = 6;

  useEffect(() => {
    if (!iniciado || fase === "preparacion" || fase === "completado") return;

    if (segundos > 0) {
      const timer = setTimeout(() => setSegundos(segundos - 1), 1000);
      return () => clearTimeout(timer);
    }

    // Cambiar de fase cuando termina el contador
    if (segundos === 0) {
      if (fase === "inhalar") {
        setFase("mantener");
        setSegundos(TIEMPO_MANTENER);
      } else if (fase === "mantener") {
        setFase("exhalar");
        setSegundos(TIEMPO_EXHALAR);
      } else if (fase === "exhalar") {
        if (ciclo + 1 >= CICLOS_TOTALES) {
          setFase("completado");
        } else {
          setCiclo(ciclo + 1);
          setFase("inhalar");
          setSegundos(TIEMPO_INHALAR);
        }
      }
    }
  }, [segundos, iniciado, fase, ciclo]);

  const iniciarEjercicio = () => {
    setIniciado(true);
    setFase("inhalar");
    setCiclo(0);
    setSegundos(TIEMPO_INHALAR);
  };

  const getFaseTexto = () => {
    switch (fase) {
      case "inhalar":
        return "Inhala profundamente";
      case "mantener":
        return "Mantén el aire";
      case "exhalar":
        return "Exhala lentamente";
      default:
        return "";
    }
  };

  const getFaseColor = () => {
    switch (fase) {
      case "inhalar":
        return "var(--color-success)";
      case "mantener":
        return "#2196F3";
      case "exhalar":
        return "#FF9800";
      default:
        return "var(--color-text-secondary)";
    }
  };

  const getCirculoSize = () => {
    if (fase === "inhalar") {
      return 100 + (TIEMPO_INHALAR - segundos) * 30;
    } else if (fase === "exhalar") {
      return 220 - (TIEMPO_EXHALAR - segundos) * 20;
    }
    return 220;
  };

  if (fase === "completado") {
    return (
      <div className="juego-container size-sm">
        <div className="juego-completado">
          <div className="completado-emoji">✅</div>
          <h1>¡Ejercicio Completado!</h1>
          <p className="completado-mensaje">
            Has completado {CICLOS_TOTALES} ciclos de respiración consciente.
          </p>
          <p style={{ marginTop: 20, color: "var(--color-text-secondary)" }}>
            ¿Cómo te sientes ahora?
          </p>
          <div className="juego-buttons">
            <button
              className="juego-btn juego-btn-success"
              onClick={() => onFinish(100, true)}
            >
              😊 Mejor
            </button>
            <button
              className="juego-btn juego-btn-info"
              onClick={() => onFinish(50, true)}
            >
              😐 Igual
            </button>
            <button
              className="juego-btn juego-btn-warning"
              onClick={() => onFinish(0, true)}
            >
              😔 No ayudó
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="juego-container size-xl">
      {/* Header */}
      <div className="juego-header">
        <div className="juego-emoji">🫁</div>
        <h1>{juego.nombre}</h1>
        <p>{juego.descripcion}</p>
      </div>

      {!iniciado ? (
        // Pantalla de preparación
        <div style={{ textAlign: "center" }}>
          <div className="juego-instrucciones">
            <h2>📋 Instrucciones</h2>
            <ul>
              <li>🟢 Inhala profundamente por {TIEMPO_INHALAR} segundos</li>
              <li>🔵 Mantén el aire por {TIEMPO_MANTENER} segundos</li>
              <li>🟠 Exhala lentamente por {TIEMPO_EXHALAR} segundos</li>
              <li>🔄 Repite {CICLOS_TOTALES} ciclos completos</li>
            </ul>
          </div>
          <button
            className="juego-btn juego-btn-success juego-btn-large"
            onClick={iniciarEjercicio}
          >
            ▶️ Comenzar Ejercicio
          </button>
        </div>
      ) : (
        // Ejercicio activo
        <div style={{ textAlign: "center" }}>
          {/* Indicador de progreso */}
          <div style={{ marginBottom: 30 }}>
            <p style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)" }}>
              Ciclo {ciclo + 1} de {CICLOS_TOTALES}
            </p>
            <div className="juego-progress">
              <div 
                className="juego-progress-fill"
                style={{ width: `${((ciclo + 1) / CICLOS_TOTALES) * 100}%` }}
              />
            </div>
          </div>

          {/* Círculo de respiración */}
          <div className="juego-breathing-circle">
            <div
              className="juego-breathing-bubble"
              style={{
                width: getCirculoSize(),
                height: getCirculoSize(),
                background: `radial-gradient(circle, ${getFaseColor()}40, ${getFaseColor()}80)`,
                boxShadow: `0 0 40px ${getFaseColor()}60`
              }}
            >
              <div 
                className="bubble-timer"
                style={{ color: getFaseColor() }}
              >
                {segundos}
              </div>
              <div 
                className="bubble-text"
                style={{ color: getFaseColor() }}
              >
                {getFaseTexto()}
              </div>
            </div>
          </div>

          {/* Botón de salir */}
          <button
            className="juego-btn juego-btn-secondary"
            style={{ marginTop: 20 }}
            onClick={onExit}
          >
            ⏸️ Salir
          </button>
        </div>
      )}
    </div>
  );
};

export default JuegoRespiracion;