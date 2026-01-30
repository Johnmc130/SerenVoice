import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChartBar, FaChartPie, FaChartLine, FaTrophy, FaUsers, 
  FaBell, FaLightbulb, FaGamepad, FaSmile, FaClock, FaCalendar, 
  FaSyncAlt, FaDownload, FaArrowLeft
} from 'react-icons/fa';
import reportesService from '../../services/reportesService';
import PageCard from '../../components/Shared/PageCard';
import Spinner from '../../components/Publico/Spinner';
import '../../global.css';

// Colores para emociones
const emotionColors = {
  feliz: '#4CAF50',
  triste: '#2196F3',
  enojado: '#ff6b6b',
  asustado: '#9C27B0',
  sorprendido: '#FF9800',
  neutral: '#607D8B',
  ansiedad: '#E91E63',
  estres: '#FF5722',
  felicidad: '#4CAF50',
  tristeza: '#2196F3',
  enojo: '#ff6b6b',
  miedo: '#9C27B0',
  sorpresa: '#FF9800',
  asco: '#795548',
  disgusto: '#795548',
};

// Colores para clasificaciones
const classificationColors = {
  normal: '#4CAF50',
  leve: '#8BC34A',
  moderado: '#FFC107',
  alto: '#FF9800',
  muy_alto: '#ff6b6b',
};

