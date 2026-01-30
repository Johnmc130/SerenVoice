import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import { 
  FaBrain, 
  FaChartLine, 
  FaCalendarAlt, 
  FaDownload, 
  FaFilter,
  FaUsers,
  FaExclamationTriangle,
  FaSmile,
  FaMeh,
  FaFrown,
  FaAngry
} from "react-icons/fa";
import PageCard from "../../components/Shared/PageCard";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";

const AnalisisAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [periodo, setPeriodo] = useState("7d");
  
  // Estadísticas generales
  const [stats, setStats] = useState({
    total_analisis: 0,
    analisis_hoy: 0,
    usuarios_activos: 0,
    promedio_ansiedad: 0,
    promedio_estres: 0,
    emociones_detectadas: {}
  });
  
  // Datos para gráficas
  const [tendencias, setTendencias] = useState([]);
  const [distribucionEmociones, setDistribucionEmociones] = useState([]);
  const [topUsuarios, setTopUsuarios] = useState([]);

  const periodos = [
    { value: "1d", label: "Hoy" },
    { value: "7d", label: "Última semana" },
    { value: "30d", label: "Último mes" },
    { value: "90d", label: "Últimos 3 meses" }
  ];

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { periodo };
      
      // Cargar resumen general
      const resumenRes = await apiClient.get(api.endpoints.admin.reportes.resumenGeneral, { params });
      const resumenData = resumenRes.data?.data || resumenRes.data || {};
      
      setStats({
        total_analisis: resumenData.total_analisis || 0,
        analisis_hoy: resumenData.analisis_hoy || 0,
        usuarios_activos: resumenData.usuarios_activos || 0,
        promedio_ansiedad: resumenData.promedio_ansiedad || 0,
        promedio_estres: resumenData.promedio_estres || 0,
        emociones_detectadas: resumenData.emociones_detectadas || {}
      });

      // Cargar tendencias
      const tendenciasRes = await apiClient.get(api.endpoints.admin.reportes.tendencias, { params });
      setTendencias(tendenciasRes.data?.data || []);

      // Cargar distribución de emociones
      const emocionesRes = await apiClient.get(api.endpoints.admin.reportes.distribucionEmociones, { params });
      setDistribucionEmociones(emocionesRes.data?.data || []);

      // Cargar usuarios más activos
      const usuariosRes = await apiClient.get(api.endpoints.admin.reportes.usuariosEstadisticas, { params });
      setTopUsuarios((usuariosRes.data?.data || []).slice(0, 10));

    } catch (error) {
      console.error("Error cargando datos de análisis:", error);
      setMsg("Error al cargar datos de análisis");
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const getEmocionIcon = (emocion) => {
    const icons = {
      felicidad: { icon: <FaSmile />, color: "#4caf50" },
      neutral: { icon: <FaMeh />, color: "#9e9e9e" },
      tristeza: { icon: <FaFrown />, color: "#2196f3" },
      ansiedad: { icon: <FaExclamationTriangle />, color: "#ff9800" },
      estres: { icon: <FaAngry />, color: "#ff6b6b" },
      miedo: { icon: <FaFrown />, color: "#9c27b0" },
      enojo: { icon: <FaAngry />, color: "#e91e63" },
      sorpresa: { icon: <FaSmile />, color: "#00bcd4" }
    };
    return icons[emocion?.toLowerCase()] || { icon: <FaMeh />, color: "#9e9e9e" };
  };

  const getNivelColor = (valor) => {
    if (valor >= 0.7) return "#ff6b6b";
    if (valor >= 0.5) return "#ff9800";
    if (valor >= 0.3) return "#ffc107";
    return "#4caf50";
  };

  const getNivelTexto = (valor) => {
    if (valor >= 0.7) return "Alto";
    if (valor >= 0.5) return "Moderado";
    if (valor >= 0.3) return "Bajo";
    return "Muy bajo";
  };

  const exportarDatos = () => {
    const data = {
      periodo,
      fecha_exportacion: new Date().toISOString(),
      estadisticas: stats,
      tendencias,
      distribucion_emociones: distribucionEmociones
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analisis_emocional_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setMsg("Datos exportados correctamente");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="admin-analisis-page">
      <div className="admin-page-content">
        {/* Header y Filtros en PageCard */}
        <PageCard size="xl">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", margin: 0 }}>
              <FaBrain style={{ color: "#9c27b0" }} /> Dashboard de Análisis Emocional
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: "0.5rem 0 0 0" }}>Visualiza métricas y tendencias de análisis emocional</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', alignItems: 'flex-end', overflowX: 'auto' }}>
            <div style={{ flex: 1, minWidth: '160px', maxWidth: '300px' }}>
              <div className="input-labels">
                <label><FaCalendarAlt /> Periodo</label>
              </div>
              <div className="input-group no-icon">
                <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                  {periodos.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={exportarDatos} className="admin-btn admin-btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              <FaDownload /> <span className="admin-hidden-mobile">Exportar</span>
            </button>
          </div>
        </PageCard>

        {msg && <div className="admin-message admin-message-success">{msg}</div>}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Cargando datos de análisis...</p>
          </div>
        ) : (
          <>
            {/* Estadísticas principales */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon">📊</div>
                <div className="admin-stat-value">{stats.total_analisis.toLocaleString()}</div>
                <div className="admin-stat-label">Total Análisis</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">📈</div>
                <div className="admin-stat-value">{stats.analisis_hoy}</div>
                <div className="admin-stat-label">Análisis Hoy</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">👥</div>
                <div className="admin-stat-value">{stats.usuarios_activos}</div>
                <div className="admin-stat-label">Usuarios Activos</div>
              </div>
              <div className="admin-stat-card" style={{ borderLeft: `4px solid ${getNivelColor(stats.promedio_ansiedad)}` }}>
                <div className="admin-stat-icon">😰</div>
                <div className="admin-stat-value">{(stats.promedio_ansiedad * 100).toFixed(1)}%</div>
                <div className="admin-stat-label">Ansiedad Promedio</div>
                <div className="admin-stat-trend" style={{ color: getNivelColor(stats.promedio_ansiedad) }}>
                  {getNivelTexto(stats.promedio_ansiedad)}
                </div>
              </div>
              <div className="admin-stat-card" style={{ borderLeft: `4px solid ${getNivelColor(stats.promedio_estres)}` }}>
                <div className="admin-stat-icon">😤</div>
                <div className="admin-stat-value">{(stats.promedio_estres * 100).toFixed(1)}%</div>
                <div className="admin-stat-label">Estrés Promedio</div>
                <div className="admin-stat-trend" style={{ color: getNivelColor(stats.promedio_estres) }}>
                  {getNivelTexto(stats.promedio_estres)}
                </div>
              </div>
            </div>

            {/* Distribución de Emociones */}
            <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
              <div className="admin-card-header">
                <h3><FaChartLine /> Distribución de Emociones Detectadas</h3>
              </div>
              <div className="admin-card-body">
                {distribucionEmociones.length > 0 ? (
                  <div className="admin-emotion-grid">
                    {distribucionEmociones.map((item, index) => {
                      const { icon, color } = getEmocionIcon(item.emocion || item.nombre);
                      const porcentaje = item.porcentaje || item.count || 0;
                      return (
                        <div key={index} className="admin-emotion-item">
                          <div className="admin-emotion-header">
                            <span style={{ color, fontSize: "1.5rem" }}>{icon}</span>
                            <span style={{ textTransform: "capitalize", fontWeight: 500 }}>
                              {item.emocion || item.nombre}
                            </span>
                          </div>
                          <div className="admin-progress-bar">
                            <div 
                              className="admin-progress-fill"
                              style={{ 
                                width: `${Math.min(porcentaje, 100)}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                          <div className="admin-emotion-value">
                            {typeof porcentaje === 'number' ? porcentaje.toFixed(1) : porcentaje}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="admin-empty-state" style={{ padding: "2rem" }}>
                    <FaBrain />
                    <p>No hay datos de emociones para el periodo seleccionado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tendencias y Usuarios activos */}
            <div className="admin-grid-2">
              {/* Tendencias recientes */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3><FaChartLine /> Tendencias Recientes</h3>
                </div>
                <div className="admin-card-body">
                  {tendencias.length > 0 ? (
                    <div className="admin-tendencias-list">
                      {tendencias.slice(0, 7).map((item, index) => (
                        <div key={index} className="admin-tendencia-item">
                          <div className="admin-tendencia-fecha">
                            {new Date(item.fecha).toLocaleDateString('es', { weekday: 'short', day: 'numeric' })}
                          </div>
                          <div className="admin-tendencia-bars">
                            <div className="admin-mini-bar">
                              <span className="admin-mini-label">Ansiedad</span>
                              <div className="admin-mini-progress">
                                <div 
                                  style={{ 
                                    width: `${(item.ansiedad || 0) * 100}%`,
                                    backgroundColor: getNivelColor(item.ansiedad || 0),
                                    height: "100%",
                                    borderRadius: "2px"
                                  }}
                                />
                              </div>
                              <span className="admin-mini-value">{((item.ansiedad || 0) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="admin-mini-bar">
                              <span className="admin-mini-label">Estrés</span>
                              <div className="admin-mini-progress">
                                <div 
                                  style={{ 
                                    width: `${(item.estres || 0) * 100}%`,
                                    backgroundColor: getNivelColor(item.estres || 0),
                                    height: "100%",
                                    borderRadius: "2px"
                                  }}
                                />
                              </div>
                              <span className="admin-mini-value">{((item.estres || 0) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="admin-tendencia-count">
                            {item.total || item.count || 0} análisis
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-empty-state" style={{ padding: "2rem" }}>
                      <FaChartLine />
                      <p>No hay tendencias disponibles</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Usuarios más activos */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3><FaUsers /> Usuarios Más Activos</h3>
                </div>
                <div className="admin-card-body">
                  {topUsuarios.length > 0 ? (
                    <div className="admin-usuarios-list">
                      {topUsuarios.map((usuario, index) => (
                        <div key={index} className="admin-usuario-item">
                          <div className="admin-usuario-rank">#{index + 1}</div>
                          <div className="admin-usuario-info">
                            <div className="admin-usuario-nombre">
                              {usuario.nombre || usuario.email || `Usuario ${usuario.id_usuario}`}
                            </div>
                            <div className="admin-usuario-stats">
                              <span>{usuario.total_analisis || usuario.count || 0} análisis</span>
                              {usuario.promedio_ansiedad !== undefined && (
                                <span style={{ color: getNivelColor(usuario.promedio_ansiedad) }}>
                                  • Ansiedad: {(usuario.promedio_ansiedad * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="admin-usuario-badge">
                            {usuario.clasificacion === 'critico' && (
                              <span className="admin-badge admin-badge-danger">⚠️ Crítico</span>
                            )}
                            {usuario.clasificacion === 'alerta' && (
                              <span className="admin-badge admin-badge-warning">⚡ Alerta</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-empty-state" style={{ padding: "2rem" }}>
                      <FaUsers />
                      <p>No hay datos de usuarios disponibles</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Métricas de IA */}
            <div className="admin-card" style={{ marginTop: "1.5rem" }}>
              <div className="admin-card-header">
                <h3><FaBrain /> Métricas del Modelo de IA</h3>
              </div>
              <div className="admin-card-body">
                <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <div className="admin-stat-card admin-stat-card-sm">
                    <div className="admin-stat-icon">🎯</div>
                    <div className="admin-stat-value">94.5%</div>
                    <div className="admin-stat-label">Precisión del Modelo</div>
                  </div>
                  <div className="admin-stat-card admin-stat-card-sm">
                    <div className="admin-stat-icon">⚡</div>
                    <div className="admin-stat-value">1.2s</div>
                    <div className="admin-stat-label">Tiempo Promedio</div>
                  </div>
                  <div className="admin-stat-card admin-stat-card-sm">
                    <div className="admin-stat-icon">🔊</div>
                    <div className="admin-stat-value">8</div>
                    <div className="admin-stat-label">Emociones Detectables</div>
                  </div>
                  <div className="admin-stat-card admin-stat-card-sm">
                    <div className="admin-stat-icon">📁</div>
                    <div className="admin-stat-value">CNN</div>
                    <div className="admin-stat-label">Tipo de Modelo</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalisisAdmin;
