// src/components/Juegos/JuegoMandala.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import "../../styles/Juegos.css";
import ConfirmDialog from "../Shared/ConfirmDialog";

const JuegoMandala = ({ juego, onFinish, onExit }) => {
  const canvasRef = useRef(null);
  const [colorActual, setColorActual] = useState("#FF6B9D");
  const [dibujando, setDibujando] = useState(false);
  const [grosorLinea, setGrosorLinea] = useState(3);
  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [mandalaSeleccionado, setMandalaSeleccionado] = useState(null);
  const [porcentajeCompletado, setPorcentajeCompletado] = useState(0);
  const [tiempoInicio, setTiempoInicio] = useState(null);
  const [segundos, setSegundos] = useState(0);
  
  // Estado para ConfirmDialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    confirmText: "Confirmar",
    onConfirm: () => {}
  });
  const paleta = [
    "#FF6B9D", "#C44569", "#F8B500", "#FFA801",
    "#4ECDC4", "#44A08D", "#6C5CE7", "#A29BFE",
    "#00B894", "#00D2D3", "#FD79A8", "#FDCB6E",
    "#74B9FF", "#A29BFE", "#FF7675", "#FFFFFF"
  ];

  const mandalas = [
    {
      id: 1,
      nombre: "Flor de Loto",
      svg: `M250,250 m-150,0 a150,150 0 1,0 300,0 a150,150 0 1,0 -300,0
            M250,250 m-100,0 a100,100 0 1,0 200,0 a100,100 0 1,0 -200,0
            M250,250 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0
            M250,100 Q250,150 200,200 Q150,250 100,250 Q150,250 200,300 Q250,350 250,400 Q250,350 300,300 Q350,250 400,250 Q350,250 300,200 Q250,150 250,100`
    },
    {
      id: 2,
      nombre: "Estrella Sagrada",
      svg: `M250,250 L250,100 L280,180 L360,180 L300,230 L320,310 L250,260 L180,310 L200,230 L140,180 L220,180 Z
            M250,250 m-120,0 a120,120 0 1,0 240,0 a120,120 0 1,0 -240,0
            M250,250 m-80,0 a80,80 0 1,0 160,0 a80,80 0 1,0 -160,0`
    },
    {
      id: 3,
      nombre: "Círculos Zen",
      svg: `M250,250 m-180,0 a180,180 0 1,0 360,0 a180,180 0 1,0 -360,0
            M250,250 m-140,0 a140,140 0 1,0 280,0 a140,140 0 1,0 -280,0
            M250,250 m-100,0 a100,100 0 1,0 200,0 a100,100 0 1,0 -200,0
            M250,250 m-60,0 a60,60 0 1,0 120,0 a60,60 0 1,0 -120,0
            M250,250 m-20,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0`
    }
  ];

  useEffect(() => {
    if (juegoIniciado && tiempoInicio) {
      const timer = setInterval(() => {
        setSegundos(Math.floor((Date.now() - tiempoInicio) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [juegoIniciado, tiempoInicio]);

  const iniciarJuego = (mandala) => {
    setMandalaSeleccionado(mandala);
    setJuegoIniciado(true);
    setTiempoInicio(Date.now());
    setPorcentajeCompletado(0);
  };

  const dibujarMandala = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mandalaSeleccionado) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo blanco
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar el mandala con líneas grises suaves
    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const path = new Path2D(mandalaSeleccionado.svg);
    ctx.stroke(path);
  }, [mandalaSeleccionado]);

  useEffect(() => {
    if (canvasRef.current) {
      dibujarMandala();
    }
  }, [dibujarMandala]);

  const obtenerPosicionMouse = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const obtenerPosicionTouch = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  };

  const iniciarDibujo = (e) => {
    e.preventDefault();
    setDibujando(true);
    const pos = e.touches ? obtenerPosicionTouch(e) : obtenerPosicionMouse(e);
    
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const dibujar = (e) => {
    if (!dibujando) return;
    e.preventDefault();

    const pos = e.touches ? obtenerPosicionTouch(e) : obtenerPosicionMouse(e);
    const ctx = canvasRef.current.getContext("2d");

    ctx.strokeStyle = colorActual;
    ctx.lineWidth = grosorLinea;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    // Calcular porcentaje aproximado
    calcularProgreso();
  };

  const terminarDibujo = () => {
    setDibujando(false);
  };

  const calcularProgreso = () => {
    const ctx = canvasRef.current.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const data = imageData.data;

    let pixelesColoreados = 0;
    let totalPixeles = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Contar solo píxeles que no son blancos
      if (a > 0 && !(r > 250 && g > 250 && b > 250)) {
        pixelesColoreados++;
      }
      totalPixeles++;
    }

    const porcentaje = Math.min(100, (pixelesColoreados / totalPixeles) * 100 * 20);
    setPorcentajeCompletado(Math.round(porcentaje));
  };

  const limpiarCanvas = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Limpiar Canvas",
      message: "¿Quieres borrar todo y empezar de nuevo? Se perderá tu progreso actual.",
      type: "warning",
      confirmText: "Borrar Todo",
      onConfirm: () => {
        dibujarMandala();
        setPorcentajeCompletado(0);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const finalizarJuego = () => {
    const puntuacion = Math.min(100, porcentajeCompletado + (segundos < 300 ? 20 : 0));
    onFinish(puntuacion, porcentajeCompletado > 50);
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
          <div className="juego-emoji">🎨</div>
          <h1>{juego.nombre}</h1>
          <p>{juego.descripcion}</p>
        </div>

        <div className="juego-instrucciones">
          <h2>📋 Beneficios del Mandala</h2>
          <ul>
            <li>🧘 Reduce el estrés y la ansiedad</li>
            <li>🎨 Estimula la creatividad</li>
            <li>💭 Mejora la concentración</li>
            <li>😌 Promueve la relajación profunda</li>
          </ul>
        </div>

        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Elige tu Mandala</h2>

        <div className="juego-mandala-selection">
          {mandalas.map((mandala) => (
            <div
              key={mandala.id}
              onClick={() => iniciarJuego(mandala)}
              className="juego-mandala-item"
            >
              <svg width="150" height="150" viewBox="0 0 500 500">
                <path d={mandala.svg} fill="none" stroke="var(--color-text-secondary)" strokeWidth="3" />
              </svg>
              <h3>{mandala.nombre}</h3>
              <button
                className="juego-btn juego-btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  iniciarJuego(mandala);
                }}
              >
                Colorear
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button className="juego-btn juego-btn-secondary" onClick={onExit}>
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="juego-container size-xl">
      <div className="juego-mandala-layout">
        {/* Canvas de dibujo */}
        <div className="juego-mandala-canvas-container">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            onMouseDown={iniciarDibujo}
            onMouseMove={dibujar}
            onMouseUp={terminarDibujo}
            onMouseLeave={terminarDibujo}
            onTouchStart={iniciarDibujo}
            onTouchMove={dibujar}
            onTouchEnd={terminarDibujo}
            className="juego-mandala-canvas"
          />
        </div>

        {/* Panel de controles */}
        <div className="juego-mandala-panel">
          <div className="juego-mandala-header">
            <h2>{mandalaSeleccionado.nombre}</h2>
            <div className="mandala-stats">
              <span>⏱️ {formatearTiempo(segundos)}</span>
              <span>🎨 {porcentajeCompletado}% completado</span>
            </div>
            <div className="juego-progress">
              <div 
                className="progress-fill"
                style={{ width: `${porcentajeCompletado}%` }}
              />
            </div>
          </div>

          {/* Paleta de colores */}
          <div className="juego-mandala-colors">
            <h3>🎨 Colores</h3>
            <div className="juego-color-palette">
              {paleta.map((color) => (
                <div
                  key={color}
                  onClick={() => setColorActual(color)}
                  className={`juego-color-swatch ${colorActual === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Grosor del pincel */}
          <div className="juego-mandala-brush">
            <h3>✏️ Grosor del Pincel</h3>
            <input
              type="range"
              min="1"
              max="10"
              value={grosorLinea}
              onChange={(e) => setGrosorLinea(Number(e.target.value))}
              className="brush-slider"
            />
            <div className="brush-size">{grosorLinea}px</div>
          </div>

          {/* Botones de acción */}
          <div className="juego-mandala-actions">
            <button
              className="juego-btn juego-btn-success"
              onClick={finalizarJuego}
            >
              ✅ Guardar y Finalizar
            </button>
            <button
              className="juego-btn juego-btn-warning"
              onClick={limpiarCanvas}
            >
              🔄 Limpiar
            </button>
            <button
              className="juego-btn juego-btn-secondary"
              onClick={onExit}
            >
              ⏸️ Salir
            </button>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
      />
    </div>
  );
};

export default JuegoMandala;