// Días de la semana
const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Reportes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('resumen');

  const cargarReporte = useCallback(async () => {
    try {
      setError(null);
      const data = await reportesService.obtenerReporteCompleto();
      setReporte(data);
    } catch (err) {
      console.error('Error cargando reporte:', err);
      setError(err.message || 'Error al cargar el reporte');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarReporte();
  };

  // Componente: Tarjeta de estadística
  const StatCard = ({ icon, title, value, subtitle, color = 'var(--color-primary)' }) => {
    const Icon = icon;
    return (
    <div style={{
      background: 'var(--color-panel)',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid var(--color-shadow)',
      transition: 'transform 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

  // Componente: Barra de progreso
  const ProgressBar = ({ value, maxValue = 100, color = 'var(--color-primary)', label }) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    return (
      <div style={{ marginBottom: '1rem' }}>
        {label && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
            <span style={{ color: 'var(--color-text-main)', fontWeight: '600' }}>{value.toFixed(1)}%</span>
          </div>
        )}
        <div style={{
          height: '8px',
          background: 'var(--color-panel-solid)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: color,
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    );
  };

  // Componente: Botón de sección
  const SectionButton = ({ id, icon, label }) => {
    const Icon = icon;
    return (
    <button
      onClick={() => setActiveSection(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.25rem',
        borderRadius: '25px',
        border: 'none',
        background: activeSection === id ? 'var(--color-primary)' : 'var(--color-panel-solid)',
        color: activeSection === id ? 'white' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: activeSection === id ? '600' : '400',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap'
      }}
    >
      <Icon size={18} />
      {label}
    </button>
  );
};

  if (loading) {
    return (
      <div className="page-content">
        <PageCard size="xl">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem',marginBottom:'1rem'}}>
            <div>
              <h2 style={{ margin:0, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaChartBar /> Mis Reportes
              </h2>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                Análisis completo de tu progreso y bienestar emocional
              </p>
            </div>
            <div />
          </div>
          <Spinner message="Cargando tu reporte..." />
        </PageCard>
      </div>
    );
  }

  if (error) {
    return (
      <PageCard size="md">
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <FaChartBar size={64} style={{ color: '#ff6b6b', opacity: 0.5, marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Error al cargar el reporte</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={cargarReporte} className="auth-button">
            <FaSyncAlt style={{ marginRight: '0.5rem' }} /> Reintentar
          </button>
        </div>
      </PageCard>
    );
  }

  return (
    <div className="page-content">
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

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FaChartBar /> Mis Reportes
            </h2>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              Análisis completo de tu progreso y bienestar emocional
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="auth-button"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FaSyncAlt className={refreshing ? 'rotating' : ''} /> Actualizar
          </button>
        </div>

        {/* Navegación de secciones */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          marginBottom: '2rem',
          paddingBottom: '0.5rem'
        }}>
          <SectionButton id="resumen" icon={FaChartBar} label="Resumen" />
          <SectionButton id="emociones" icon={FaSmile} label="Emociones" />
          <SectionButton id="tendencias" icon={FaChartLine} label="Tendencias" />
          <SectionButton id="actividad" icon={FaClock} label="Actividad" />
          <SectionButton id="historial" icon={FaCalendar} label="Historial" />
        </div>

        {/* SECCIÓN RESUMEN */}
        {activeSection === 'resumen' && reporte && (
          <div>
            {/* Grid de estadísticas principales */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <StatCard
                icon={FaChartBar}
                title="Análisis Totales"
                value={reporte.resumen.total_analisis}
                subtitle="Sesiones realizadas"
                color="#4dd4ac"
              />
              <StatCard
                icon={FaChartLine}
                title="Estrés Promedio"
                value={`${reporte.resumen.promedio_estres.toFixed(1)}%`}
                color="#FF6B6B"
              />
              <StatCard
                icon={FaChartLine}
                title="Ansiedad Promedio"
                value={`${reporte.resumen.promedio_ansiedad.toFixed(1)}%`}
                color="#4ECDC4"
              />
              <StatCard
                icon={FaGamepad}
                title="Juegos Completados"
                value={reporte.juegos.completados}
                subtitle={`${reporte.juegos.total} sesiones totales`}
                color="#FFD93D"
              />
            </div>

            {/* Fila de estadísticas adicionales */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'var(--color-panel)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--color-shadow)',
                textAlign: 'center'
              }}>
                <FaUsers size={32} color="#9C27B0" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                  {reporte.grupos}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Grupos
                </div>
              </div>

              <div style={{
                background: 'var(--color-panel)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--color-shadow)',
                textAlign: 'center'
              }}>
                <FaLightbulb size={32} color="#FF9800" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                  {reporte.recomendaciones.total}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Recomendaciones
                </div>
              </div>

              <div style={{
                background: 'var(--color-panel)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--color-shadow)',
                textAlign: 'center'
              }}>
                <FaBell size={32} color="#ff6b6b" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                  {reporte.alertas.total}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Alertas
                </div>
              </div>
            </div>

            {/* Niveles máximos */}
            <div style={{
              background: 'var(--color-panel)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid var(--color-shadow)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-main)' }}>
                Niveles Máximos Registrados
              </h3>
              <ProgressBar
                value={reporte.resumen.max_estres}
                color="#FF6B6B"
                label="Estrés máximo"
              />
              <ProgressBar
                value={reporte.resumen.max_ansiedad}
                color="#4ECDC4"
                label="Ansiedad máxima"
              />
            </div>

            {/* Tasa de efectividad */}
            {reporte.recomendaciones.total > 0 && (
              <div style={{
                background: `${parseInt('4dd4ac', 16)}10`,
                border: '1px solid var(--color-primary)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  Efectividad en Aplicación
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  {((reporte.recomendaciones.aplicadas / reporte.recomendaciones.total) * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  de recomendaciones aplicadas
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN EMOCIONES */}
        {activeSection === 'emociones' && reporte && (
          <div>
            <h2 style={{ color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
              😊 Análisis de Emociones
            </h2>

            {reporte.emociones && reporte.emociones.length > 0 ? (
              <>
                {/* Tarjeta de emoción predominante */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05))',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: '12px',
                  padding: '2rem',
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
                    {(() => {
                      const emociones = {
                        feliz: '😊', triste: '😢', enojado: '😠', asustado: '😨',
                        sorprendido: '😲', neutral: '😐', felicidad: '😊', tristeza: '😢',
                        enojo: '😠', miedo: '😨', sorpresa: '😲', asco: '🤢', disgusto: '🤢'
                      };
                      return emociones[reporte.emociones[0].emocion_principal?.toLowerCase()] || '😐';
                    })()}
                  </div>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    color: emotionColors[reporte.emociones[0].emocion_principal?.toLowerCase()] || '#607D8B',
                    textTransform: 'capitalize',
                    fontSize: '1.5rem'
                  }}>
                    {reporte.emociones[0].emocion_principal}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                    🏆 Emoción Predominante • {reporte.emociones[0].cantidad} detecciones •{' '}
                    {((reporte.emociones[0].cantidad / reporte.emociones.reduce((sum, e) => sum + e.cantidad, 0)) * 100).toFixed(1)}% del total
                  </p>
                </div>

                {/* Lista de emociones */}
                <div style={{
                  background: 'var(--color-panel)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid var(--color-shadow)'
                }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-main)' }}>
                    Distribución de Emociones
                  </h3>
                  {reporte.emociones.map((emotion, index) => {
                    const total = reporte.emociones.reduce((sum, e) => sum + e.cantidad, 0);
                    const percentage = ((emotion.cantidad / total) * 100);
                    const color = emotionColors[emotion.emocion_principal?.toLowerCase()] || '#607D8B';

                    return (
                      <div key={index} style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{
                            color: 'var(--color-text-main)',
                            fontWeight: '500',
                            textTransform: 'capitalize',
                            fontSize: '1rem'
                          }}>
                            {emotion.emocion_principal}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                              {emotion.cantidad} veces
                            </span>
                            <span style={{ color, fontWeight: 'bold', fontSize: '1rem' }}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div style={{
                          height: '12px',
                          background: 'var(--color-panel-solid)',
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: color,
                            borderRadius: '6px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Clasificaciones */}
                {Object.keys(reporte.clasificaciones).length > 0 && (
                  <div style={{
                    background: 'var(--color-panel)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid var(--color-shadow)',
                    marginTop: '2rem'
                  }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-main)' }}>
                      Clasificaciones de Análisis
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {Object.entries(reporte.clasificaciones).map(([key, value]) => (
                        <div key={key} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: classificationColors[key] || '#607D8B',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>
                          <span style={{ textTransform: 'capitalize' }}>
                            {key.replace('_', ' ')}
                          </span>
                          <span style={{
                            background: 'rgba(255,255,255,0.3)',
                            padding: '2px 8px',
                            borderRadius: '10px'
                          }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <FaSmile size={64} style={{ color: 'var(--color-text-secondary)', opacity: 0.3, marginBottom: '1rem' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Aún no hay emociones detectadas. Realiza análisis de voz para ver tu perfil emocional.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN TENDENCIAS */}
        {activeSection === 'tendencias' && reporte && (
          <div>
            <h2 style={{ color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
              📈 Tendencias de Estrés y Ansiedad
            </h2>

            {/* Últimos 10 días */}
            {reporte.tendencia_diaria && reporte.tendencia_diaria.length > 0 && (
              <div style={{
                background: 'var(--color-panel)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--color-shadow)',
                marginBottom: '2rem'
              }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-main)' }}>
                  Últimos 10 Días
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '200px' }}>
                  {reporte.tendencia_diaria.slice(-10).map((item, index) => {
                    const maxValue = Math.max(...reporte.tendencia_diaria.map(d => Math.max(d.estres || 0, d.ansiedad || 0)), 1);
                    const stressHeight = ((item.estres || 0) / maxValue) * 100;
                    const anxietyHeight = ((item.ansiedad || 0) / maxValue) * 100;

                    return (
                      <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '4px', height: '150px', alignItems: 'flex-end' }}>
                          <div
                            title={`Estrés: ${item.estres?.toFixed(1)}%`}
                            style={{
                              width: '16px',
                              height: `${Math.max(stressHeight, 3)}%`,
                              background: '#FF6B6B',
                              borderRadius: '4px 4px 0 0'
                            }}
                          />
                          <div
                            title={`Ansiedad: ${item.ansiedad?.toFixed(1)}%`}
                            style={{
                              width: '16px',
                              height: `${Math.max(anxietyHeight, 3)}%`,
                              background: '#4ECDC4',
                              borderRadius: '4px 4px 0 0'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                          {item.fecha?.substring(5) || index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: '#FF6B6B', borderRadius: '2px' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Estrés</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: '#4ECDC4', borderRadius: '2px' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Ansiedad</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tendencia mensual */}
            {reporte.tendencia_mensual && reporte.tendencia_mensual.length > 0 && (
              <div style={{
                background: 'var(--color-panel)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--color-shadow)'
              }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-main)' }}>
                  Tendencia Mensual (Últimos 6 meses)
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '200px' }}>
                  {reporte.tendencia_mensual.slice(-6).map((item, index) => {
                    const maxValue = Math.max(...reporte.tendencia_mensual.map(d => Math.max(d.promedio_estres || 0, d.promedio_ansiedad || 0)), 1);
                    const stressHeight = ((item.promedio_estres || 0) / maxValue) * 100;
                    const anxietyHeight = ((item.promedio_ansiedad || 0) / maxValue) * 100;

                    return (
                      <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '4px', height: '150px', alignItems: 'flex-end' }}>
                          <div
                            title={`Estrés: ${item.promedio_estres?.toFixed(1)}%`}
                            style={{
                              width: '20px',
                              height: `${Math.max(stressHeight, 3)}%`,
                              background: '#FF6B6B',
                              borderRadius: '4px 4px 0 0'
                            }}
                          />
                          <div
                            title={`Ansiedad: ${item.promedio_ansiedad?.toFixed(1)}%`}
                            style={{
                              width: '20px',
                              height: `${Math.max(anxietyHeight, 3)}%`,
                              background: '#4ECDC4',
                              borderRadius: '4px 4px 0 0'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {item.mes?.substring(5) || index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: '#FF6B6B', borderRadius: '2px' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Estrés Prom.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: '#4ECDC4', borderRadius: '2px' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Ansiedad Prom.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN ACTIVIDAD */}
        {activeSection === 'actividad' && reporte && (
          <div>
            <h2 style={{ color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
              ⏰ Patrones de Actividad
            </h2>

            {/* Actividad por hora */}
            {reporte.actividad_horaria && reporte.actividad_horaria.length > 0 && (
              <div style={{
                background: 'var(--color-panel)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--color-shadow)',
                marginBottom: '2rem'
              }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-main)' }}>
                  Análisis por Hora del Día
                </h3>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end', height: '150px' }}>
                  {reporte.actividad_horaria.map((item, index) => {
                    const maxHora = Math.max(...reporte.actividad_horaria.map(h => h.cantidad), 1);
                    const height = (item.cantidad / maxHora) * 100;

                    return (
                      <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <div
                          title={`${item.hora}h: ${item.cantidad} análisis`}
                          style={{
                            width: '100%',
                            height: `${Math.max(height, 4)}%`,
                            background: 'var(--color-primary)',
                            borderRadius: '2px 2px 0 0'
                          }}
                        />
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                          {item.hora}h
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actividad por día de la semana */}
            {reporte.actividad_semanal && reporte.actividad_semanal.length > 0 && (
              <div style={{
                background: 'var(--color-panel)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--color-shadow)',
                marginBottom: '2rem'
              }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-main)' }}>
                  Análisis por Día de la Semana
                </h3>
                {reporte.actividad_semanal.map((item, index) => {
                  const maxDia = Math.max(...reporte.actividad_semanal.map(d => d.cantidad), 1);
                  const widthPercent = (item.cantidad / maxDia) * 100;

                  return (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '0.75rem'
                    }}>
                      <span style={{
                        width: '50px',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-secondary)'
                      }}>
                        {diasSemana[item.dia - 1] || item.dia}
                      </span>
                      <div style={{
                        flex: 1,
                        height: '24px',
                        background: 'var(--color-panel-solid)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.max(widthPercent, 5)}%`,
                          height: '100%',
                          background: 'var(--color-primary)',
                          borderRadius: '12px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{
                        width: '40px',
                        textAlign: 'right',
                        fontSize: '0.9rem',
                        color: 'var(--color-text-main)',
                        fontWeight: '600'
                      }}>
                        {item.cantidad}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Estadísticas de juegos */}
            <div style={{
              background: 'var(--color-panel)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid var(--color-shadow)'
            }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-main)' }}>
                🎮 Estadísticas de Juegos
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <FaGamepad size={32} color="#FFD93D" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                    {reporte.juegos.total}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Sesiones
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <FaTrophy size={32} color="#4CAF50" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                    {reporte.juegos.completados}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Completados
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <FaChartBar size={32} color="#FF9800" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                    {reporte.juegos.promedio_puntuacion.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Puntuación Prom.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN HISTORIAL */}
        {activeSection === 'historial' && reporte && (
          <div>
            <h2 style={{ color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
              📋 Últimos Análisis
            </h2>

            {reporte.ultimos_analisis && reporte.ultimos_analisis.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reporte.ultimos_analisis.map((item, index) => (
                  <div key={index} style={{
                    background: 'var(--color-panel)',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid var(--color-shadow)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        background: emotionColors[item.emocion_principal] || '#607D8B',
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {item.emocion_principal || 'Sin emoción'}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(item.fecha_analisis).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '1rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                          Estrés
                        </div>
                        <div style={{
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          color: item.nivel_estres > 50 ? '#FF6B6B' : '#4CAF50'
                        }}>
                          {item.nivel_estres?.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                          Ansiedad
                        </div>
                        <div style={{
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          color: item.nivel_ansiedad > 50 ? '#4ECDC4' : '#4CAF50'
                        }}>
                          {item.nivel_ansiedad?.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                          Clasificación
                        </div>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: classificationColors[item.clasificacion] || '#607D8B',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {item.clasificacion || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <FaCalendar size={64} style={{ color: 'var(--color-text-secondary)', opacity: 0.3, marginBottom: '1rem' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  No hay análisis registrados. Realiza tu primer análisis de voz para ver tus estadísticas.
                </p>
              </div>
            )}
          </div>
        )}
      </PageCard>

      {/* CSS para animación de rotación */}
      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
