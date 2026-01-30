// src/Pages/PaginasUsuarios/JuegoRecomendado.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from 'react-icons/fa';
import GameHistory from "../../components/Usuario/GameHistory.jsx";
import { juegosAPI } from "../../services/apiClient";
import PageCard from "../../components/Shared/PageCard";

const JuegoRecomendado = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Estado emocional que viene desde ProbarVoz
  const estadoInicial = location.state?.estado || "estable";

  const [estadoEmocional, _setEstadoEmocional] = useState(estadoInicial);
  const [showHistory, setShowHistory] = useState(false);
  const [juegos, setJuegos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarJuegosRecomendados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await juegosAPI.recomendados(estadoEmocional);

      if (data.success) {
        setJuegos(data.juegos_recomendados || []);
      } else {
        setError("No se pudieron cargar los juegos");
      }
    } catch (err) {
      console.error("Error al cargar juegos:", err);
      setError("Error al conectar con el servidor. ¿Está Flask corriendo?");
    } finally {
      setLoading(false);
    }
  }, [estadoEmocional]);

  useEffect(() => {
    cargarJuegosRecomendados();
  }, [cargarJuegosRecomendados]);

  const getEstadoEmoji = (estado) => {
    const emojis = {
      critico: "🔴",
      alerta: "🟠",
      precaucion: "🟡",
      estable: "🟢",
      positivo: "✨"
    };
    return emojis[estado] || "🎮";
  };

  const getEstadoMensaje = (estado) => {
    const mensajes = {
      critico: "Tu estado es crítico. Estos juegos te ayudarán a calmarte.",
      alerta: "Estás en alerta. Relájate con estos juegos terapéuticos.",
      precaucion: "Tu estado requiere atención. Prueba estos juegos.",
      estable: "Tu estado es estable. Mantente así jugando.",
      positivo: "¡Excelente! Sigue mejorando con estos juegos."
    };
    return mensajes[estado] || "Juegos recomendados para ti";
  };

  // Función para obtener el icono según el tipo de juego
  const getJuegoIcono = (tipoJuego) => {
    const iconos = {
      respiracion: "🫁",
      mindfulness: "🧘",
      puzzle: "🧩",
      memoria: "🧠",
      mandala: "🎨",
      relajacion: "😌",
      default: "🎮"
    };
    return iconos[tipoJuego] || iconos.default;
  };

  // Función para formatear el tipo de juego para mostrar
  const formatearTipoJuego = (tipoJuego) => {
    if (!tipoJuego) return "Juego";
    return tipoJuego.charAt(0).toUpperCase() + tipoJuego.slice(1);
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", paddingTop: 100 }}>
        <div style={{ fontSize: "4rem" }}>⏳</div>
        <h2>Cargando juegos recomendados...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: "center", paddingTop: 100 }}>
        <div style={{ fontSize: "4rem" }}>❌</div>
        <h2>Error</h2>
        <p style={{ color: "red", marginBottom: 20 }}>{error}</p>
        <button className="auth-button" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="juego-recomendado-content page-content">
      <PageCard size="xl">
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

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ fontSize: "5rem", marginBottom: 10 }}>
            {getEstadoEmoji(estadoEmocional)}
          </div>
          <h1>Juegos Recomendados</h1>
          <p style={{ fontSize: "1.1rem", color: "#666" }}>
            {getEstadoMensaje(estadoEmocional)}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setShowHistory(false)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              !showHistory ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🎮 Jugar
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              showHistory ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📜 Historial
          </button>
        </div>

        {/* Contenido */}
        {!showHistory ? (
          juegos.length === 0 ? (
            <div style={{ textAlign: "center", padding: 50 }}>
              <div style={{ fontSize: "4rem" }}>🎮</div>
              <h2>No hay juegos disponibles</h2>
              <p>No encontramos juegos para tu estado: {estadoEmocional}</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
              marginTop: 30
            }}>
              {juegos.map((juego) => (
                <div
                  key={juego.id}
                  style={{
                    border: "2px solid #ddd",
                    borderRadius: 12,
                    padding: 20,
                    textAlign: "center",
                    background: "white",
                    transition: "all 0.3s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onClick={() => {
                    navigate(`/juego/${juego.id}`, {
                      state: { juego, estadoAntes: estadoEmocional }
                    });
                  }}
                >
                  {/* Icono del juego */}
                  <div style={{ fontSize: "4rem", marginBottom: 10 }}>
                    {getJuegoIcono(juego.tipo_juego)}
                  </div>

                  {/* Nombre del juego */}
                  <h3 style={{ marginBottom: 10 }}>{juego.nombre}</h3>

                  {/* Descripción */}
                  <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: 15 }}>
                    {juego.descripcion || "Juego terapéutico"}
                  </p>

                  {/* Tags informativos */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 15, flexWrap: "wrap" }}>
                    {/* Duración */}
                    {juego.duracion_minutos && (
                      <span style={{
                        background: "#e3f2fd",
                        color: "#1976d2",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.85rem"
                      }}>
                        ⏱️ {juego.duracion_minutos} min
                      </span>
                    )}

                    {/* Tipo de juego */}
                    {juego.tipo_juego && (
                      <span style={{
                        background: "#f3e5f5",
                        color: "#7b1fa2",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.85rem"
                      }}>
                        🎯 {formatearTipoJuego(juego.tipo_juego)}
                      </span>
                    )}

                    {/* Dificultad */}
                    {juego.dificultad && (
                      <span style={{
                        background: "#fff3e0",
                        color: "#f57c00",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.85rem"
                      }}>
                        ⭐ {formatearTipoJuego(juego.dificultad)}
                      </span>
                    )}
                  </div>

                  {/* Botón de acción */}
                  <button
                    className="auth-button"
                    style={{ width: "100%", background: "var(--color-primary)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/juego/${juego.id}`, {
                        state: { juego, estadoAntes: estadoEmocional }
                      });
                    }}
                  >
                    🎮 Jugar Ahora
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          <GameHistory />
        )}

        {/* Botón para volver */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button
            className="auth-button"
            style={{ background: "#6c757d" }}
            onClick={() => navigate(-1)}
          >
            ← Volver al análisis
          </button>
        </div>
      </PageCard>
    </div>
  );
};

export default JuegoRecomendado;