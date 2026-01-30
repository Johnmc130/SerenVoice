// src/components/Juegos/JuegoPuzzle.jsx
import React, { useState, useEffect, useCallback } from "react";
import "../../styles/Juegos.css";

const JuegoPuzzle = ({ juego, onFinish, onExit }) => {
  const [piezas, setPiezas] = useState([]);
  const [movimientos, setMovimientos] = useState(0);
  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [juegoCompletado, setJuegoCompletado] = useState(false);
  const [tiempoInicio, setTiempoInicio] = useState(null);
  const [segundos, setSegundos] = useState(0);

  const TAMANO = 3; // Puzzle 3x3
  const TOTAL_PIEZAS = TAMANO * TAMANO;

  useEffect(() => {
    if (juegoIniciado && !juegoCompletado) {
      const timer = setInterval(() => {
        setSegundos(Math.floor((Date.now() - tiempoInicio) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [juegoIniciado, juegoCompletado, tiempoInicio]);

  const estaResuelto = useCallback(() => {
    if (piezas.length === 0) return false;
    for (let i = 0; i < piezas.length - 1; i++) {
      if (piezas[i] !== i + 1) return false;
    }
    return piezas[piezas.length - 1] === 0;
  }, [piezas]);

  useEffect(() => {
    if (juegoIniciado && estaResuelto()) {
      setJuegoCompletado(true);
    }
  }, [juegoIniciado, estaResuelto]);

  const iniciarJuego = () => {
    // Crear array de números del 1 al 8, y un 0 para el espacio vacío
    let numeros = Array.from({ length: TOTAL_PIEZAS - 1 }, (_, i) => i + 1);
    numeros.push(0); // 0 representa el espacio vacío

    // Mezclar
    for (let i = 0; i < 100; i++) {
      numeros = moverAleatorio(numeros);
    }

    setPiezas(numeros);
    setMovimientos(0);
    setJuegoIniciado(true);
    setJuegoCompletado(false);
    setTiempoInicio(Date.now());
    setSegundos(0);
  };

  const moverAleatorio = (arr) => {
    const posVacio = arr.indexOf(0);
    const vecinos = obtenerVecinos(posVacio);
    const posAleatorio = vecinos[Math.floor(Math.random() * vecinos.length)];
    return moverPieza(arr, posAleatorio);
  };

  const obtenerVecinos = (pos) => {
    const vecinos = [];
    const fila = Math.floor(pos / TAMANO);
    const col = pos % TAMANO;

    if (fila > 0) vecinos.push(pos - TAMANO); // Arriba
    if (fila < TAMANO - 1) vecinos.push(pos + TAMANO); // Abajo
    if (col > 0) vecinos.push(pos - 1); // Izquierda
    if (col < TAMANO - 1) vecinos.push(pos + 1); // Derecha

    return vecinos;
  };

  const moverPieza = (arr, pos) => {
    const nuevoArr = [...arr];
    const posVacio = arr.indexOf(0);
    [nuevoArr[pos], nuevoArr[posVacio]] = [nuevoArr[posVacio], nuevoArr[pos]];
    return nuevoArr;
  };

  const handleClick = (pos) => {
    const posVacio = piezas.indexOf(0);
    const vecinos = obtenerVecinos(posVacio);

    if (vecinos.includes(pos)) {
      setPiezas(moverPieza(piezas, pos));
      setMovimientos(movimientos + 1);
    }
  };



  const calcularPuntuacion = () => {
    const movimientosOptimos = 20;
    const tiempoOptimo = 60; // segundos
    
    let puntos = 100;
    puntos -= Math.max(0, (movimientos - movimientosOptimos) * 2);
    puntos -= Math.max(0, (segundos - tiempoOptimo) * 0.5);
    
    return Math.max(0, Math.round(puntos));
  };

  const formatearTiempo = (segs) => {
    const mins = Math.floor(segs / 60);
    const secs = segs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (juegoCompletado) {
    const puntuacion = calcularPuntuacion();

    return (
      <div className="juego-container size-xl">
        <div className="juego-completado">
          <div className="completado-emoji">🎉</div>
          <h1>¡Puzzle Resuelto!</h1>
          <div className="juego-stats">
            <div className="stat-item">
              <div className="stat-emoji">⏱️</div>
              <div className="stat-value">{formatearTiempo(segundos)}</div>
              <div className="stat-label">Tiempo</div>
            </div>
            <div className="stat-item">
              <div className="stat-emoji">🎯</div>
              <div className="stat-value">{movimientos}</div>
              <div className="stat-label">Movimientos</div>
            </div>
          </div>
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
      <div className="juego-header">
        <div className="juego-emoji">🧩</div>
        <h1>{juego.nombre}</h1>
        <p>{juego.descripcion}</p>
      </div>

      {!juegoIniciado ? (
        <div style={{ textAlign: "center" }}>
          <div className="juego-instrucciones">
            <h2>📋 Cómo jugar</h2>
            <ul>
              <li>🔢 Ordena los números del 1 al 8</li>
              <li>🖱️ Haz clic en las piezas junto al espacio vacío</li>
              <li>🎯 El objetivo es ordenarlos en secuencia</li>
              <li>⏱️ Hazlo en el menor tiempo posible</li>
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
          {/* Stats */}
          <div className="juego-stats">
            <div className="stat-item">
              <div className="stat-emoji">⏱️</div>
              <div className="stat-value">{formatearTiempo(segundos)}</div>
              <div className="stat-label">Tiempo</div>
            </div>
            <div className="stat-item">
              <div className="stat-emoji">🎯</div>
              <div className="stat-value">{movimientos}</div>
              <div className="stat-label">Movimientos</div>
            </div>
          </div>

          {/* Grid del puzzle */}
          <div className="juego-puzzle-grid">
            {piezas.map((numero, index) => {
              const esVacio = numero === 0;
              const vecinos = obtenerVecinos(piezas.indexOf(0));
              const estaEnPosicionCorrecta = numero === index + 1 || (numero === 0 && index === TOTAL_PIEZAS - 1);
              const esMovible = vecinos.includes(index);

              return (
                <div
                  key={index}
                  onClick={() => !esVacio && handleClick(index)}
                  className={`juego-puzzle-tile ${
                    esVacio 
                      ? 'tile-empty' 
                      : estaEnPosicionCorrecta 
                        ? 'tile-correct'
                        : 'tile-filled'
                  }`}
                  style={{
                    cursor: esVacio ? "default" : esMovible ? "pointer" : "not-allowed",
                  }}
                >
                  {esVacio ? "" : numero}
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

export default JuegoPuzzle;