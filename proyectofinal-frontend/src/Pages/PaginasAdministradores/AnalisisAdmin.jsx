import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import { 
  FaBrain, 
  FaChartLine, 
  FaCalendarAlt, 
  FaDownload, 
  FaUsers,
  FaSyncAlt
} from "react-icons/fa";
import PageCard from "../../components/Shared/PageCard";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";

// Constantes para colores y emojis de emociones
const EMOTION_CONFIG = {
  felicidad: { emoji: "😊", color: "#10b981", gradient: "linear-gradient(135deg, #10b981, #34d399)" },
  neutral: { emoji: "😐", color: "#6b7280", gradient: "linear-gradient(135deg, #6b7280, #9ca3af)" },
  tristeza: { emoji: "😢", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
  ansiedad: { emoji: "😰", color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444, #f87171)" },
  estres: { emoji: "😓", color: "#f97316", gradient: "linear-gradient(135deg, #f97316, #fb923c)" },
  miedo: { emoji: "😨", color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)" },
  enojo: { emoji: "😠", color: "#dc2626", gradient: "linear-gradient(135deg, #dc2626, #f87171)" },
  sorpresa: { emoji: "😲", color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" }
};

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
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const getEmotionConfig = (emocion) => {
    return EMOTION_CONFIG[emocion?.toLowerCase()] || EMOTION_CONFIG.neutral;
  };

  // Normaliza el valor del porcentaje (el backend puede enviar 0-100 o 0-1)
  const normalizePercentage = (value) => {
    if (value === null || value === undefined) return 0;
    // Si el valor es mayor a 1, asumimos que ya está en porcentaje
    if (value > 1) return Math.min(value, 100);
    // Si está entre 0 y 1, lo convertimos a porcentaje
    return value * 100;
  };

  const getNivelColor = (valor) => {
    const normalized = normalizePercentage(valor);
    if (normalized >= 70) return "#ef4444";
    if (normalized >= 50) return "#f97316";
    if (normalized >= 30) return "#fbbf24";
    return "#10b981";
  };

  const getNivelTexto = (valor) => {
    const normalized = normalizePercentage(valor);
    if (normalized >= 70) return "Alto";
    if (normalized >= 50) return "Moderado";
    if (normalized >= 30) return "Bajo";
    return "Muy bajo";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return "N/A";
    }
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
    setMsg("✅ Datos exportados correctamente");
    setTimeout(() => setMsg(""), 3000);
  };

  // Ordenar emociones por porcentaje
  const sortedEmociones = [...distribucionEmociones].sort((a, b) => {
    const porcentajeA = a.porcentaje || a.count || 0;
    const porcentajeB = b.porcentaje || b.count || 0;
    return porcentajeB - porcentajeA;
  });

  // Calcular total para porcentajes
  const totalEmociones = sortedEmociones.reduce((sum, item) => sum + (item.cantidad || item.count || 0), 0);

  return (
    <div className="admin-analisis-page">
      <div className="admin-page-content">
        {/* Header */}
        <PageCard size="xl">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: 0 }}>
                <FaBrain style={{ color: "#9c27b0" }} /> 
                Dashboard de Análisis Emocional
              </h2>
              <p style={{ color: "var(--color-text-secondary)", margin: "0.5rem 0 0 0" }}>
                Visualiza métricas y tendencias de análisis emocional
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Selector de periodo */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'var(--color-panel)', 
                borderRadius: '12px', 
                padding: '0.25rem' 
              }}>
                <FaCalendarAlt style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }} />
                {periodos.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriodo(p.value)}
                    disabled={loading}
                    style={{
                      padding: '0.5rem 0.875rem',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      background: periodo === p.value ? 'var(--color-card)' : 'transparent',
                      color: periodo === p.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      boxShadow: periodo === p.value ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={cargarDatos} 
                disabled={loading}
                className="admin-btn admin-btn-secondary"
              >
                <FaSyncAlt className={loading ? 'spin' : ''} />
              </button>
              
              <button onClick={exportarDatos} className="admin-btn admin-btn-secondary">
                <FaDownload /> Exportar
              </button>
            </div>
          </div>
        </PageCard>

        {msg && (
          <div className={`admin-message ${msg.includes('Error') ? 'admin-message-error' : 'admin-message-success'}`}>
            {msg}
          </div>
        )}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Cargando datos de análisis...</p>
          </div>
        ) : (
          <>
            {/* Estadísticas principales */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem', 
              width: '100%', 
              maxWidth: '1200px' 
            }}>
              {/* Total Análisis */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))',
                borderRadius: '16px',
                padding: '1.5rem',
                borderLeft: '4px solid #6366f1'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📊</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {stats.total_analisis.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Total Análisis</div>
              </div>

              {/* Análisis Hoy */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
                borderRadius: '16px',
                padding: '1.5rem',
                borderLeft: '4px solid #10b981'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📈</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {stats.analisis_hoy}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Análisis Hoy</div>
              </div>

              {/* Usuarios Activos */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                borderRadius: '16px',
                padding: '1.5rem',
                borderLeft: '4px solid #3b82f6'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>👥</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {stats.usuarios_activos}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Usuarios Activos</div>
              </div>

              {/* Ansiedad Promedio */}
              <div style={{
                background: `linear-gradient(135deg, ${getNivelColor(stats.promedio_ansiedad)}15, ${getNivelColor(stats.promedio_ansiedad)}05)`,
                borderRadius: '16px',
                padding: '1.5rem',
                borderLeft: `4px solid ${getNivelColor(stats.promedio_ansiedad)}`
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>😰</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {normalizePercentage(stats.promedio_ansiedad).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Ansiedad Promedio</div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: getNivelColor(stats.promedio_ansiedad),
                  marginTop: '0.25rem'
                }}>
                  {getNivelTexto(stats.promedio_ansiedad)}
                </div>
              </div>

              {/* Estrés Promedio */}
              <div style={{
                background: `linear-gradient(135deg, ${getNivelColor(stats.promedio_estres)}15, ${getNivelColor(stats.promedio_estres)}05)`,
                borderRadius: '16px',
                padding: '1.5rem',
                borderLeft: `4px solid ${getNivelColor(stats.promedio_estres)}`
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>😤</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {normalizePercentage(stats.promedio_estres).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Estrés Promedio</div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: getNivelColor(stats.promedio_estres),
                  marginTop: '0.25rem'
                }}>
                  {getNivelTexto(stats.promedio_estres)}
                </div>
              </div>
            </div>

            {/* Distribución de Emociones - Diseño moderno con cards */}
            <PageCard size="xl">
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <FaChartLine style={{ color: '#6366f1' }} /> Distribución de Emociones Detectadas
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0' }}>
                  Proporción de cada emoción en los análisis realizados
                </p>
              </div>
              
              {sortedEmociones.length > 0 ? (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  {sortedEmociones.map((item, index) => {
                    const emocionKey = (item.emocion || item.nombre || '').toLowerCase();
                    const config = getEmotionConfig(emocionKey);
                    const cantidad = item.cantidad || item.count || 0;
                    const porcentaje = totalEmociones > 0 
                      ? ((cantidad / totalEmociones) * 100).toFixed(1)
                      : (item.porcentaje || 0);
                    
                    return (
                      <div 
                        key={index} 
                        style={{
                          background: `linear-gradient(135deg, ${config.color}15, ${config.color}05)`,
                          borderRadius: '16px',
                          padding: '1.25rem',
                          borderLeft: `4px solid ${config.color}`,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 4px 20px ${config.color}30`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '1.75rem' }}>{config.emoji}</span>
                          <div>
                            <div style={{ 
                              textTransform: 'capitalize', 
                              fontWeight: 600, 
                              color: 'var(--color-text)',
                              fontSize: '0.95rem'
                            }}>
                              {item.emocion || item.nombre}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                              {cantidad.toLocaleString()} análisis
                            </div>
                          </div>
                        </div>
                        
                        {/* Barra de progreso */}
                        <div style={{
                          height: '8px',
                          background: 'var(--color-bg)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(parseFloat(porcentaje), 100)}%`,
                            background: config.gradient,
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                        
                        <div style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: 700, 
                          color: config.color,
                          textAlign: 'right'
                        }}>
                          {porcentaje}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '3rem',
                  color: 'var(--color-text-secondary)'
                }}>
                  <span style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📊</span>
                  <p>No hay datos de emociones para el periodo seleccionado</p>
                </div>
              )}
            </PageCard>

            {/* Grid de Tendencias y Usuarios */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
              gap: '1.5rem', 
              width: '100%', 
              maxWidth: '1200px' 
            }}>
              {/* Tendencias Recientes */}
              <PageCard size="full">
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <FaChartLine style={{ color: '#10b981' }} /> Tendencias Recientes
                  </h3>
                </div>
                
                {tendencias.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {tendencias.slice(0, 7).map((item, index) => {
                      const anxietyVal = normalizePercentage(item.ansiedad || item.promedio_ansiedad || 0);
                      const stressVal = normalizePercentage(item.estres || item.promedio_estres || 0);
                      
                      return (
                        <div 
                          key={index} 
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '100px 1fr auto',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            background: 'var(--color-bg)',
                            borderRadius: '12px'
                          }}
                        >
                          {/* Fecha */}
                          <div style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            color: 'var(--color-text)',
                            whiteSpace: 'nowrap'
                          }}>
                            {formatDate(item.fecha)}
                          </div>
                          
                          {/* Barras */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', width: '55px' }}>
                                Ansiedad
                              </span>
                              <div style={{ 
                                flex: 1, 
                                height: '6px', 
                                background: 'var(--color-border)', 
                                borderRadius: '3px', 
                                overflow: 'hidden' 
                              }}>
                                <div style={{ 
                                  height: '100%', 
                                  width: `${Math.min(anxietyVal, 100)}%`,
                                  background: getNivelColor(item.ansiedad || item.promedio_ansiedad || 0),
                                  borderRadius: '3px'
                                }} />
                              </div>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 600, 
                                color: getNivelColor(item.ansiedad || item.promedio_ansiedad || 0),
                                width: '40px',
                                textAlign: 'right'
                              }}>
                                {anxietyVal.toFixed(0)}%
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', width: '55px' }}>
                                Estrés
                              </span>
                              <div style={{ 
                                flex: 1, 
                                height: '6px', 
                                background: 'var(--color-border)', 
                                borderRadius: '3px', 
                                overflow: 'hidden' 
                              }}>
                                <div style={{ 
                                  height: '100%', 
                                  width: `${Math.min(stressVal, 100)}%`,
                                  background: getNivelColor(item.estres || item.promedio_estres || 0),
                                  borderRadius: '3px'
                                }} />
                              </div>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 600, 
                                color: getNivelColor(item.estres || item.promedio_estres || 0),
                                width: '40px',
                                textAlign: 'right'
                              }}>
                                {stressVal.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          
                          {/* Cantidad */}
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--color-text-secondary)',
                            textAlign: 'right'
                          }}>
                            {item.total || item.count || 0} análisis
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '2rem',
                    color: 'var(--color-text-secondary)'
                  }}>
                    <FaChartLine style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>No hay tendencias disponibles</p>
                  </div>
                )}
              </PageCard>

              {/* Usuarios Más Activos */}
              <PageCard size="full">
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <FaUsers style={{ color: '#3b82f6' }} /> Usuarios Más Activos
                  </h3>
                </div>
                
                {topUsuarios.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {topUsuarios.map((usuario, index) => {
                      const anxietyVal = normalizePercentage(usuario.promedio_ansiedad || 0);
                      
                      return (
                        <div 
                          key={index} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem 1rem',
                            background: index < 3 ? `linear-gradient(135deg, ${['#fbbf24', '#9ca3af', '#cd7f32'][index]}15, transparent)` : 'var(--color-bg)',
                            borderRadius: '12px',
                            borderLeft: index < 3 ? `3px solid ${['#fbbf24', '#9ca3af', '#cd7f32'][index]}` : 'none'
                          }}
                        >
                          {/* Ranking */}
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: index < 3 
                              ? `linear-gradient(135deg, ${['#fbbf24', '#9ca3af', '#cd7f32'][index]}, ${['#f59e0b', '#6b7280', '#a0522d'][index]})`
                              : 'var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: index < 3 ? '#fff' : 'var(--color-text-secondary)'
                          }}>
                            {index + 1}
                          </div>
                          
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: 600, 
                              color: 'var(--color-text)',
                              fontSize: '0.95rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {usuario.nombre || usuario.email || `Usuario ${usuario.id_usuario}`}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--color-text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span>{usuario.total_analisis || usuario.count || 0} análisis</span>
                              {usuario.promedio_ansiedad !== undefined && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: getNivelColor(usuario.promedio_ansiedad) }}>
                                    Ansiedad: {anxietyVal.toFixed(0)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Badge */}
                          {usuario.clasificacion === 'critico' && (
                            <span style={{ 
                              background: '#ef4444', 
                              color: 'white', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '6px', 
                              fontSize: '0.7rem',
                              fontWeight: 600
                            }}>
                              ⚠️ Crítico
                            </span>
                          )}
                          {usuario.clasificacion === 'alerta' && (
                            <span style={{ 
                              background: '#f97316', 
                              color: 'white', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '6px', 
                              fontSize: '0.7rem',
                              fontWeight: 600
                            }}>
                              ⚡ Alerta
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '2rem',
                    color: 'var(--color-text-secondary)'
                  }}>
                    <FaUsers style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>No hay datos de usuarios disponibles</p>
                  </div>
                )}
              </PageCard>
            </div>

            {/* Métricas de IA */}
            <PageCard size="xl">
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <FaBrain style={{ color: '#9c27b0' }} /> Métricas del Modelo de IA
                </h3>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1rem' 
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>94.5%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Precisión</div>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>1.2s</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Tiempo Promedio</div>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔊</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>8</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Emociones</div>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🧠</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f97316' }}>CNN</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Tipo Modelo</div>
                </div>
              </div>
            </PageCard>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalisisAdmin;
