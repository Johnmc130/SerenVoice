import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../../global.css";
import PageCard from "../../components/Shared/PageCard";
import Pagination from "../../components/Shared/Pagination";
import Spinner from "../../components/Publico/Spinner";
import { 
  FaHeart, 
  FaCheck, 
  FaHeartbeat, 
  FaPause, 
  FaPray, 
  FaDumbbell, 
  FaUserMd, 
  FaCoffee, 
  FaLeaf,
  FaExclamationTriangle,
  FaThumbsUp,
  FaThumbsDown,
  FaCalendarAlt,
  FaSync,
  FaMicrophone,
  FaArrowLeft,
  FaFilter,
  FaTimes
} from "react-icons/fa";
import apiClient from '../../services/apiClient';
import api from '../../config/api';

const ITEMS_PER_PAGE = 10;

const Recomendaciones = () => {
  const navigate = useNavigate();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingId, setMarkingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const cardRef = useRef(null);

  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tipo: "",
    prioridad: "",
    aplicada: "",
    fecha_inicio: "",
    fecha_fin: ""
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  useEffect(() => {
    fetchRecomendaciones();
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;
    const els = cardRef.current.querySelectorAll(".reveal");
    els.forEach((el) => el.classList.add("reveal-visible"));
    if (cardRef.current.classList.contains("reveal"))
      cardRef.current.classList.add("reveal-visible");
  }, [recs]);

  const fetchRecomendaciones = async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Recomendaciones] Cargando recomendaciones del usuario...', filterParams);
      
      // Construir query params
      const params = new URLSearchParams();
      if (filterParams.tipo) params.append('tipo', filterParams.tipo);
      if (filterParams.prioridad) params.append('prioridad', filterParams.prioridad);
      if (filterParams.aplicada !== undefined && filterParams.aplicada !== "") {
        params.append('aplicada', filterParams.aplicada);
      }
      if (filterParams.fecha_inicio) params.append('fecha_inicio', filterParams.fecha_inicio);
      if (filterParams.fecha_fin) params.append('fecha_fin', filterParams.fecha_fin);
      
      const queryString = params.toString();
      const url = queryString 
        ? `${api.endpoints.recomendaciones.list}?${queryString}`
        : api.endpoints.recomendaciones.list;
      
      const response = await apiClient.get(url);
      console.log('[Recomendaciones] Respuesta:', response.data);
      const data = response.data;
      if (data?.success) {
        const recomendaciones = data.data?.recomendaciones || [];
        console.log('[Recomendaciones] Total recomendaciones:', recomendaciones.length);
        setRecs(recomendaciones);
      } else {
        throw new Error(data?.message || 'Error al cargar recomendaciones');
      }
    } catch (e) {
      console.error('[Recomendaciones] Error:', e);
      setError(e.response?.data?.message || e.message || 'Error al cargar recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    const activeFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== undefined) {
        activeFilters[key] = value;
      }
    });
    setAppliedFilters(activeFilters);
    setCurrentPage(1);
    fetchRecomendaciones(activeFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      tipo: "",
      prioridad: "",
      aplicada: "",
      fecha_inicio: "",
      fecha_fin: ""
    });
    setAppliedFilters({});
    setCurrentPage(1);
    fetchRecomendaciones({});
  };

  const removeFilter = (key) => {
    const newFilters = { ...filters, [key]: "" };
    setFilters(newFilters);
    const activeFilters = {};
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== "" && v !== undefined) {
        activeFilters[k] = v;
      }
    });
    setAppliedFilters(activeFilters);
    setCurrentPage(1);
    fetchRecomendaciones(activeFilters);
  };

  const getFilterLabel = (key, value) => {
    const labels = {
      tipo: {
        respiracion: "Tipo: Respiración",
        pausa_activa: "Tipo: Pausa Activa",
        meditacion: "Tipo: Meditación",
        ejercicio: "Tipo: Ejercicio",
        profesional: "Tipo: Profesional",
        habito: "Tipo: Hábito"
      },
      prioridad: {
        alta: "Prioridad: Alta",
        media: "Prioridad: Media",
        baja: "Prioridad: Baja"
      },
      aplicada: {
        "1": "Estado: Aplicada",
        "0": "Estado: Pendiente"
      }
    };
    if (key === "fecha_inicio") return `Desde: ${value}`;
    if (key === "fecha_fin") return `Hasta: ${value}`;
    return labels[key]?.[value] || `${key}: ${value}`;
  };

  const markApplied = async (id) => {
    setMarkingId(id);
    try {
      await apiClient.put(api.endpoints.recomendaciones.marcarAplicada(id));
      setRecs((prev) =>
        prev.map((r) => (r.id_recomendacion === id ? { ...r, aplica: 1, fecha_aplica: new Date().toISOString() } : r))
      );
    } catch (e) {
      console.error('[Recomendaciones] Error al marcar:', e);
    } finally {
      setMarkingId(null);
    }
  };

  const markUtil = async (id, util) => {
    try {
      await apiClient.put(api.endpoints.recomendaciones.marcarUtil(id), { util });
      setRecs((prev) =>
        prev.map((r) => (r.id_recomendacion === id ? { ...r, util: util ? 1 : 0 } : r))
      );
    } catch (e) {
      console.error('[Recomendaciones] Error al marcar útil:', e);
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

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'alta': return '#ff6b6b';
      case 'media': return '#ff9800';
      case 'baja': return '#4caf50';
      default: return 'var(--color-text-secondary)';
    }
  };

  const getTipoLabel = (tipo) => {
    const t = (tipo || '').toString().toLowerCase();
    const labels = {
      'respiracion': 'Respiración',
      'pausa_activa': 'Pausa Activa',
      'meditacion': 'Meditación',
      'ejercicio': 'Ejercicio',
      'profesional': 'Profesional',
      'habito': 'Hábito',
    };
    return labels[t] || tipo || 'General';
  };

  // Calcular datos paginados
  const totalPages = Math.ceil(recs.length / ITEMS_PER_PAGE);
  const paginatedRecs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return recs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [recs, currentPage]);

  // Reset a página 1 cuando cambian los datos
  useEffect(() => {
    setCurrentPage(1);
  }, [recs.length]);

  return (
    <div className="recomendaciones-content page-content">
      {loading && <Spinner overlay={true} message="Cargando recomendaciones..." />}

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

        <h2>
          <FaHeart /> Recomendaciones
        </h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Sigue las recomendaciones personalizadas generadas por el sistema basadas en tus análisis emocionales.
        </p>

        {/* Panel de Filtros */}
        <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: showFilters ? "var(--color-primary)" : "var(--color-panel)",
              color: showFilters ? "white" : "var(--color-text-main)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>

          {showFilters && (
            <div className="panel" style={{ padding: "1rem", marginTop: "1rem" }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
                gap: "1rem",
                marginBottom: "1rem"
              }}>
                {/* Filtro por Tipo */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Tipo
                  </label>
                  <select
                    value={filters.tipo}
                    onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg)",
                      color: "var(--color-text-main)"
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="respiracion">Respiración</option>
                    <option value="pausa_activa">Pausa Activa</option>
                    <option value="meditacion">Meditación</option>
                    <option value="ejercicio">Ejercicio</option>
                    <option value="profesional">Profesional</option>
                    <option value="habito">Hábito</option>
                  </select>
                </div>

                {/* Filtro por Prioridad */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Prioridad
                  </label>
                  <select
                    value={filters.prioridad}
                    onChange={(e) => setFilters({ ...filters, prioridad: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg)",
                      color: "var(--color-text-main)"
                    }}
                  >
                    <option value="">Todas</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                {/* Filtro por Estado (Aplicada) */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Estado
                  </label>
                  <select
                    value={filters.aplicada}
                    onChange={(e) => setFilters({ ...filters, aplicada: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg)",
                      color: "var(--color-text-main)"
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="1">Aplicadas</option>
                    <option value="0">Pendientes</option>
                  </select>
                </div>

                {/* Fecha Inicio */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Desde
                  </label>
                  <input
                    type="date"
                    value={filters.fecha_inicio}
                    onChange={(e) => setFilters({ ...filters, fecha_inicio: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg)",
                      color: "var(--color-text-main)"
                    }}
                  />
                </div>

                {/* Fecha Fin */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={filters.fecha_fin}
                    onChange={(e) => setFilters({ ...filters, fecha_fin: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg)",
                      color: "var(--color-text-main)"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={handleApplyFilters}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "var(--color-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <FaFilter /> Aplicar filtros
                </button>
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "var(--color-panel)",
                    color: "var(--color-text-main)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <FaTimes /> Limpiar
                </button>
              </div>
            </div>
          )}

          {/* Tags de filtros aplicados */}
          {Object.keys(appliedFilters).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
              {Object.entries(appliedFilters).map(([key, value]) => (
                <span
                  key={key}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.25rem 0.75rem",
                    background: "var(--color-primary)",
                    color: "white",
                    borderRadius: "20px",
                    fontSize: "0.8rem"
                  }}
                >
                  {getFilterLabel(key, value)}
                  <FaTimes
                    style={{ cursor: "pointer" }}
                    onClick={() => removeFilter(key)}
                  />
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            color: "#ff6b6b",
            padding: 16,
            background: "rgba(255, 107, 107, 0.1)",
            borderRadius: 8,
            border: "2px solid #ff6b6b",
            marginTop: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FaExclamationTriangle size={20} />
              <strong>Error: {error}</strong>
            </div>
          </div>
        )}

        <div style={{ marginTop: "1rem" }}>
          {!loading && recs.length === 0 && !error && (
            <div className="panel" style={{ padding: 24, textAlign: 'center' }}>
              <FaLeaf size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }} />
              <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
                {Object.keys(appliedFilters).length > 0 
                  ? "No se encontraron recomendaciones con los filtros aplicados."
                  : "No tienes recomendaciones todavía. Realiza un análisis de voz para recibir recomendaciones personalizadas."}
              </p>
            </div>
          )}

          {paginatedRecs.map((r) => {
            const Icon = getTipoIcon(r.tipo_recomendacion);
            const prioridad = r.prioridad || 'media';
            const isAplicada = r.aplica === 1 || r.aplica === true;
            const isUtil = r.util === 1 || r.util === true;
            
            return (
              <div
                key={r.id_recomendacion}
                className="panel"
                style={{ 
                  marginBottom: "0.75rem",
                  padding: 16,
                  borderLeft: `4px solid ${getPrioridadColor(prioridad)}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Icon style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }} />
                      <h4 style={{ margin: 0 }}>{getTipoLabel(r.tipo_recomendacion)}</h4>
                      <span style={{
                        marginLeft: 8,
                        fontSize: '0.7rem',
                        background: getPrioridadColor(prioridad),
                        color: 'white',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>{prioridad}</span>
                    </div>
                    <p style={{
                      marginTop: "0.5rem",
                      color: "var(--color-text-secondary)",
                      margin: 0,
                      lineHeight: 1.5
                    }}>
                      {r.contenido}
                    </p>
                    
                    {r.fecha_generacion && (
                      <div style={{ 
                        marginTop: '0.75rem', 
                        fontSize: '0.8rem', 
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <FaCalendarAlt size={12} />
                        {new Date(r.fecha_generacion).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                        {r.clasificacion && (
                          <span style={{ marginLeft: 12 }}>
                            • Clasificación: <strong>{r.clasificacion}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: "0.5rem", marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button
                    disabled={isAplicada || markingId === r.id_recomendacion}
                    onClick={() => markApplied(r.id_recomendacion)}
                    style={{
                      opacity: isAplicada ? 0.7 : 1,
                      background: isAplicada ? '#4caf50' : undefined,
                      color: isAplicada ? 'white' : undefined
                    }}
                  >
                    <FaCheck style={{ marginRight: 6 }} />
                    {markingId === r.id_recomendacion ? 'Guardando...' : (isAplicada ? "Aplicada" : "Marcar como aplicada")}
                  </button>
                  
                  {isAplicada && (
                    <>
                      <button
                        onClick={() => markUtil(r.id_recomendacion, true)}
                        style={{
                          background: isUtil ? '#2196f3' : 'var(--color-panel)',
                          color: isUtil ? 'white' : 'var(--color-text)'
                        }}
                        title="Me fue útil"
                      >
                        <FaThumbsUp />
                      </button>
                      <button
                        onClick={() => markUtil(r.id_recomendacion, false)}
                        style={{
                          background: r.util === 0 && r.util !== null ? '#ff6b6b' : 'var(--color-panel)',
                          color: r.util === 0 && r.util !== null ? 'white' : 'var(--color-text)'
                        }}
                        title="No me fue útil"
                      >
                        <FaThumbsDown />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Componente de paginación */}
          {recs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={recs.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </div>
      </PageCard>
    </div>
  );
};

export default Recomendaciones;
