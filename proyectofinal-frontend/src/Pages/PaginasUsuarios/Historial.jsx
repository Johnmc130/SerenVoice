import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "../../components/Publico/Spinner";
import analisisService from "../../services/analisisService";
import "../../global.css";
import PageCard from "../../components/Shared/PageCard";
import Pagination from "../../components/Shared/Pagination";
import { FaHistory, FaPlay, FaDownload, FaEye, FaFilter, FaTimes, FaSearch, FaArrowLeft } from "react-icons/fa";

const ITEMS_PER_PAGE = 10;

// Opciones para los selectores de filtros
const ESTADOS_OPCIONES = [
  { value: '', label: 'Todos los estados' },
  { value: 'completado', label: 'Completado' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'error', label: 'Error' }
];

const CLASIFICACION_OPCIONES = [
  { value: '', label: 'Todas las clasificaciones' },
  { value: 'muy alto', label: 'Muy Alto' },
  { value: 'alto', label: 'Alto' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'bajo', label: 'Bajo' },
  { value: 'muy bajo', label: 'Muy Bajo' },
  { value: 'neutral', label: 'Neutral' }
];

const EMOCIONES_OPCIONES = [
  { value: '', label: 'Todas las emociones' },
  { value: 'Felicidad', label: 'Felicidad' },
  { value: 'Tristeza', label: 'Tristeza' },
  { value: 'Enojo', label: 'Enojo' },
  { value: 'Estrés', label: 'Estrés' },
  { value: 'Ansiedad', label: 'Ansiedad' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Miedo', label: 'Miedo' },
  { value: 'Sorpresa', label: 'Sorpresa' }
];

const Historial = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const cardRef = useRef(null);

  // Estado de filtros
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    estado: '',
    clasificacion: '',
    emocion_dominante: ''
  });

  // Filtros aplicados (para mostrar tags)
  const [appliedFilters, setAppliedFilters] = useState({});

  const fetchHistory = useCallback(async (filtersToApply = {}) => {
    try {
      setLoading(true);
      setError("");
      const response = await analisisService.getHistory(100, filtersToApply);
      if (response.success) {
        setHistory(response.data || []);
      } else {
        setError(response.message || "Error al cargar historial");
      }
    } catch (err) {
      console.error("Error al cargar historial:", err);
      setError(err.message || "Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!cardRef.current) return;
    const els = cardRef.current.querySelectorAll(".reveal");
    els.forEach((el) => el.classList.add("reveal-visible"));
    if (cardRef.current.classList.contains("reveal"))
      cardRef.current.classList.add("reveal-visible");
  }, [history]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    // Filtrar solo campos con valor
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    );
    setAppliedFilters(activeFilters);
    setCurrentPage(1);
    fetchHistory(activeFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      fecha_inicio: '',
      fecha_fin: '',
      estado: '',
      clasificacion: '',
      emocion_dominante: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters({});
    setCurrentPage(1);
    fetchHistory({});
  };

  const handleRemoveFilter = (filterKey) => {
    const newFilters = { ...filters, [filterKey]: '' };
    setFilters(newFilters);
    const activeFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([, v]) => v !== '')
    );
    setAppliedFilters(activeFilters);
    setCurrentPage(1);
    fetchHistory(activeFilters);
  };

  const getFilterLabel = (key, value) => {
    const labels = {
      fecha_inicio: `Desde: ${value}`,
      fecha_fin: `Hasta: ${value}`,
      estado: `Estado: ${value}`,
      clasificacion: `Clasificación: ${value}`,
      emocion_dominante: `Emoción: ${value}`
    };
    return labels[key] || `${key}: ${value}`;
  };

  const hasActiveFilters = Object.keys(appliedFilters).length > 0;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      completado: { color: "#4caf50", text: "Completado" },
      pendiente: { color: "#ff9800", text: "Pendiente" },
      error: { color: "#ff6b6b", text: "Error" }
    };
    const info = estados[estado?.toLowerCase()] || { color: "#9e9e9e", text: estado || "Desconocido" };
    return (
      <span style={{
        background: `${info.color}22`,
        color: info.color,
        padding: "0.25rem 0.75rem",
        borderRadius: "12px",
        fontSize: "0.85rem",
        fontWeight: "600"
      }}>
        {info.text}
      </span>
    );
  };

  const getClasificacionColor = (clasificacion) => {
    const colores = {
      "muy alto": "#ff6b6b",
      "alto": "#f57c00",
      "moderado": "#fbc02d",
      "bajo": "#7cb342",
      "muy bajo": "#388e3c",
      "neutral": "#5c6bc0"
    };
    return colores[clasificacion?.toLowerCase()] || "#9e9e9e";
  };

  const handleViewDetail = (idAnalisis) => {
    navigate(`/resultado-detallado/${idAnalisis}`);
  };

  // Calcular datos paginados
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return history.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [history, currentPage]);

  // Reset a página 1 cuando cambian los datos
  useEffect(() => {
    setCurrentPage(1);
  }, [history.length]);

  return (
    <div className="historial-content page-content">
      {loading && <Spinner message="Cargando historial..." />}
        
        <PageCard
          ref={cardRef}
          size="xl"
          className="reveal"
          data-revealdelay="60"
        >
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0 }}>
                <FaHistory /> Historial de Análisis
              </h2>
              <p style={{ color: "var(--color-text-secondary)", margin: "0.5rem 0 0 0" }}>
                Revisa tus análisis previos y accede a los resultados detallados.
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                background: showFilters ? "var(--color-primary)" : "var(--color-panel-solid)",
                color: showFilters ? "#fff" : "var(--color-text-main)",
                border: "1px solid var(--color-shadow)",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
                transition: "all 0.3s ease"
              }}
            >
              <FaFilter /> {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
              {hasActiveFilters && (
                <span style={{
                  background: "#ff6b6b",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  marginLeft: "0.25rem"
                }}>
                  {Object.keys(appliedFilters).length}
                </span>
              )}
            </button>
          </div>

          {/* Panel de Filtros */}
          {showFilters && (
            <div style={{
              background: "var(--color-panel)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              border: "1px solid var(--color-shadow)"
            }}>
              <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaSearch /> Filtrar Análisis
              </h4>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "1rem"
              }}>
                {/* Fecha Inicio */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filters.fecha_inicio}
                    onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-shadow)",
                      background: "var(--color-panel-solid)",
                      color: "var(--color-text-main)",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>

                {/* Fecha Fin */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filters.fecha_fin}
                    onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-shadow)",
                      background: "var(--color-panel-solid)",
                      color: "var(--color-text-main)",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>

                {/* Estado */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Estado
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) => handleFilterChange('estado', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-shadow)",
                      background: "var(--color-panel-solid)",
                      color: "var(--color-text-main)",
                      fontSize: "0.9rem"
                    }}
                  >
                    {ESTADOS_OPCIONES.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Clasificación */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Clasificación
                  </label>
                  <select
                    value={filters.clasificacion}
                    onChange={(e) => handleFilterChange('clasificacion', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-shadow)",
                      background: "var(--color-panel-solid)",
                      color: "var(--color-text-main)",
                      fontSize: "0.9rem"
                    }}
                  >
                    {CLASIFICACION_OPCIONES.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Emoción Dominante */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Emoción Dominante
                  </label>
                  <select
                    value={filters.emocion_dominante}
                    onChange={(e) => handleFilterChange('emocion_dominante', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-shadow)",
                      background: "var(--color-panel-solid)",
                      color: "var(--color-text-main)",
                      fontSize: "0.9rem"
                    }}
                  >
                    {EMOCIONES_OPCIONES.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones de acción de filtros */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button
                  onClick={handleApplyFilters}
                  style={{
                    background: "var(--color-primary)",
                    color: "#fff",
                    border: "none",
                    padding: "0.5rem 1.5rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    transition: "all 0.3s ease"
                  }}
                >
                  <FaSearch /> Aplicar Filtros
                </button>
                <button
                  onClick={handleClearFilters}
                  style={{
                    background: "transparent",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-shadow)",
                    padding: "0.5rem 1.5rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    transition: "all 0.3s ease"
                  }}
                >
                  <FaTimes /> Limpiar Filtros
                </button>
              </div>
            </div>
          )}

          {/* Tags de filtros aplicados */}
          {hasActiveFilters && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "1rem"
            }}>
              {Object.entries(appliedFilters).map(([key, value]) => (
                <span
                  key={key}
                  style={{
                    background: "var(--color-primary)",
                    color: "#fff",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "16px",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  {getFilterLabel(key, value)}
                  <button
                    onClick={() => handleRemoveFilter(key)}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#fff",
                      padding: 0
                    }}
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && (
            <div style={{
              background: "rgba(255, 107, 107, 0.1)",
              color: "#ff6b6b",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem"
            }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: "1rem" }}>
            {!loading && history.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--color-text-secondary)"
              }}>
                <FaHistory size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                <p>No hay análisis registrados todavía.</p>
                <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                  Realiza tu primer análisis de voz para ver los resultados aquí.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "0 0.5rem"
                }}>
                  <thead>
                    <tr style={{
                      color: "var(--color-text-main)",
                      fontWeight: "600",
                      fontSize: "0.9rem"
                    }}>
                      <th style={{ textAlign: "left", padding: "0.75rem" }}>Fecha</th>
                      <th style={{ textAlign: "left", padding: "0.75rem" }}>Audio</th>
                      <th style={{ textAlign: "center", padding: "0.75rem" }}>Duración</th>
                      <th style={{ textAlign: "center", padding: "0.75rem" }}>Estado</th>
                      <th style={{ textAlign: "center", padding: "0.75rem" }}>Clasificación</th>
                      <th style={{ textAlign: "center", padding: "0.75rem" }}>Nivel</th>
                      <th style={{ textAlign: "center", padding: "0.75rem" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHistory.map((item) => (
                      <tr
                        key={item.id_analisis}
                        style={{
                          background: "var(--color-panel)",
                          transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px var(--color-shadow)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <td style={{ padding: "1rem", borderRadius: "8px 0 0 8px" }}>
                          <div style={{ fontSize: "0.9rem" }}>
                            {formatDate(item.fecha_analisis)}
                          </div>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                            {item.nombre_archivo || "Audio sin nombre"}
                          </div>
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          <div style={{ fontSize: "0.9rem" }}>
                            {formatDuration(item.duracion)}
                          </div>
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          {getEstadoBadge(item.estado_analisis)}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          {item.clasificacion ? (
                            <span style={{
                              color: getClasificacionColor(item.clasificacion),
                              fontWeight: "600",
                              fontSize: "0.9rem"
                            }}>
                              {item.clasificacion}
                            </span>
                          ) : (
                            <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                              N/A
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          {item.nivel_estres !== null && item.nivel_estres !== undefined ? (
                            <div style={{ fontSize: "0.9rem" }}>
                              <div>Estrés: <strong>{item.nivel_estres}%</strong></div>
                              {item.nivel_ansiedad !== null && (
                                <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                                  Ansiedad: {item.nivel_ansiedad}%
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                              N/A
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center", borderRadius: "0 8px 8px 0" }}>
                          <button
                            onClick={() => handleViewDetail(item.id_analisis)}
                            style={{
                              background: "var(--color-primary)",
                              color: "#fff",
                              border: "none",
                              padding: "0.5rem 1rem",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              fontSize: "0.9rem",
                              transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = "var(--color-primary-hover)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "var(--color-primary)";
                            }}
                          >
                            <FaEye /> Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Componente de paginación */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={history.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </div>
            )}
          </div>
        </PageCard>
    </div>
  );
};

export default Historial;
