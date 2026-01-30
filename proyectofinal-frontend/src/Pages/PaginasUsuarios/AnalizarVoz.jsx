import React, { useEffect, useRef, useState } from "react";
import "../../global.css";
import Spinner from "../../components/Publico/Spinner";
import PageCard from "../../components/Shared/PageCard";
import "../../styles/StylesUsuarios/audio-player-custom.css";
import AudioPlayer from "../../components/Publico/AudioPlayer";
import secureStorage from "../../utils/secureStorage";
import {
  FaMicrophone,
  FaStop,
  FaPlay,
  FaDownload,
  FaWaveSquare,
  FaSmile,
  FaAngry,
  FaChartLine,
  FaHeartbeat,
  FaBrain,
  FaMeh,
  FaSadCry,
  FaExclamationTriangle,
  FaHistory,
  FaCheckCircle,
  FaLightbulb,
  FaClock,
  FaSadTear,
  FaSurprise,
  FaFrownOpen,
  FaArrowLeft,
} from "react-icons/fa";
import { FaUserMd, FaDumbbell, FaPray, FaPause, FaCoffee, FaLeaf } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import apiClient from '../../services/apiClient';
import api from '../../config/api';
import authService from '../../services/authService';

const AnalizarVoz = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaSupported, setMediaSupported] = useState(true);
  const [audioURL, setAudioURL] = useState(null);
  const mediaChunksRef = useRef([]);
  const [recTime, setRecTime] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [wavURL, setWavURL] = useState(null);
  const [downloadName, setDownloadName] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Frases aleatorias para ayudar al usuario si no sabe qué decir
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

  // No hay botones para cambiar frase; se elige una al montar el componente

  // Verificar soporte de navegador
  useEffect(() => {
    const checkMediaSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMediaSupported(false);
        setError(
          "Tu navegador no soporta la grabación de audio. Usa Chrome, Firefox o Edge."
        );
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
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && audioURL) {
      try {
        audioRef.current.load();
      } catch (e) {
        console.warn("No se pudo recargar el elemento de audio:", e);
      }
    }
  }, [audioURL, audioRef]);

  // Utilidad: convertir Blob (webm) a WAV usando WebAudio API
  const convertBlobToWav = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const sampleRate = audioBuffer.sampleRate;
      const numChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length * numChannels * 2 + 44; // 16-bit PCM + header

      const wavBuffer = new ArrayBuffer(length);
      const view = new DataView(wavBuffer);

      const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      let offset = 0;
      writeString(view, offset, 'RIFF'); offset += 4;
      view.setUint32(offset, 36 + audioBuffer.length * numChannels * 2, true); offset += 4;
      writeString(view, offset, 'WAVE'); offset += 4;
      writeString(view, offset, 'fmt '); offset += 4;
      view.setUint32(offset, 16, true); offset += 4; // Subchunk1Size
      view.setUint16(offset, 1, true); offset += 2; // AudioFormat PCM
      view.setUint16(offset, numChannels, true); offset += 2; // NumChannels
      view.setUint32(offset, sampleRate, true); offset += 4; // SampleRate
      view.setUint32(offset, sampleRate * numChannels * 2, true); offset += 4; // ByteRate
      view.setUint16(offset, numChannels * 2, true); offset += 2; // BlockAlign
      view.setUint16(offset, 16, true); offset += 2; // BitsPerSample
      writeString(view, offset, 'data'); offset += 4;
      view.setUint32(offset, audioBuffer.length * numChannels * 2, true); offset += 4;

      const channelData = [];
      for (let ch = 0; ch < numChannels; ch++) {
        channelData.push(audioBuffer.getChannelData(ch));
      }
      for (let i = 0; i < audioBuffer.length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
          let sample = Math.max(-1, Math.min(1, channelData[ch][i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }

      const wavBlob = new Blob([view], { type: 'audio/wav' });
      return URL.createObjectURL(wavBlob);
    } catch (err) {
      console.error('WAV conversion failed:', err);
      return null;
    }
  };

  const startTimer = () => {
    setRecTime(0);
    timerRef.current = setInterval(() => {
      setRecTime((t) => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const requestMicrophonePermission = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMediaSupported(true);
      alert("Permisos concedidos. Ahora puedes grabar.");
    } catch (err) {
      setMediaSupported(false);
      setError(err.name === "NotAllowedError" ? "Permisos denegados" : err.message);
    }
  };

  // Iniciar grabación
  const handleStart = async () => {
    if (!mediaSupported) return;
    setError(null);
    setAnalysis(null);
    setSavedSuccess(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      }

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mr;
      mediaChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          mediaChunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        const recordedMimeType = mr.mimeType;
        const blob = new Blob(mediaChunksRef.current, { type: recordedMimeType });
        if (audioURL) URL.revokeObjectURL(audioURL);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        const ts = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const y = ts.getFullYear();
        const m = pad(ts.getMonth() + 1);
        const d = pad(ts.getDate());
        const hh = pad(ts.getHours());
        const mm = pad(ts.getMinutes());
        const ss = pad(ts.getSeconds());
        const micro = String(ts.getMilliseconds()).padStart(6, '0');
        const rand = Math.random().toString(16).slice(2, 8);
        const base = `${y}${m}${d}_${hh}${mm}${ss}_${micro}_${rand}_grabacion.wav`;
        setDownloadName(base);
        convertBlobToWav(blob).then((wavUrl) => {
          if (wavURL) URL.revokeObjectURL(wavURL);
          setWavURL(wavUrl || url);
        });
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

  // Detener grabación
  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopTimer();

    setTimeout(() => {
      if (audioURL) handleAnalyze();
    }, 500);
  };

  const handlePlay = () => {
    if (audioRef.current) {
      try {
        audioRef.current.load();
        audioRef.current.play().catch((e) => console.error("Play failed:", e));
      } catch (e) {
        console.error("Play error:", e);
      }
    }
  };

  const handleDownload = () => {
    let fileUrl;
    const token = secureStorage.getAccessToken() || localStorage.getItem("token") || "";
    const analisisId = analysis?.analisis_id || analysis?.data?.analisis_id;
    if (analysis && analisisId) {
      fileUrl = `${api.baseURL}${api.endpoints.analisis.audio(analisisId)}?token=${encodeURIComponent(token)}`;
    } else {
      fileUrl = wavURL || audioURL;
      if (!fileUrl) {
        setError("No hay audio WAV disponible. Graba primero.");
        return;
      }
    }
    const a = document.createElement("a");
    a.href = fileUrl;
    const isWav = !!wavURL && fileUrl === wavURL;
    a.download = downloadName || `grabacion_${Date.now()}.${isWav ? "wav" : "webm"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Analizar y guardar audio en backend (usuario autenticado)
  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      setSavedSuccess(false);
      setError(null);

      if (!audioURL) {
        setError("No hay audio para analizar.");
        return;
      }

      const blob = new Blob(mediaChunksRef.current, { type: "audio/webm;codecs=opus" });
      const formData = new FormData();
      formData.append("audio", blob, `analisis_${Date.now()}.webm`);
      formData.append("duration", String(recTime || 0));
      
      // Obtener user_id desde authService
      const userData = authService.getUser();
      const userId = userData?.id_usuario || userData?.id || userData?.user_id || localStorage.getItem("userId");
      if (userId) {
        formData.append("user_id", String(userId));
      } else {
        // Fallback: intentar extraer del token
        const t = secureStorage.getAccessToken() || localStorage.getItem("token");
        if (t) {
          try {
            const parts = t.split(".");
            if (parts.length === 3) {
              const payloadJson = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
              const derivedId = payloadJson.user_id || payloadJson.sub || payloadJson.id || payloadJson.uid;
              if (derivedId) {
                formData.append("user_id", String(derivedId));
              }
            }
          } catch (e) {
            console.warn('Fallo al parsear payload del token', e);
          }
        }
      }

      // Verificar autenticación usando secureStorage
      const token = secureStorage.getAccessToken() || localStorage.getItem("token");
      if (!token) {
        setError("No estás autenticado. Por favor inicia sesión.");
        navigate("/login");
        return;
      }

      const res = await apiClient.post(api.endpoints.audio.analyze, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data;
      if (res.status >= 400 || data?.success === false) {
        const msg = data?.message || data?.error || `Error del servidor: ${res.status}`;
        throw new Error(msg);
      }
      // Aceptar ambos formatos: { success:true, emotions: [...] } o { data: {...} }
      setAnalysis(data);
      setSavedSuccess(true);
    } catch (error) {
      console.error("Error analyzing audio:", error);
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
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

  const getEmotionIcon = (emotion) => {
    const iconMap = {
      Felicidad: FaSmile,
      Tristeza: FaSadTear,
      Enojo: FaAngry,
      Estrés: FaHeartbeat,
      Ansiedad: FaBrain,
      Neutral: FaMeh,
      Miedo: FaFrownOpen,
      Sorpresa: FaSurprise,
    };
    return iconMap[emotion] || FaMeh;
  };
  return (
    <div className="analizar-voz-content page-content">
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

          <h2 style={{ marginBottom: 8 }}>Análisis Emocional por Voz con IA</h2>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
            Graba al menos 5 segundos de tu voz hablando naturalmente. Nuestra IA analizará
            tus emociones mediante características acústicas avanzadas y guardará los resultados en tu historial.
          </p>

          {/* Instrucción para lectura en voz alta */}
          <div style={{ marginTop: 12, marginBottom: 8 }}>
            <div style={{ padding: '12px 16px', background: 'var(--color-panel)', borderRadius: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Lee en voz alta:</div>
              <div style={{ fontStyle: 'italic', fontSize: '0.98rem' }}>{suggestedPhrase}</div>
            </div>
          </div>

          {!mediaSupported && error && (
            <div style={{
              color: "#ff6b6b",
              padding: 16,
              background: "rgba(255, 107, 107, 0.1)",
              borderRadius: 8,
              marginBottom: 16,
              border: "2px solid #ff6b6b"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <FaExclamationTriangle size={24} />
                <strong>Problema con el micrófono</strong>
              </div>
              <p style={{ margin: "8px 0", fontSize: "0.95rem" }}>{error}</p>
              <button
                onClick={requestMicrophonePermission}
                style={{
                  marginTop: 12,
                  padding: "8px 16px",
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                Solicitar permisos nuevamente
              </button>
            </div>
          )}

          {savedSuccess && (
            <div style={{
              color: "#2e7d32",
              padding: 16,
              background: "#e8f5e9",
              borderRadius: 8,
              marginBottom: 16,
              border: "2px solid #66bb6a",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <FaCheckCircle size={24} />
              <div style={{ flex: 1 }}>
                <strong>Análisis guardado exitosamente</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem" }}>
                  Tu análisis ha sido registrado en tu historial.
                </p>
              </div>
              <button
                onClick={() => navigate("/historial")}
                className="auth-button"
                style={{ background: "#4caf50", marginTop: 0 }}
              >
                <FaHistory style={{ marginRight: 8 }} /> Ver Historial
              </button>
            </div>
          )}

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
              background: isRecording ? "#ffebee" : "var(--color-panel)",
              borderRadius: 8,
              fontWeight: "bold",
              color: isRecording ? "#ff6b6b" : "var(--color-text-main)",
            }}>
              {Math.floor(recTime / 60)}:{String(recTime % 60).padStart(2, "0")}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="auth-button" onClick={handlePlay} disabled={!(wavURL || (analysis && analysis.analisis_id))} style={{ opacity: (wavURL || (analysis && analysis.analisis_id)) ? 1 : 0.5 }}>
                <FaPlay /> Reproducir
              </button>
              <button className="auth-button" onClick={handleDownload} disabled={!(wavURL || (analysis && (analysis.analisis_id || analysis.data?.analisis_id)))} style={{ opacity: (wavURL || (analysis && (analysis.analisis_id || analysis.data?.analisis_id))) ? 1 : 0.5 }}>
                <FaDownload /> Descargar
              </button>
              <button className="auth-button analyze-button" onClick={handleAnalyze} disabled={!audioURL || isAnalyzing} style={{ opacity: audioURL && !isAnalyzing ? 1 : 0.5, background: "var(--color-primary)" }}>
                <FaWaveSquare /> {isAnalyzing ? "Analizando..." : "Analizar y Guardar"}
              </button>
            </div>
          </div>

          {(() => {
            const token = secureStorage.getAccessToken() || localStorage.getItem("token") || "";
            const fileUrl = (analysis && analysis.analisis_id)
              ? `${api.baseURL}${api.endpoints.analisis.audio(analysis.analisis_id)}?token=${encodeURIComponent(token)}`
              : wavURL;
            const playableUrl = audioURL || fileUrl;
            return (
              playableUrl ? (
                <AudioPlayer src={playableUrl} />
              ) : null
            );
          })()}

          {isAnalyzing && <Spinner overlay={true} message="Analizando emociones con IA..." />}

          {error && !isAnalyzing && (
            <div style={{
              color: "#ff6b6b",
              padding: 16,
              background: "rgba(255, 107, 107, 0.1)",
              borderRadius: 8,
              marginTop: 16,
              border: "2px solid #ff6b6b"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FaExclamationTriangle size={20} />
                <strong>Error: {error}</strong>
              </div>
            </div>
          )}

          {analysis && (analysis.emotions || analysis.data?.emotions) && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <FaChartLine style={{ color: "var(--color-primary)" }} /> Resultados del Análisis
              </h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                {(() => {
                  const conf = (analysis.confidence || analysis.data?.confidence || 0) * (typeof (analysis.confidence || analysis.data?.confidence) === 'number' && (analysis.confidence <= 1) ? 100 : 1);
                  const dur = analysis.duration || analysis.data?.duration;
                  return (
                    <>
                      <span style={{
                        background: "#e8f5e9",
                        color: "#2e7d32",
                        border: "2px solid #66bb6a",
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontWeight: 700
                      }}>
                        Confianza: {Math.round(conf * 10) / 10}%
                      </span>
                      {dur != null && (
                        <span style={{
                          background: "#e3f2fd",
                          color: "#1565c0",
                          border: "2px solid #64b5f6",
                          borderRadius: 999,
                          padding: "6px 12px",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                          <FaClock /> {dur}s
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="emotion-cards-grid">
                {(() => {
                  // Queremos mostrar siempre 8 cards en orden consistente.
                  const preferred = [
                    'Felicidad', 'Tristeza', 'Enojo', 'Estrés',
                    'Ansiedad', 'Neutral', 'Miedo', 'Sorpresa'
                  ];
                  const source = (analysis.emotions || analysis.data?.emotions || []);
                  // Mapear valores existentes por nombre (exact match)
                  const byName = {};
                  source.forEach((e) => { byName[(e.name || '').toString()] = e; });
                  // Construir lista de 8 elementos rellenando con 0 si no existen
                  return preferred.map((name, idx) => {
                    const emotion = byName[name] || { name, value: 0 };
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
                  });
                })()}
              </div>
            </div>
          )}
        </PageCard>
      {/* Card de Recomendaciones IA */}
      {analysis && (() => {
        const baseReco = analysis.recomendaciones || analysis.data?.recomendaciones || [];
        const emoList = analysis.emotions || analysis.data?.emotions || [];
        const list = Array.isArray(baseReco) ? baseReco : [];
        return list.length > 0 || (Array.isArray(emoList) && emoList.length > 0);
      })() && (
        <PageCard size="xl" spaced>
          {(() => {
            const baseReco = analysis.recomendaciones || analysis.data?.recomendaciones || [];
            const emoList = analysis.emotions || analysis.data?.emotions || [];
            const isFallback = !(Array.isArray(baseReco) && baseReco.length > 0) && Array.isArray(emoList) && emoList.length > 0;
            return (
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FaLightbulb style={{ color: "var(--color-primary)" }} /> Recomendaciones Personalizadas
                {isFallback && (
                  <span style={{
                    marginLeft: 8,
                    fontSize: "0.85rem",
                    background: "#fff3cd",
                    color: "#856404",
                    border: "1px solid #ffeeba",
                    borderRadius: 6,
                    padding: "2px 8px"
                  }}>
                    Generadas automáticamente según emociones
                  </span>
                )}
              </h3>
            );
          })()}

          {(() => {
            const raw = analysis.recomendaciones || analysis.data?.recomendaciones || [];
            const recs = Array.isArray(raw) ? raw : [];
            const cards = recs.map((r, idx) => {
              const tipo = (r.tipo_recomendacion || r.tipo || '').toString().toLowerCase();
              return {
                id: idx + 1,
                titulo: r.titulo || (tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : `Recomendación ${idx + 1}`),
                tipo,
                categoria: 'sugerencia',
                prioridad: tipo === 'profesional' ? 'alta' : (tipo === 'respiracion' ? 'media' : 'media'),
                texto: r.contenido || r.descripcion || '',
                contenidoDetallado: r.contenido || r.descripcion || '',
                recursos: {},
                aplicado: false,
                rating: 0,
                fechaCreacion: new Date().toISOString().slice(0,10),
                estado: 'pendiente',
                origen: r.origen || '',
              };
            });

            const getPrioridadColor = (prioridad) => {
              switch (prioridad) {
                case 'alta': return '#ff6b6b';
                case 'media': return '#ff9800';
                case 'baja': return '#4caf50';
                default: return 'var(--color-text-secondary)';
              }
            };
            const getTipoIcon = (tipo) => {
              const t = (tipo || '').toString().toLowerCase();
              switch (t) {
                case 'respiracion': return FaHeartbeat;
                case 'pausa_activa': return FaPause;
                case 'meditacion': return FaPray;
                case 'ejercicio': return FaDumbbell;
                case 'profesional': return FaUserMd;
                case 'habito': return FaCoffee;
                default: return FaLeaf;
              }
            };

            if (cards.length === 0) return null;

            return (
              <div style={{ marginTop: '1.5rem' }}>
                {cards.map((r) => (
                  <div key={r.id} className="card" style={{
                    marginBottom: '1rem',
                    borderLeft: `4px solid ${getPrioridadColor(r.prioridad)}`,
                    background: r.aplicado ? 'var(--color-card-alt)' : 'var(--color-card)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          {(() => { const Icon = getTipoIcon(r.tipo); return <Icon style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }} />; })()}
                          <h4 style={{ margin: 0 }}>{r.titulo}</h4>
                          {r.origen === 'ia' && (
                            <span style={{
                              marginLeft: 8,
                              fontSize: '0.75rem',
                              background: '#e3f2fd',
                              color: '#1565c0',
                              border: '1px solid #64b5f6',
                              borderRadius: 6,
                              padding: '2px 6px'
                            }}>IA</span>
                          )}
                        </div>
                        <p style={{ marginTop: '0.25rem', color: 'var(--color-text-secondary)' }}>{r.texto}</p>
                      </div>
                      <div style={{
                        background: getPrioridadColor(r.prioridad),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                      }}>{(r.prioridad || '').toUpperCase()}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </PageCard>
      )}
    </div>
  );
};

export default AnalizarVoz;
