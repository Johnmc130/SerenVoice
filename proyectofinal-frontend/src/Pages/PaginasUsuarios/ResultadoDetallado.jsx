import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinner from "../../components/Publico/Spinner";
import PageCard from "../../components/Shared/PageCard";
import { 
  FaChartLine, 
  FaLightbulb, 
  FaExclamationTriangle,
  FaSmile,
  FaAngry,
  FaHeartbeat,
  FaBrain,
  FaMeh,
  FaSadTear,
  FaSurprise,
  FaFrownOpen,
  FaUserMd,
  FaDumbbell,
  FaPray,
  FaPause,
  FaCoffee,
  FaLeaf,
  FaArrowLeft
} from "react-icons/fa";

import apiClient from '../../services/apiClient';
import api from '../../config/api';

const ResultadoDetallado = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(api.endpoints.analisis.get(id));
        const json = response.data;
        console.debug('[ResultadoDetallado] payload', json);
        if (json?.success === false) {
          throw new Error(json.message || 'Error al obtener detalle');
        }
        const payload = json.data || { analisis: null, resultado: null, recomendaciones: [] };
        setData(payload);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;
    const fetchAudio = async () => {
      try {
        const res = await apiClient.get(api.endpoints.analisis.audio(id), { responseType: 'blob' });
        const blob = res.data instanceof Blob ? res.data : await res.data.blob?.();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setAudioUrl(objectUrl);
      } catch (e) {
        console.debug('[ResultadoDetallado] audio fetch error', e);
      }
    };

    if (data && data.analisis && data.analisis.ruta_archivo) {
      fetchAudio();
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, data]);

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

  return (
    <div className="resultado-detallado-content page-content">
        {loading && <Spinner overlay={true} message="Cargando detalle..." />}

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

        {error && (
          <PageCard size="xl">
            <div style={{
              color: "#ff6b6b",
              padding: 16,
              background: "rgba(255, 107, 107, 0.1)",
              borderRadius: 8,
              border: "2px solid #ff6b6b"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FaExclamationTriangle size={20} />
                <strong>Error: {error}</strong>
              </div>
            </div>
          </PageCard>
        )}

        {data && (
          <>
            {/* Card de Detalles del Análisis */}
            {data.analisis && (
              <PageCard size="xl" spaced>
                <h2 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <FaChartLine /> Detalles del Análisis
                </h2>
                <div className="panel" style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    {data.analisis.fecha_analisis && (
                      <div>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>Fecha del análisis</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          {new Date(data.analisis.fecha_analisis).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {data.analisis.estado_analisis && (
                      <div>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>Estado</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{data.analisis.estado_analisis}</p>
                      </div>
                    )}
                    {data.analisis.modelo_usado && (
                      <div>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>Modelo</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{data.analisis.modelo_usado}</p>
                      </div>
                    )}
                    {data.analisis.nombre_archivo && (
                      <div>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>Archivo</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{data.analisis.nombre_archivo}</p>
                      </div>
                    )}
                    {data.resultado && data.resultado.clasificacion && (
                      <div>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>Clasificación</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{data.resultado.clasificacion}</p>
                      </div>
                    )}
                    {data.resultado && data.resultado.confianza_modelo && (
                      <div>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>Confianza del Modelo</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{data.resultado.confianza_modelo}%</p>
                      </div>
                    )}
                    {data.analisis.fecha_grabacion && (
                      <div>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>Fecha de grabación</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          {new Date(data.analisis.fecha_grabacion).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {data.analisis.duracion !== undefined && (
                      <div>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>Duración</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{data.analisis.duracion}s</p>
                      </div>
                    )}
                    {data.analisis.ruta_archivo && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)", marginBottom: 8 }}>Audio</p>
                        {audioUrl ? (
                          <>
                            <audio controls style={{ width: "100%" }}>
                              <source src={audioUrl} type="audio/wav" />
                              Tu navegador no soporta el elemento audio.
                            </audio>
                            <div style={{ marginTop: 8 }}>
                              <a href={audioUrl} download>Descargar archivo</a>
                              <span style={{ marginLeft: 12 }}>
                                <a href={audioUrl} target="_blank" rel="noreferrer">Abrir en pestaña nueva</a>
                              </span>
                            </div>
                          </>
                        ) : (
                          <p style={{ margin: 0 }}>Cargando audio...</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </PageCard>
            )}

            {/* Card de Niveles Emocionales */}
            {data.resultado && (
              <PageCard size="xl" spaced>
                <h2 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <FaChartLine style={{ color: "var(--color-primary)" }} /> Niveles Emocionales Detectados
                </h2>
                <div className="emotion-cards-grid">
                  {(() => {
                    // Definir el orden de las emociones
                    const preferred = [
                      'Felicidad', 'Tristeza', 'Enojo', 'Estrés',
                      'Ansiedad', 'Neutral', 'Miedo', 'Sorpresa'
                    ];
                    
                    // Función para obtener valor numérico seguro
                    const getNumericValue = (val) => {
                      const num = parseFloat(val);
                      return isNaN(num) ? 0 : Math.round(num * 10) / 10;
                    };
                    
                    // Mapear valores del resultado
                    const niveles = {
                      'Felicidad': getNumericValue(data.resultado.nivel_felicidad),
                      'Tristeza': getNumericValue(data.resultado.nivel_tristeza),
                      'Enojo': getNumericValue(data.resultado.nivel_enojo),
                      'Estrés': getNumericValue(data.resultado.nivel_estres),
                      'Ansiedad': getNumericValue(data.resultado.nivel_ansiedad),
                      'Neutral': getNumericValue(data.resultado.nivel_neutral),
                      'Miedo': getNumericValue(data.resultado.nivel_miedo),
                      'Sorpresa': getNumericValue(data.resultado.nivel_sorpresa),
                    };

                    // Log para debug
                    console.debug('[ResultadoDetallado] Niveles emocionales:', niveles);
                    console.debug('[ResultadoDetallado] Resultado raw:', data.resultado);

                    return preferred.map((name, idx) => {
                      const value = niveles[name];
                      const Icon = getEmotionIcon(name);
                      const color = getEmotionColor(name);
                      return (
                        <div key={idx} className="emotion-card" style={{ border: `3px solid ${color}` }}>
                          <Icon className="emotion-card-icon" style={{ color }} />
                          <p className="emotion-card-label" style={{ color }}>{name}</p>
                          <span className="emotion-card-value">{value.toFixed(1)}%</span>
                          <div className="emotion-card-bar">
                            <div className="emotion-card-bar-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </PageCard>
            )}

            {/* Card de Recomendaciones */}
            <PageCard size="xl" spaced>
              <h2 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <FaLightbulb style={{ color: "var(--color-primary)" }} /> Recomendaciones Personalizadas
              </h2>
              {data.recomendaciones && data.recomendaciones.length > 0 ? (
                <div>
                  {data.recomendaciones.map((rec, idx) => {
                    const titulo = rec.titulo || (rec.tipo_recomendacion ? rec.tipo_recomendacion.charAt(0).toUpperCase() + rec.tipo_recomendacion.slice(1) : `Recomendación ${idx + 1}`);
                    const texto = rec.descripcion || rec.contenido || rec.texto || "";
                    const tipo = (rec.tipo_recomendacion || rec.tipo || '').toString().toLowerCase();
                    const prioridad = tipo === 'profesional' ? 'alta' : (tipo === 'respiracion' ? 'media' : 'media');
                    const Icon = getTipoIcon(tipo);
                    
                    return (
                      <div key={idx} className="panel" style={{
                        marginBottom: '1rem',
                        padding: 16,
                        borderLeft: `4px solid ${getPrioridadColor(prioridad)}`,
                        background: 'var(--color-panel)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ flexGrow: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <Icon style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }} />
                              <h4 style={{ margin: 0 }}>{titulo}</h4>
                              {rec.origen === 'ia' && (
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
                            <p style={{ marginTop: '0.25rem', color: 'var(--color-text-secondary)', margin: 0 }}>{texto}</p>
                          </div>
                          <div style={{
                            background: getPrioridadColor(prioridad),
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap'
                          }}>{prioridad.toUpperCase()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="panel" style={{ padding: 16 }}>
                  <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
                    No hay recomendaciones registradas para este análisis.
                  </p>
                </div>
              )}
            </PageCard>
          </>
        )}

        {!loading && !error && !data && (
          <PageCard size="xl">
            <div className="panel" style={{ padding: 16 }}>
              <p style={{ margin: 0 }}>No se encontraron datos para este análisis.</p>
            </div>
          </PageCard>
        )}
    </div>
  );
};

export default ResultadoDetallado;
