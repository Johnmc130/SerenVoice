import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { FaChartBar, FaUsers, FaBrain, FaExclamationTriangle, FaHeartbeat, FaSyncAlt, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';
import apiClient from '../../services/apiClient';
import api from '../../config/api';
import { ThemeContext } from '../../context/themeContextDef';
import PageCard from '../../components/Shared/PageCard';
import AdminCard from '../../components/Administrador/AdminCard';
import TendenciasChart from '../../components/Administrador/Reportes/TendenciasChart';
import DistribucionEmocionalChart from '../../components/Administrador/Reportes/DistribucionEmocionalChart';
import ClasificacionChart from '../../components/Administrador/Reportes/ClasificacionChart';
import GruposActividadChart from '../../components/Administrador/Reportes/GruposActividadChart';
import EfectividadRecomendacionesChart from '../../components/Administrador/Reportes/EfectividadRecomendacionesChart';
import AlertasTable from '../../components/Administrador/Reportes/AlertasTable';
import TopUsuariosTable from '../../components/Administrador/Reportes/TopUsuariosTable';
import ExportButton from '../../components/Administrador/Reportes/ExportButton';
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";

/**
 * Página principal de reportes y estadísticas del panel de administración
 * 
 * ARQUITECTURA:
 * - Los filtros globales (periodo) controlan qué datos se cargan del servidor
 * - Cada gráfica tiene sus propios filtros LOCALES que no recargan la página
 * - Los componentes de gráficas incluyen interpretación automática de datos (insights)
 */
const Reportes = () => {
  const { isDark } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filtros, setFiltros] = useState({
    periodo: '30d',
    fecha_inicio: '',
    fecha_fin: '',
  });

  const [resumen, setResumen] = useState({
    usuarios_activos: 0,
    total_analisis: 0,
    promedio_ansiedad: 0,
    alertas_criticas: 0,
  });
  const [tendencias, setTendencias] = useState([]);
  const [distribucionEmociones, setDistribucionEmociones] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [gruposActividad, setGruposActividad] = useState([]);
  const [efectividadRecomendaciones, setEfectividadRecomendaciones] = useState([]);
  const [alertasCriticas, setAlertasCriticas] = useState([]);
  const [topUsuarios, setTopUsuarios] = useState([]);

  const controllerRef = useRef(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filtros.fecha_inicio) params.fecha_inicio = filtros.fecha_inicio;
      if (filtros.fecha_fin) params.fecha_fin = filtros.fecha_fin;
      if (filtros.periodo) params.periodo = filtros.periodo;

      if (controllerRef.current) {
        try { controllerRef.current.abort(); } catch { /* ignore */ }
      }
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      const getData = (res, defaultValue = []) => 
        (res?.data?.data !== undefined ? res.data.data : res?.data ?? defaultValue);

      const [
        resumenRes,
        tendenciasRes,
        emocionesRes,
        clasificacionesRes,
        gruposRes,
        recomendacionesRes,
        alertasRes,
        usuariosRes
      ] = await Promise.all([
        apiClient.get(api.endpoints.admin.reportes.resumenGeneral, { params, skipAuthRedirect: true, signal }),
        apiClient.get(api.endpoints.admin.reportes.tendencias, { params, skipAuthRedirect: true, signal }),
        apiClient.get(api.endpoints.admin.reportes.distribucionEmociones, { params, skipAuthRedirect: true, signal }),
        apiClient.get(api.endpoints.admin.reportes.clasificaciones, { params, skipAuthRedirect: true, signal }),
        apiClient.get(api.endpoints.admin.reportes.gruposActividad, { params, skipAuthRedirect: true, signal }),
        apiClient.get(api.endpoints.admin.reportes.efectividadRecomendaciones, { params, skipAuthRedirect: true, signal }),
        apiClient.get(api.endpoints.admin.reportes.alertasCriticas, { params, skipAuthRedirect: true, signal }),
        apiClient.get(api.endpoints.admin.reportes.usuariosEstadisticas, { params, skipAuthRedirect: true, signal }),
      ]);

      setResumen(getData(resumenRes, { usuarios_activos: 0, total_analisis: 0, promedio_ansiedad: 0, alertas_criticas: 0 }));
      setTendencias(getData(tendenciasRes, []));
      setDistribucionEmociones(getData(emocionesRes, []));
      setClasificaciones(getData(clasificacionesRes, []));
      setGruposActividad(getData(gruposRes, []));
      setEfectividadRecomendaciones(getData(recomendacionesRes, []));
      setAlertasCriticas(getData(alertasRes, []));
      setTopUsuarios(getData(usuariosRes, []));

    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
        console.debug('Request cancelado:', err?.message);
      } else {
        setError('Error al cargar los datos del reporte. Por favor, intente nuevamente.');
        console.error('Error cargando reportes:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    setFiltros({
      periodo: '30d',
      fecha_inicio: hace30Dias.toISOString().split('T')[0],
      fecha_fin: hoy.toISOString().split('T')[0],
    });
  }, []);

  useEffect(() => {
    if (filtros.fecha_inicio && filtros.fecha_fin) {
      cargarDatos();
    }
  }, [filtros, cargarDatos]);

  const handlePeriodoChange = useCallback((nuevoPeriodo) => {
    const hoy = new Date();
    let fechaInicio = new Date();
    
    switch (nuevoPeriodo) {
      case '7d':
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      case '30d':
        fechaInicio.setDate(hoy.getDate() - 30);
        break;
      case '90d':
        fechaInicio.setDate(hoy.getDate() - 90);
        break;
      default:
        fechaInicio.setDate(hoy.getDate() - 30);
    }
    
    setFiltros({
      periodo: nuevoPeriodo,
      fecha_inicio: fechaInicio.toISOString().split('T')[0],
      fecha_fin: hoy.toISOString().split('T')[0],
    });
  }, []);

  const handleExportar = useCallback(async ({ formato, tipo, filtros: filtrosExport }) => {
    try {
      const response = await apiClient.post(
        api.endpoints.admin.reportes.exportar, 
        { tipo, formato, filtros: filtrosExport }, 
        { responseType: 'blob' }
      );
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_serenvoice_${tipo}_${new Date().getTime()}.${formato}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exportando reporte:', err);
      alert('Error al exportar el reporte. Por favor, intente nuevamente.');
    }
  }, []);

  const handleVerDetallesAlerta = useCallback((alerta) => {
    window.location.href = `/admin/alertas/${alerta.id_alerta}`;
  }, []);

  const handleActualizar = useCallback(() => {
    cargarDatos();
  }, [cargarDatos]);

  const periodoTexto = filtros.periodo === '7d' ? 'Últimos 7 días' : 
                       filtros.periodo === '30d' ? 'Últimos 30 días' : 'Últimos 90 días';

  const statsCards = [
    {
      title: "Usuarios Activos",
      value: resumen.usuarios_activos || 0,
      icon: FaUsers,
      color: "#4caf50",
      subtitle: "en el periodo"
    },
    {
      title: "Total Análisis",
      value: resumen.total_analisis || 0,
      icon: FaBrain,
      color: "#2196f3",
      subtitle: "análisis realizados"
    },
    {
      title: "Promedio Emociones",
      value: distribucionEmociones && distribucionEmociones.length === 8
        ? `${(distribucionEmociones.reduce((s, e) => s + (e.porcentaje || 0), 0) / 8).toFixed(1)}%`
        : resumen.promedio_ansiedad ? `${resumen.promedio_ansiedad.toFixed(1)}%` : 'N/A',
      icon: FaHeartbeat,
      color: "#ff6b6b",
      subtitle: "promedio de 8 emociones"
    },
    {
      title: "Alertas Críticas",
      value: resumen.alertas_criticas || 0,
      icon: FaExclamationTriangle,
      color: "#ff9800",
      subtitle: "requieren atención"
    }
  ];

  return (
    <div className="page-content">
      {/* Header Card */}
      <PageCard size="xl">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                <FaChartBar style={{ color: '#2196f3' }} />
                Reportes y Estadísticas
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>
                Panel de análisis y métricas del sistema SerenVoice
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Selector de periodo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-panel)', borderRadius: '12px', padding: '0.25rem' }}>
                <FaCalendarAlt style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }} />
                {['7d', '30d', '90d'].map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriodoChange(p)}
                    disabled={loading}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      background: filtros.periodo === p ? 'var(--color-card)' : 'transparent',
                      color: filtros.periodo === p ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      boxShadow: filtros.periodo === p ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleActualizar}
                disabled={loading}
                className="admin-btn admin-btn-secondary"
              >
                <FaSyncAlt className={loading ? 'spin' : ''} />
                Actualizar
              </button>
              
              <ExportButton
                onExport={handleExportar}
                filtros={filtros}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </PageCard>

      {/* Error Message */}
      {error && (
        <div className="admin-message admin-message-error" style={{ maxWidth: '1200px', width: '100%' }}>
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '1200px'
        }}
      >
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="admin-card" style={{ padding: '1.5rem', animation: 'pulse 1.5s infinite' }}>
              <div style={{ height: '1rem', background: 'var(--color-panel)', borderRadius: '4px', width: '60%', marginBottom: '1rem' }}></div>
              <div style={{ height: '2rem', background: 'var(--color-panel)', borderRadius: '4px', width: '40%' }}></div>
            </div>
          ))
        ) : (
          statsCards.map((stat, index) => (
            <AdminCard
              key={index}
              variant="stat"
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              gradient={isDark ? 'linear-gradient(135deg, rgba(31,41,55,0.9), rgba(31,41,55,0.9))' : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.98))'}
              subtitle={stat.subtitle}
            />
          ))
        )}
      </div>

      {/* Info Banner */}
      {!loading && (
        <PageCard size="xl">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--color-primary)' }}>
            <FaInfoCircle style={{ flexShrink: 0, marginTop: '0.2rem' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                Periodo: {periodoTexto}
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Cada gráfica tiene sus propios filtros internos. Usa los botones "Filtros" en cada tarjeta 
                para personalizar la visualización sin recargar la página.
              </p>
            </div>
          </div>
        </PageCard>
      )}

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1200px' }}>
        {loading ? (
          <>
            <div className="admin-card" style={{ height: '400px', animation: 'pulse 1.5s infinite' }}></div>
            <div className="admin-card" style={{ height: '400px', animation: 'pulse 1.5s infinite' }}></div>
          </>
        ) : (
          <>
            <PageCard size="full">
              <TendenciasChart data={tendencias} periodo={filtros.periodo} />
            </PageCard>
            <PageCard size="full">
              <DistribucionEmocionalChart data={distribucionEmociones} />
            </PageCard>
          </>
        )}
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1200px' }}>
        {loading ? (
          <>
            <div className="admin-card" style={{ height: '400px', animation: 'pulse 1.5s infinite' }}></div>
            <div className="admin-card" style={{ height: '400px', animation: 'pulse 1.5s infinite' }}></div>
          </>
        ) : (
          <>
            <PageCard size="full">
              <ClasificacionChart data={clasificaciones} />
            </PageCard>
            <PageCard size="full">
              <GruposActividadChart data={gruposActividad} />
            </PageCard>
          </>
        )}
      </div>

      {/* Efectividad Chart */}
      {loading ? (
        <div className="admin-card" style={{ height: '400px', width: '100%', maxWidth: '1200px', animation: 'pulse 1.5s infinite' }}></div>
      ) : (
        <PageCard size="xl">
          <EfectividadRecomendacionesChart data={efectividadRecomendaciones} />
        </PageCard>
      )}

      {/* Tables */}
      {loading ? (
        <>
          <div className="admin-card" style={{ height: '300px', width: '100%', maxWidth: '1200px', animation: 'pulse 1.5s infinite' }}></div>
          <div className="admin-card" style={{ height: '300px', width: '100%', maxWidth: '1200px', animation: 'pulse 1.5s infinite' }}></div>
        </>
      ) : (
        <>
          <PageCard size="xl">
            <AlertasTable
              data={alertasCriticas}
              onViewDetails={handleVerDetallesAlerta}
            />
          </PageCard>
          <PageCard size="xl">
            <TopUsuariosTable data={topUsuarios} />
          </PageCard>
        </>
      )}
    </div>
  );
};

export default Reportes;
