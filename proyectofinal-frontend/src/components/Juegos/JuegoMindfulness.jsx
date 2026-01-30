// src/components/Juegos/JuegoMindfulness.jsx
import React, { useState, useEffect, useMemo } from "react";
import "../../styles/Juegos.css";

const JuegoMindfulness = ({ juego, onFinish, onExit }) => {
  const [jardin, setJardin] = useState([]);
  const [plantaSeleccionada, setPlantaSeleccionada] = useState(null);
  const [agua, setAgua] = useState(100);
  const [sol, setSol] = useState(100);
  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [tiempoInicio, setTiempoInicio] = useState(null);
  const [segundos, setSegundos] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [nivelJardin, setNivelJardin] = useState(1);

  const plantas = useMemo(() => [
    { id: "flor1", emoji: "🌸", nombre: "Flor de Cerezo", costo: { agua: 10, sol: 15 }, puntos: 10 },
    { id: "flor2", emoji: "🌺", nombre: "Hibisco", costo: { agua: 15, sol: 10 }, puntos: 15 },
    { id: "flor3", emoji: "🌻", nombre: "Girasol", costo: { agua: 20, sol: 25 }, puntos: 20 },
    { id: "flor4", emoji: "🌷", nombre: "Tulipán", costo: { agua: 12, sol: 12 }, puntos: 12 },
    { id: "arbol1", emoji: "🌳", nombre: "Árbol", costo: { agua: 30, sol: 30 }, puntos: 30 },
    { id: "arbol2", emoji: "🌲", nombre: "Pino", costo: { agua: 25, sol: 35 }, puntos: 25 },
    { id: "cactus", emoji: "🌵", nombre: "Cactus", costo: { agua: 5, sol: 40 }, puntos: 15 },
    { id: "hongo", emoji: "🍄", nombre: "Hongo Mágico", costo: { agua: 8, sol: 5 }, puntos: 8 }
  ], []);

  const _decoraciones = [
    { id: "mariposa", emoji: "🦋", nombre: "Mariposa" },
    { id: "abeja", emoji: "🐝", nombre: "Abeja" },
    { id: "piedra", emoji: "🪨", nombre: "Piedra" },
    { id: "fuente", emoji: "⛲", nombre: "Fuente" }
  ];

  useEffect(() => {
    if (juegoIniciado && tiempoInicio) {
      const timer = setInterval(() => {
        const secs = Math.floor((Date.now() - tiempoInicio) / 1000);
        setSegundos(secs);

        // Recuperar recursos cada 5 segundos
        if (secs % 5 === 0) {
          setAgua(prev => Math.min(100, prev + 5));
          setSol(prev => Math.min(100, prev + 5));
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [juegoIniciado, tiempoInicio]);

  useEffect(() => {
    // Calcular nivel del jardín basado en puntos
    const puntosTotales = jardin.reduce((acc, item) => {
      const planta = plantas.find(p => p.id === item.tipo);
      return acc + (planta?.puntos || 0);
    }, 0);
    
    const nuevoNivel = Math.floor(puntosTotales / 50) + 1;
    if (nuevoNivel > nivelJardin) {
      setNivelJardin(nuevoNivel);
      mostrarMensaje(`¡Nivel ${nuevoNivel} alcanzado! 🎉`);
    }
  }, [jardin, nivelJardin, plantas]);

  const iniciarJuego = () => {
    setJuegoIniciado(true);
    setTiempoInicio(Date.now());
    setJardin([]);
    setAgua(100);
    setSol(100);
    mostrarMensaje("¡Bienvenido a tu jardín de mindfulness! 🌱");
  };

  const mostrarMensaje = (msg) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(""), 3000);
  };

  const plantarPlanta = (planta) => {
    if (agua < planta.costo.agua || sol < planta.costo.sol) {
      mostrarMensaje("⚠️ No tienes suficientes recursos");
      return;
    }

    const nuevaPlanta = {
      id: Date.now(),
      tipo: planta.id,
      emoji: planta.emoji,
      nombre: planta.nombre,
      posX: Math.random() * 70 + 10, // 10-80%
      posY: Math.random() * 60 + 20, // 20-80%
      tamaño: 1,
      edad: 0
    };

    setJardin([...jardin, nuevaPlanta]);
    setAgua(agua - planta.costo.agua);
    setSol(sol - planta.costo.sol);
    mostrarMensaje(`${planta.emoji} ${planta.nombre} plantado!`);
  };

  const regarPlanta = (plantaId) => {
    if (agua < 5) {
      mostrarMensaje("⚠️ No tienes suficiente agua");
      return;
    }

    setJardin(jardin.map(p => 
      p.id === plantaId 
        ? { ...p, tamaño: Math.min(2, p.tamaño + 0.2), edad: p.edad + 1 }
        : p
    ));
    setAgua(agua - 5);
    mostrarMensaje("💧 Planta regada");
  };

  const eliminarPlanta = (plantaId) => {
    setJardin(jardin.filter(p => p.id !== plantaId));
    mostrarMensaje("🗑️ Planta eliminada");
  };

  const calcularPuntuacion = () => {
    const puntosPlantas = jardin.reduce((acc, item) => {
      const planta = plantas.find(p => p.id === item.tipo);
      return acc + (planta?.puntos || 0) * item.tamaño;
    }, 0);
    
    return Math.round(puntosPlantas + nivelJardin * 10);
  };

  const formatearTiempo = (segs) => {
    const mins = Math.floor(segs / 60);
    const secs = segs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!juegoIniciado) {
    return (
      <div className="juego-container size-xl">
        <div className="juego-header">
          <span className="juego-emoji">🧘</span>
          <h1>{juego.nombre}</h1>
          <p className="juego-descripcion">{juego.descripcion}</p>
        </div>

        <div className="juego-instrucciones juego-garden-theme">
          <h2 style={{ textAlign: "center", marginBottom: 20 }}>🌱 Cultiva la Calma Interior</h2>
          <ul style={{ 
            textAlign: "left", 
            maxWidth: 500, 
            margin: "0 auto",
            lineHeight: "2",
            fontSize: "1.1rem"
          }}>
            <li>🌸 Planta flores y árboles en tu jardín virtual</li>
            <li>💧 Riega tus plantas con atención plena</li>
            <li>☀️ Observa cómo crecen con el tiempo</li>
            <li>🦋 Descubre decoraciones especiales</li>
            <li>😌 Relájate mientras cuidas tu jardín</li>
          </ul>
        </div>

        <div className="juego-actions">
          <button
            className="juego-btn juego-btn-success juego-btn-lg"
            onClick={iniciarJuego}
          >
            🌱 Crear Mi Jardín
          </button>
          <button className="juego-btn juego-btn-secondary" onClick={onExit}>
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="juego-container size-xl">
      {/* Header con estadísticas */}
      <div className="juego-garden-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: 0 }}>Mi Jardín Zen 💧</h2>
            <p style={{ margin: "5px 0 0 0" }}>Nivel {nivelJardin} • ⏱️ {formatearTiempo(segundos)}</p>
          </div>
          <div className="juego-garden-stats">
            <div className="juego-garden-stat">
              <div className="stat-emoji">💧</div>
              <div className="stat-value">{agua}%</div>
            </div>
            <div className="juego-garden-stat">
              <div className="stat-emoji">☀️</div>
              <div className="stat-value">{sol}%</div>
            </div>
            <div className="juego-garden-stat">
              <div className="stat-emoji">🌱</div>
              <div className="stat-value">{jardin.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje flotante */}
      {mensaje && (
        <div className="juego-garden-message">
          {mensaje}
        </div>
      )}

      {/* Área del jardín - Full width */}
      <div className="juego-garden-area" style={{ width: "100%", height: "400px", marginBottom: "1rem" }}>
        {/* Suelo */}
        <div className="juego-garden-ground" />

        {/* Césped */}
        <div className="juego-garden-grass" />

        {/* Plantas plantadas */}
        {jardin.map((planta) => (
          <div
            key={planta.id}
            onClick={() => setPlantaSeleccionada(planta)}
            className={`juego-garden-plant ${plantaSeleccionada?.id === planta.id ? 'selected' : ''}`}
            style={{
              left: `${planta.posX}%`,
              top: `${planta.posY}%`,
              fontSize: `${2 + planta.tamaño * 2}rem`,
            }}
          >
            {planta.emoji}
          </div>
        ))}

        {/* Decoraciones fijas */}
        <div className="juego-garden-decor" style={{ bottom: "35%", left: "10%" }}>☁️</div>
        <div className="juego-garden-decor" style={{ bottom: "40%", right: "15%" }}>☁️</div>
        <div className="juego-garden-decor juego-garden-sun" style={{ top: "10%", right: "10%" }}>☀️</div>
      </div>

      {/* Panel de planta seleccionada */}
      {plantaSeleccionada && (
        <div className="juego-garden-selected-panel" style={{ marginBottom: "1rem" }}>
          <div className="selected-plant-info">
            <span className="plant-emoji">{plantaSeleccionada.emoji}</span>
            <strong>{plantaSeleccionada.nombre}</strong>
            <span className="plant-size">
              Tamaño: {plantaSeleccionada.tamaño.toFixed(1)}x
            </span>
              </div>
              <div className="selected-plant-actions">
                <button
                  className="juego-btn juego-btn-primary"
                  onClick={() => regarPlanta(plantaSeleccionada.id)}
                >
                  💧 Regar
                </button>
                <button
                  className="juego-btn juego-btn-danger"
                  onClick={() => {
                    eliminarPlanta(plantaSeleccionada.id);
                    setPlantaSeleccionada(null);
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          )}

      {/* Plantas Disponibles - Grid horizontal */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--color-text-main)" }}>🌱 Plantas Disponibles</h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", 
          gap: "0.75rem" 
        }}>
          {plantas.map((planta) => {
            const puedeComprarse = agua >= planta.costo.agua && sol >= planta.costo.sol;
            
            return (
              <div
                key={planta.id}
                onClick={() => puedeComprarse && plantarPlanta(planta)}
                className={`juego-garden-plant-card ${puedeComprarse ? 'available' : 'unavailable'}`}
                style={{ marginBottom: 0 }}
              >
                <div className="plant-card-content">
                  <span className="plant-card-emoji">{planta.emoji}</span>
                  <div className="plant-card-info">
                    <div className="plant-card-name">{planta.nombre}</div>
                    <div className="plant-card-cost">
                      💧 {planta.costo.agua} • ☀️ {planta.costo.sol}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botones de acción */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          className="juego-btn juego-btn-success juego-btn-lg"
          onClick={() => onFinish(calcularPuntuacion(), jardin.length > 5)}
        >
          ✅ Guardar Jardín ({calcularPuntuacion()} pts)
        </button>
        <button
          className="juego-btn juego-btn-secondary"
          onClick={onExit}
        >
          ⏸️ Salir
        </button>
      </div>

      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default JuegoMindfulness;