// src/Pages/PaginasUsuarios/JuegoContainer.jsx
import React, { useState, useEffect } from "react";
import logger from '../../utils/logger';
import { useLocation, useNavigate } from "react-router-dom";
import JuegoRespiracion from "../../components/Juegos/JuegoRespiracion";
import JuegoPuzzle from "../../components/Juegos/JuegoPuzzle";
import JuegoMemoria from "../../components/Juegos/JuegoMemoria";
import JuegoMandala from "../../components/Juegos/JuegoMandala";
import JuegoMindfulness from "../../components/Juegos/JuegoMindfulness";

const JuegoContainer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { juego, estadoAntes } = location.state || {};
  const [tiempoInicio, setTiempoInicio] = useState(null);

  useEffect(() => {
    if (!juego) {
      navigate("/juegos");
      return;
    }

    // Iniciar sesión de juego
    setTiempoInicio(Date.now());
    logger.debug("Sesión de juego iniciada");
  }, [juego, navigate]);

  const finalizarJuego = (puntuacion = 0, completado = true) => {
    const duracionSegundos = Math.floor((Date.now() - tiempoInicio) / 1000);
    
    // Aquí podrías llamar a la API para guardar la sesión
    logger.debug("Juego finalizado:", {
      juegoId: juego.id,
      estadoAntes,
      duracionSegundos,
      puntuacion,
      completado
    });

    // Navegar de vuelta
    navigate("/juegos", {
      state: {
        mensaje: "¡Juego completado! ¿Cómo te sientes ahora?",
        juegoCompletado: juego.nombre
      }
    });
  };

  if (!juego) {
    return (
      <div className="juego-container-content page-content" style={{ textAlign: "center" }}>
        <h2>Juego no encontrado</h2>
        <button className="auth-button" onClick={() => navigate("/juegos")}>
          Volver a juegos
        </button>
      </div>
    );
  }

  // Renderizar el juego correcto según el tipo
  const renderJuego = () => {
    const props = {
      juego,
      onFinish: finalizarJuego,
      onExit: () => navigate("/juegos")
    };

    switch (juego.tipo_juego) {
      case "respiracion":
        return <JuegoRespiracion {...props} />;
      case "puzzle":
        return <JuegoPuzzle {...props} />;
      case "memoria":
        return <JuegoMemoria {...props} />;
      case "mandala":
        return <JuegoMandala {...props} />;
      case "mindfulness":
        return <JuegoMindfulness {...props} />;
      default:
        return (
          <div style={{ textAlign: "center", padding: 50 }}>
            <h2>Este juego aún no está disponible</h2>
            <p>Tipo: {juego.tipo_juego}</p>
            <button className="auth-button" onClick={() => navigate("/juegos")}>
              Volver
            </button>
          </div>
        );
    }
  };

  return (
    <div className="juego-container-content page-content">
      {renderJuego()}
    </div>
  );
};

export default JuegoContainer;