// src/components/Juegos/JuegoMemoria.jsx
import React, { useState, useEffect } from "react";
import "../../styles/Juegos.css";

const JuegoMemoria = ({ juego, onFinish, onExit }) => {
  const [cartas, setCartas] = useState([]);
  const [cartasVolteadas, setCartasVolteadas] = useState([]);
  const [cartasEmparejadas, setCartasEmparejadas] = useState([]);
  const [movimientos, setMovimientos] = useState(0);
  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [juegoCompletado, setJuegoCompletado] = useState(false);

  const emojis = ["😊", "❤️", "🌟", "🌈", "🦋", "🌸", "🎵", "☀️"];

  useEffect(() => {
    if (juegoIniciado && cartasEmparejadas.length === cartas.length && cartas.length > 0) {
      setJuegoCompletado(true);
    }
  }, [juegoIniciado, cartasEmparejadas, cartas]);

  const iniciarJuego = () => {
    // Crear pares de cartas
    const paresCartas = emojis.flatMap((emoji, index) => [
      { id: index * 2, emoji, emparejada: false },
      { id: index * 2 + 1, emoji, emparejada: false }
    ]);

    // Mezclar cartas
    const cartasMezcladas = paresCartas.sort(() => Math.random() - 0.5);
    setCartas(cartasMezcladas);
    setCartasVolteadas([]);
    setCartasEmparejadas([]);
    setMovimientos(0);
    setJuegoIniciado(true);
    setJuegoCompletado(false);
  };

  const voltearCarta = (id) => {
    // No permitir voltear más de 2 cartas o cartas ya emparejadas
    if (cartasVolteadas.length === 2 || cartasEmparejadas.includes(id)) return;
    if (cartasVolteadas.includes(id)) return;

    const nuevasVolteadas = [...cartasVolteadas, id];
    setCartasVolteadas(nuevasVolteadas);

    if (nuevasVolteadas.length === 2) {
      setMovimientos(movimientos + 1);

      const [id1, id2] = nuevasVolteadas;
      const carta1 = cartas.find(c => c.id === id1);
      const carta2 = cartas.find(c => c.id === id2);

      if (carta1.emoji === carta2.emoji) {
        // Emparejadas!
        setTimeout(() => {
          setCartasEmparejadas([...cartasEmparejadas, id1, id2]);
          setCartasVolteadas([]);
        }, 500);
      } else {
        // No coinciden
        setTimeout(() => {
          setCartasVolteadas([]);
        }, 1000);
      }
    }
  };

  const calcularPuntuacion = () => {
    const movimientosOptimos = cartas.length / 2;
    const puntuacion = Math.max(0, 100 - (movimientos - movimientosOptimos) * 5);
    return Math.round(puntuacion);
  };

  if (juegoCompletado) {
    const puntuacion = calcularPuntuacion();

    return (
      <div className="juego-container size-sm">
        <div className="juego-completado">
          <div className="completado-emoji">🎉</div>
          <h1>¡Felicitaciones!</h1>
          <p className="completado-mensaje">
            Completaste el juego en {movimientos} movimientos
          </p>
          <div className="completado-puntos">
            {puntuacion} puntos
          </div>
          <div className="juego-buttons">
            <button
              className="juego-btn juego-btn-success"
              onClick={iniciarJuego}
            >
              🔄 Jugar de nuevo
            </button>
            <button
              className="juego-btn juego-btn-info"
              onClick={() => onFinish(puntuacion, true)}
            >
              ✅ Finalizar
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
        <div className="juego-emoji">🧠</div>
        <h1>{juego.nombre}</h1>
        <p>{juego.descripcion}</p>
      </div>

      {!juegoIniciado ? (
        // Pantalla inicial
        <div style={{ textAlign: "center" }}>
          <div className="juego-instrucciones">
            <h2>📋 Cómo jugar</h2>
            <ul>
              <li>🃏 Voltea dos cartas en cada turno</li>
              <li>🎯 Encuentra todos los pares de emojis</li>
              <li>🧠 Usa tu memoria para recordar las posiciones</li>
              <li>⭐ Menos movimientos = Más puntos</li>
            </ul>
          </div>
          <button
            className="juego-btn juego-btn-success juego-btn-large"
            onClick={iniciarJuego}
          >
            ▶️ Comenzar Juego
          </button>
        </div>
      ) : (
        <>
          {/* Panel de información */}
          <div className="juego-stats">
            <div className="stat-item">
              <div className="stat-emoji">🎯</div>
              <div className="stat-value">{movimientos}</div>
              <div className="stat-label">Movimientos</div>
            </div>
            <div className="stat-item">
              <div className="stat-emoji">✅</div>
              <div className="stat-value">
                {cartasEmparejadas.length / 2}/{cartas.length / 2}
              </div>
              <div className="stat-label">Pares encontrados</div>
            </div>
          </div>

          {/* Grid de cartas */}
          <div className="juego-card-grid">
            {cartas.map((carta) => {
              const volteada = cartasVolteadas.includes(carta.id) || cartasEmparejadas.includes(carta.id);
              const emparejada = cartasEmparejadas.includes(carta.id);

              return (
                <div
                  key={carta.id}
                  onClick={() => !volteada && voltearCarta(carta.id)}
                  className={`juego-card ${
                    volteada 
                      ? (emparejada ? 'card-matched' : 'card-revealed')
                      : 'card-hidden'
                  }`}
                  style={{
                    cursor: volteada ? "default" : "pointer",
                    transform: volteada ? "rotateY(0)" : "rotateY(180deg)",
                  }}
                >
                  {volteada ? carta.emoji : "?"}
                </div>
              );
            })}
          </div>

          {/* Botones */}
          <div className="juego-buttons">
            <button
              className="juego-btn juego-btn-warning"
              onClick={iniciarJuego}
            >
              🔄 Reiniciar
            </button>
            <button
              className="juego-btn juego-btn-secondary"
              onClick={onExit}
            >
              ⏸️ Salir
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default JuegoMemoria;