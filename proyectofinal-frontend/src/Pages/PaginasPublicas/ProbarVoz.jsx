// src/Pages/PaginasPublicas/ProbarVoz.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import NavbarPublic from "../../components/Publico/NavbarPublic";
import AudioPlayer from "../../components/Publico/AudioPlayer";
import "../../global.css";
import Spinner from "../../components/Publico/Spinner";
import { ThemeContext } from "../../context/themeContextDef";
import PaisajeClaro from "../../assets/PaisajeClaro.svg";
import PaisajeOscuro from "../../assets/PaisajeOscuro.svg";
import {
  FaMicrophone,
  FaStop,
  FaPlay,
  FaDownload,
  FaWaveSquare,
  FaExclamationTriangle,
  FaHeartbeat,
  FaSmile,
  FaAngry,
  FaSadCry,
  FaSadTear,
  FaBrain,
  FaMeh,
  FaFrownOpen,
  FaSurprise,
  FaChartLine,
  FaUserPlus,
  FaLock,
  FaUser,
  FaArrowRight,
  FaGamepad,
  FaUsers,
  FaLightbulb,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import apiClient from '../../services/apiClient';
import api from '../../config/api';

const ProbarVoz = () => {
  const navigate = useNavigate();
  const { isDark } = useContext(ThemeContext);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaSupported, setMediaSupported] = useState(true);
  const [audioURL, setAudioURL] = useState(null);
  const mediaChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const [recTime, setRecTime] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  // Pasajes para LECTURA EN VOZ ALTA (el usuario solo los lee)
  const phrases = [
    "En un día soleado caminé por un sendero lleno de hojas crujientes, respiré profundamente y observé cómo la luz jugaba entre las ramas, sintiendo la calma recorrer mi cuerpo mientras avanzaba paso a paso.",
    "Había una pequeña cafetería en la esquina donde el aroma del café recién hecho llenaba el aire y la gente conversaba en voz baja, una escena cotidiana que invitaba a quedarse y escuchar el murmullo de la ciudad.",
    "El río corría pausado junto al puente, reflejando el cielo y las nubes que pasaban lentamente, mientras una brisa suave traía recuerdos de otras tardes similares que ahora parecían memorias cálidas.",
    "Una mañana comencé a ordenar mi escritorio, encontré notas antiguas y pequeñas fotos, recordé sonrisas y conversaciones y me detuve un momento para sonreír sin razón antes de seguir con el día.",
    "Caminé por la playa sintiendo la arena fría bajo los pies, vi las olas romper en la orilla y dejé que el sonido rítmico del mar me llevara siguiendo la respiración hasta relajar mi cuerpo por completo.",
    "En un jardín florecido observé los colores y los insectos trabajando, pensé en las pequeñas cosas que pasan desapercibidas y en cómo cada detalle forma parte de una escena tranquila y agradable."
  ];
  const [suggestedPhrase, setSuggestedPhrase] = useState("");

  useEffect(() => {
    setSuggestedPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Verificar soporte de micrófono
  useEffect(() => {
    const checkMediaSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMediaSupported(false);
        setError("Tu navegador no soporta la grabación de audio. Usa Chrome, Firefox o Edge.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setMediaSupported(true);
        setError(null);
      } catch (err) {
        console.error("Error de permisos:", err);
        setMediaSupported(false);
        setError(
          err.name === "NotAllowedError"
            ? "Debes permitir el acceso al micrófono."
            : "Error al acceder al micrófono: " + err.message
        );
      }
    };
    checkMediaSupport();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Temporizador
  const startTimer = () => {
    setRecTime(0);
    timerRef.current = setInterval(() => setRecTime((t) => t + 1), 1000);
  };
  const stopTimer = () => timerRef.current && clearInterval(timerRef.current);

  // Grabación
  const handleStart = async () => {
    if (!mediaSupported) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      });

      // Seleccionar un mimeType soportado
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mimeType = "audio/webm;codecs=opus";
      else if (MediaRecorder.isTypeSupported("audio/webm")) mimeType = "audio/webm";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mr;
      mediaChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) mediaChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const recordedMimeType = mr.mimeType;
        const blob = new Blob(mediaChunksRef.current, { type: recordedMimeType });
        if (audioURL) URL.revokeObjectURL(audioURL);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setMediaSupported(false);
      setError("No se pudo acceder al micrófono. Verifica los permisos.");
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopTimer();

    // Auto-analizar poco después de detener
    setTimeout(() => {
      if (audioURL) handleAnalyze();
    }, 500);
  };

  const handlePlay = () => audioRef.current?.play();
  const handleDownload = () => {
    if (!audioURL) return;
    const a = document.createElement("a");
    a.href = audioURL;
    a.download = `grabacion_serenvoice_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Analizar audio
  const handleAnalyze = async () => {
    if (!audioURL) {
      setError("No hay audio para analizar.");
      return;
    }
    try {
      setIsAnalyzing(true);
      setError(null);

      if (!audioURL) {
        setError("No hay audio para analizar.");
        return;
      }

      const blob = new Blob(mediaChunksRef.current, { type: "audio/webm;codecs=opus" });
      const formData = new FormData();
      formData.append("audio", blob, "grabacion.webm");

      const res = await apiClient.post(api.endpoints.audio.analyze, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysis(res.data);
    } catch (err) {
      console.error("Error analyzing audio:", err);
      setError(err.message || "Error al analizar el audio");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Navegación del carrusel
  const benefitCards = [
    { icon: FaLock, title: "Privacidad Garantizada", description: "Tus grabaciones y datos emocionales se guardan de forma segura con encriptación de nivel bancario." },
    { icon: FaChartLine, title: "Reportes Detallados", description: "Visualiza tendencias diarias y mensuales de estrés, ansiedad y 7 emociones detectadas." },
    { icon: FaUser, title: "Perfil Personal", description: "Mantén tu historial completo con acceso a todos tus análisis anteriores." },
    { icon: FaGamepad, title: "5 Juegos Terapéuticos", description: "Respiración guiada, memoria, mandalas, puzzles y mindfulness para reducir el estrés." },
    { icon: FaUsers, title: "Grupos de Apoyo", description: "Únete a comunidades, participa en actividades grupales y conecta con facilitadores." },
    { icon: FaLightbulb, title: "Recomendaciones IA", description: "Sugerencias personalizadas con inteligencia artificial basadas en tu historial emocional." },
  ];

  const handlePrevCard = () => {
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleNextCard = () => {
    setCarouselIndex((prev) => (prev < benefitCards.length - 3 ? prev + 1 : prev));
  };

  // Iconos y colores para emociones
  const getEmotionIcon = (emotion) => {
    const iconMap = {
      Felicidad: FaSmile,
      Tristeza: FaSadTear,
      Enojo: FaAngry,
      Estrés: FaFrownOpen,
      Ansiedad: FaMeh,
      Neutral: FaMeh,
      Miedo: FaFrownOpen,
      Sorpresa: FaSurprise,
    };
    return iconMap[emotion] || FaMeh;
  };

  const getEmotionColor = (emotion) => {
    return (
      {
        Felicidad: "#ffb703",
        Tristeza: "#4361ee",
        Enojo: "#e63946",
        Estrés: "#e76f51",
        Ansiedad: "#9b5de5",
        Neutral: "#6c757d",
        Miedo: "#7e22ce",
        Sorpresa: "#2a9d8f",
      }[emotion]
    ) || "#6c757d";
  };

  return (
    <>
      <NavbarPublic />
      <main
        className="container"
        style={{
          paddingTop: "2rem",
          paddingBottom: "3rem",
          backgroundImage: `url(${isDark ? PaisajeOscuro : PaisajeClaro})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 2rem", width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="card wide-card" style={{ textAlign: "center" }}>
          <h2>Análisis Emocional por Voz</h2>
          <p>Graba al menos 5 segundos de tu voz hablando naturalmente. Analizaremos cómo te sientes.</p>

          {/* Instrucción para lectura en voz alta */}
          <div style={{ marginTop: 12, marginBottom: 8 }}>
            <div style={{ padding: '12px 16px', background: 'var(--color-panel)', borderRadius: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Lee en voz alta:</div>
              <div style={{ fontStyle: 'italic', fontSize: '0.98rem' }}>{suggestedPhrase}</div>
            </div>
          </div>

          {error && <div style={{ color: "#ff6b6b", padding: 12, background: "rgba(255, 107, 107, 0.1)", borderRadius: 8 }}><FaExclamationTriangle /> {error}</div>}

          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            {!isRecording ? (
              <button className="auth-button" onClick={handleStart} disabled={!mediaSupported}>
                <FaMicrophone style={{ marginRight: 8 }} /> Empezar a grabar
              </button>
            ) : (
              <button className="auth-button" onClick={handleStop} style={{ background: "#ff6b6b" }}>
                <FaStop style={{ marginRight: 8 }} /> Detener
              </button>
            )}

            <div style={{
              minWidth: 120,
              padding: "8px 16px",
              background: isRecording ? "rgba(255, 107, 107, 0.1)" : "var(--color-panel)",
              borderRadius: 8,
              fontWeight: "bold",
              color: isRecording ? "#ff6b6b" : "var(--color-text-main)",
            }}>
              {Math.floor(recTime / 60)}:{String(recTime % 60).padStart(2, "0")}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="auth-button" onClick={handlePlay} disabled={!audioURL} style={{ opacity: audioURL ? 1 : 0.5 }}>
                <FaPlay /> Reproducir
              </button>
              <button className="auth-button" onClick={handleDownload} disabled={!audioURL} style={{ opacity: audioURL ? 1 : 0.5 }}>
                <FaDownload /> Descargar
              </button>
              <button className="auth-button analyze-button" onClick={handleAnalyze} disabled={!audioURL || isAnalyzing} style={{ opacity: audioURL && !isAnalyzing ? 1 : 0.5, background: "var(--color-primary)" }}>
                <FaWaveSquare /> {isAnalyzing ? "Analizando..." : "Analizar"}
              </button>
            </div>
          </div>

          {audioURL && <AudioPlayer src={audioURL} />}
          {isAnalyzing && <Spinner overlay={true} message="Analizando emociones con IA..." />}
        </div>

        {/* Card de Resultados del Análisis */}
        {analysis && analysis.emotions && (
          <div className="card wide-card">
            <h3 style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <FaChartLine style={{ color: "var(--color-primary)" }} /> Resultados del Análisis
            </h3>
            <div className="emotion-cards-grid" style={{ marginTop: 16 }}>
              {/* Mostrar las 8 emociones normalizadas del backend */}
              {analysis.emotions.slice(0, 8).map((emotion, idx) => {
                const Icon = getEmotionIcon(emotion.name);
                const color = getEmotionColor(emotion.name);
                return (
                  <div key={idx} className="emotion-card" style={{ border: `3px solid ${color}` }}>
                    <Icon className="emotion-card-icon" style={{ color }} />
                    <p className="emotion-card-label" style={{ color }}>{emotion.name}</p>
                    <span className="emotion-card-value">{emotion.value}%</span>
                    <div className="emotion-card-bar">
                      <div className="emotion-card-bar-fill" style={{ width: `${Math.max(0, Math.min(100, emotion.value))}%`, background: color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Card de mensaje de registro */}
        {analysis && (
          <div className="card wide-card" style={{ textAlign: "center" }}>
            <h2 style={{ color: "var(--color-text-main)", marginBottom: 16 }}>
              Desbloquea el Potencial Completo
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem", marginBottom: 24 }}>
              Regístrate ahora para acceder a análisis avanzados, historial de
              grabaciones y reportes personalizados.
            </p>

            <div className="benefit-carousel">
              <button
                onClick={handlePrevCard}
                disabled={carouselIndex === 0}
                aria-label="Anterior"
                className="benefit-carousel-btn"
              >
                {'<'}
              </button>

              <div className="benefit-cards-grid">
                {benefitCards.slice(carouselIndex, carouselIndex + 3).map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="benefit-card">
                      <Icon size={32} style={{ color: "var(--color-primary)", marginBottom: 8 }} />
                      <h4>
                        {card.title}
                      </h4>
                      <p>
                        {card.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleNextCard}
                disabled={carouselIndex >= benefitCards.length - 3}
                aria-label="Siguiente"
                className="benefit-carousel-btn"
              >
                {'>'}
              </button>
            </div>

            <button
              onClick={() => navigate("/registro")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.8rem 2rem",
                background: "var(--color-primary)",
                color: "white",
                borderRadius: "50px",
                border: "none",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 10px var(--color-shadow)",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 15px var(--color-shadow)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 10px var(--color-shadow)";
              }}
            >
              Crear Cuenta <FaArrowRight />
            </button>
          </div>
        )}
        </div>
      </main>
      <footer className="footer">
        © {new Date().getFullYear()} SerenVoice — Todos los derechos reservados.
      </footer>
    </>
  );
};

export default ProbarVoz;
