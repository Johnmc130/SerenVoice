import React, { useEffect, useState, useContext } from "react";
import {
  FaUsers,
  FaChartLine,
  FaUserCheck,
  FaShieldAlt,
  FaGamepad,
  FaUserFriends,
  FaSync,
  FaHistory,
  FaCheckCircle,
  FaServer,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import PageCard from "../../components/Shared/PageCard";
import AdminCard from "../../components/Administrador/AdminCard";
import Spinner from "../../components/Publico/Spinner";
import { ThemeContext } from "../../context/themeContextDef";
import "../../global.css";

const DashboardAdmin = () => {
  const { isDark } = useContext(ThemeContext);
  const [statistics, setStatistics] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gruposActivos, setGruposActivos] = useState(0);
  const [analisisHoy, setAnalisisHoy] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alertasPendientes, setAlertasPendientes] = useState(0);

  // Fetch de datos - optimizado para evitar saturar el pool de conexiones
  const fetchDashboard = async () => {
    try {
      // Primeras llamadas críticas (stats y perfil)
      const [statsRes, profileRes] = await Promise.all([
        apiClient.get(api.endpoints.usuarios.statistics).catch(err => ({ data: { success: false }, error: err })),
        apiClient.get(api.endpoints.users.me).catch(err => ({ data: { success: false }, error: err })),
      ]);

      if (statsRes.data?.success) {
        setStatistics(statsRes.data.data);
      }

      if (profileRes.data?.success) {
        setAdminData(profileRes.data.data);
      }

      // Si ambas llamadas críticas fallaron, lanzar error
      if (!statsRes.data?.success && !profileRes.data?.success) {
        throw new Error("Error al cargar datos principales del dashboard");
      }

      // Segundas llamadas (datos secundarios) - con catch individual
      const [gruposRes, analisisRes, alertasRes] = await Promise.all([
        apiClient.get(api.endpoints.grupos.estadisticas).catch(() => ({ data: { data: { activos: 0 } } })),
        apiClient.get(api.endpoints.analisis.today).catch(() => ({ data: { data: { total: 0 } } })),
        apiClient.get(api.endpoints.alertas.active).catch(() => ({ data: { data: [] } })),
      ]);

      // Grupos activos
      let activos = 0;
      try {
        if (gruposRes?.data) {
          // Si es un array de grupos, contar los activos
          if (Array.isArray(gruposRes.data.data)) {
            activos = gruposRes.data.data.filter(g => g.activo).length;
          } else if (Array.isArray(gruposRes.data)) {
            activos = gruposRes.data.filter(g => g.activo).length;
          } else if (gruposRes.data.data && typeof gruposRes.data.data.activos !== 'undefined') {
            activos = gruposRes.data.data.activos;
          } else if (typeof gruposRes.data.activos !== 'undefined') {
            activos = gruposRes.data.activos;
          } else if (typeof gruposRes.data === 'number') {
            activos = gruposRes.data;
          }
        }
      } catch {
        activos = 0;
      }
      setGruposActivos(activos || 0);

      // Análisis hoy
      let analisisTotal = 0;
      try {
        if (analisisRes?.data) {
          if (typeof analisisRes.data === 'number') {
            analisisTotal = analisisRes.data;
          } else if (typeof analisisRes.data.total !== 'undefined') {
            analisisTotal = analisisRes.data.total;
          } else if (analisisRes.data.data && typeof analisisRes.data.data.total !== 'undefined') {
            analisisTotal = analisisRes.data.data.total;
          }
        }
      } catch {
        analisisTotal = 0;
      }
      setAnalisisHoy(analisisTotal || 0);

      // Formatear tiempo relativo
      const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'Hace un momento';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Hace un momento';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
      };

      // Recopilar actividad real de las fuentes disponibles
      const actividadReal = [];

      // 1. Análisis de voz (basado en el total de hoy)
      if (analisisTotal > 0) {
        actividadReal.push({
          type: 'analysis',
          text: `${analisisTotal} análisis de voz completado${analisisTotal > 1 ? 's' : ''} hoy`,
          time: 'Hoy',
          date: new Date(),
          icon: FaChartLine,
          color: '#2196f3',
        });
      }

      // 2. Alertas activas
      const alertasData = alertasRes?.data?.data || alertasRes?.data || [];
      const alertasArray = Array.isArray(alertasData) ? alertasData : [];
      // Contador de alertas pendientes (usar para el card)
      setAlertasPendientes(Array.isArray(alertasArray) ? alertasArray.length : 0);
      const alertasRecientes = alertasArray
        .sort((a, b) => new Date(b.fecha_creacion || b.created_at) - new Date(a.fecha_creacion || a.created_at))
        .slice(0, 3);
      
      alertasRecientes.forEach(alerta => {
        actividadReal.push({
          type: 'alert',
          text: alerta.mensaje || alerta.descripcion || 'Alerta del sistema',
          time: formatTimeAgo(alerta.fecha_creacion || alerta.created_at),
          date: new Date(alerta.fecha_creacion || alerta.created_at),
          icon: alerta.nivel === 'critico' ? FaExclamationTriangle : FaCheckCircle,
          color: alerta.nivel === 'critico' ? '#ff6b6b' : '#4caf50',
        });
      });

      // 3. Grupos activos (información general)
      if (activos > 0) {
        actividadReal.push({
          type: 'group',
          text: `${activos} grupo${activos > 1 ? 's' : ''} activo${activos > 1 ? 's' : ''} en el sistema`,
          time: 'Ahora',
          date: new Date(),
          icon: FaUserFriends,
          color: '#9c27b0',
        });
      }

      // 4. Info de usuarios del sistema (de las estadísticas)
      if (statsRes.data?.data?.totalUsuarios > 0) {
        actividadReal.push({
          type: 'user',
          text: `${statsRes.data.data.totalUsuarios} usuarios registrados en el sistema`,
          time: 'Total',
          date: new Date(Date.now() - 1000), // Ligeramente antes para ordenar
          icon: FaUsers,
          color: '#5ad0d2',
        });
      }

      // Ordenar por fecha más reciente y tomar los primeros 4
      actividadReal.sort((a, b) => (b.date || 0) - (a.date || 0));
      const actividadFinal = actividadReal.slice(0, 4);

      // Si no hay actividad, mostrar mensaje informativo
      if (actividadFinal.length === 0) {
        actividadFinal.push({
          type: 'info',
          text: 'No hay actividad reciente registrada',
          time: 'Ahora',
          icon: FaCheckCircle,
          color: '#4caf50',
        });
      }

      setRecentActivity(actividadFinal);

    } catch (err) {
      console.error("Error cargando datos del dashboard:", err);
      setError(err.response?.data?.message || err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <Spinner message="Cargando panel de administración..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <PageCard size="md">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <FaExclamationTriangle style={{ fontSize: "3rem", color: "#ff6b6b", marginBottom: "1rem" }} />
            <h3>Error al cargar el dashboard</h3>
            <p style={{ color: "var(--color-text-secondary)" }}>{error}</p>
            <button className="auth-button" onClick={() => window.location.reload()} style={{ marginTop: "1rem" }}>
              <FaSync style={{ marginRight: "0.5rem" }} /> Reintentar
            </button>
          </div>
        </PageCard>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="page-content">
        <PageCard size="md">
          <p style={{ textAlign: "center" }}>No se pudieron cargar las estadísticas.</p>
        </PageCard>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Usuarios",
      value: statistics.totalUsuarios || 0,
      icon: FaUsers,
      color: "#5ad0d2",
      bgColor: "rgba(90, 208, 210, 0.15)",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Usuarios Activos",
      value: statistics.usuariosActivos || 0,
      icon: FaUserCheck,
      color: "#4caf50",
      bgColor: "rgba(76, 175, 80, 0.15)",
      subtitle: `${statistics.tasaActividad || 0}% tasa`,
    },
    {
      title: "Grupos Activos",
      value: gruposActivos,
      icon: FaUserFriends,
      color: "#9c27b0",
      bgColor: "rgba(156, 39, 176, 0.15)",
    },
    {
      title: "Análisis Hoy",
      value: analisisHoy,
      icon: FaChartLine,
      color: "#2196f3",
      bgColor: "rgba(33, 150, 243, 0.15)",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Alertas Pendientes",
      value: alertasPendientes || (statistics?.alertasPendientes ?? statistics?.alertas_pendientes ?? statistics?.alertas ?? 0),
      icon: FaExclamationTriangle,
      color: "#ff6b6b",
      bgColor: "rgba(255, 107, 107, 0.15)",
    },
  ];

  const systemStatus = [
    { name: "API Backend", status: "online", detail: "Operativo" },
    { name: "Base de Datos", status: "online", detail: "Conexión estable" },
    { name: "Análisis de Voz", status: "online", detail: "Procesando" },
    { name: "Servicio de IA", status: "online", detail: "Activo" },
  ];

  return (
    <div className="page-content">
      {/* Welcome Card */}
      <PageCard size="xl">
        <div style={{ textAlign: "center" }}>
          <h2 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <FaShieldAlt style={{ color: "#ff6b6b" }} />
            Panel de Administración
          </h2>
          <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
            Bienvenido, {adminData?.nombre || "Administrador"}. Última conexión: {new Date().toLocaleDateString()}
          </p>
        </div>
      </PageCard>

      {/* Stats Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '1200px',
          alignItems: 'stretch'
        }}
      >
        {statsCards.map((stat, index) => (
          <AdminCard
            key={index}
            variant="stat"
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            gradient={isDark ? 'linear-gradient(135deg, rgba(31,41,55,0.9), rgba(31,41,55,0.9))' : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.98))'}
            subtitle={stat.change ? `${stat.change} este mes` : stat.subtitle}
          />
        ))}
      </div>

      {/* Activity Section */}
      <PageCard size="xl">
        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <FaHistory style={{ color: "#2196f3" }} />
          Actividad Reciente
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {recentActivity.map((activity, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.75rem",
                background: "var(--color-panel)",
                borderRadius: "12px",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  backgroundColor: `${activity.color}20`,
                  color: activity.color,
                  padding: "0.5rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <activity.icon />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 500 }}>{activity.text}</p>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <FaClock />
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PageCard>

      {/* System Status */}
      <PageCard size="xl">
        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <FaServer style={{ color: "#4caf50" }} />
          Estado del Sistema
        </h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {systemStatus.map((item, idx) => (
            <div
              key={idx}
              className="card inner-card"
              style={{ flex: "1 1 200px", textAlign: "left", display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: item.status === "online" ? "#4caf50" : "#ff6b6b",
                  flexShrink: 0,
                }}
              ></span>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{item.name}</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  );
};

export default DashboardAdmin;