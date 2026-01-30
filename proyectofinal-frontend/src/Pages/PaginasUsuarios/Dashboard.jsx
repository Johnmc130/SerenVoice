// Dashboard.jsx — Con resumen de actividad reciente

import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import "../../global.css";
import PageCard from "../../components/Shared/PageCard";
import Spinner from "../../components/Publico/Spinner";
import {
  FaMicrophone,
  FaChartLine,
  FaSmile,
  FaAngry,
  FaSadTear,
  FaMeh,
  FaLightbulb,
  FaGamepad,
  FaTrophy,
  FaHeartbeat,
  FaBrain,
  FaExclamationTriangle,
  FaClock
} from "react-icons/fa";
import authService from "../../services/authService";
import analisisService from "../../services/analisisService";
import { juegosAPI } from "../../services/apiClient";

const Dashboard = () => {
  const navigate = useNavigate();
  const userData = authService.getUser();
  const userId = userData?.id_usuario ?? userData?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [ultimoAnalisis, setUltimoAnalisis] = useState(null);
  const [estadisticasJuegos, setEstadisticasJuegos] = useState(null);
  const [totalAnalisis, setTotalAnalisis] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar historial de análisis (solo el último)
        const historialData = await analisisService.getHistory(5);
        if (historialData?.success && historialData?.data?.length > 0) {
          setUltimoAnalisis(historialData.data[0]);
          setTotalAnalisis(historialData.data.length);
        }

        // Cargar estadísticas de juegos
        try {
          const juegosData = await juegosAPI.estadisticas();
          if (juegosData?.success) {
            setEstadisticasJuegos(juegosData);
          }
        } catch {
          console.log("No hay estadísticas de juegos disponibles");
        }
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      cargarDatos();
    }
  }, [userId]); // Ejecutar cuando cambie userId

  if (!userData) return <Navigate to="/login" replace />;

  const calcularEdad = (fecha) => {
    if (!fecha) return "—";
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  };

  const edadCalculada = calcularEdad(userData.fecha_nacimiento);

  // Iconos de emociones
  const getEmotionIcon = (emotion) => {
    const iconMap = {
      felicidad: FaSmile,
      tristeza: FaSadTear,
      enojo: FaAngry,
      neutral: FaMeh,
      estres: FaExclamationTriangle,
      ansiedad: FaBrain
    };
    return iconMap[emotion?.toLowerCase()] || FaMeh;
  };

  const getEmotionColor = (emotion) => {
    const colorMap = {
      felicidad: "#4CAF50",
      tristeza: "#2196F3",
      enojo: "#ff6b6b",
      neutral: "#9e9e9e",
      estres: "#ff9800",
      ansiedad: "#9c27b0"
    };
    return colorMap[emotion?.toLowerCase()] || "var(--color-primary)";
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - date;
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHoras < 1) return "Hace unos minutos";
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="dashboard-content page-content">
      {loading && <Spinner message="Cargando dashboard..." />}

      {/* Bienvenida */}
      <PageCard size="xl">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <h2 style={{ marginBottom: "0.5rem" }}>
              ¡Hola, {userData.nombre}! 👋
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
              Bienvenido a tu espacio de bienestar emocional
            </p>
          </div>
          <button
            className="auth-button"
            onClick={() => navigate("/analizar-voz")}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <FaMicrophone /> Nuevo Análisis
          </button>
        </div>
      </PageCard>

      {/* Resumen de Actividad */}
      <PageCard size="xl">
        <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FaChartLine style={{ color: "var(--color-primary)" }} /> Resumen de Actividad
        </h3>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "1.5rem" 
        }}>
          {/* Último Análisis */}
          <div className="panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <FaClock style={{ color: "var(--color-primary)" }} />
              <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>Último Análisis</span>
            </div>
            
            {ultimoAnalisis ? (
              <div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "1rem",
                  marginBottom: "1rem"
                }}>
                  {(() => {
                    const emocion = ultimoAnalisis.emocion_dominante || ultimoAnalisis.resultado?.emocion_principal;
                    const EmotionIcon = getEmotionIcon(emocion);
                    return (
                      <>
                        <div style={{
                          width: 50,
                          height: 50,
                          borderRadius: "50%",
                          background: `${getEmotionColor(emocion)}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <EmotionIcon size={24} style={{ color: getEmotionColor(emocion) }} />
                        </div>
                        <div>
                          <p style={{ 
                            fontWeight: 600, 
                            color: "var(--color-text-main)",
                            margin: 0,
                            textTransform: "capitalize"
                          }}>
                            {emocion || "Sin determinar"}
                          </p>
                          <p style={{ 
                            fontSize: "0.85rem", 
                            color: "var(--color-text-secondary)",
                            margin: 0
                          }}>
                            {formatearFecha(ultimoAnalisis.fecha_analisis || ultimoAnalisis.fecha)}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <button
                  className="auth-button"
                  onClick={() => navigate(`/resultado-detallado/${ultimoAnalisis.id_analisis || ultimoAnalisis.id}`)}
                  style={{ width: "100%", fontSize: "0.9rem", padding: "0.6rem" }}
                >
                  Ver Detalles
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <FaMicrophone size={32} style={{ color: "var(--color-text-secondary)", marginBottom: "0.5rem" }} />
                <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "0.9rem" }}>
                  Aún no tienes análisis
                </p>
                <button
                  className="auth-button"
                  onClick={() => navigate("/analizar-voz")}
                  style={{ marginTop: "1rem", fontSize: "0.9rem", padding: "0.6rem 1rem" }}
                >
                  Hacer mi primer análisis
                </button>
              </div>
            )}
          </div>

          {/* Estadísticas Rápidas */}
          <div className="panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <FaTrophy style={{ color: "var(--color-primary)" }} />
              <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>Tu Progreso</span>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ 
                  fontSize: "2rem", 
                  fontWeight: 700, 
                  color: "var(--color-primary)",
                  margin: 0
                }}>
                  {totalAnalisis}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: 0 }}>
                  Análisis totales
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ 
                  fontSize: "2rem", 
                  fontWeight: 700, 
                  color: "var(--color-primary)",
                  margin: 0
                }}>
                  {estadisticasJuegos?.total_sesiones || 0}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: 0 }}>
                  Juegos completados
                </p>
              </div>
            </div>

            <div style={{ 
              marginTop: "1rem", 
              paddingTop: "1rem", 
              borderTop: "1px solid var(--color-border)" 
            }}>
              <button
                className="auth-button"
                onClick={() => navigate("/historial")}
                style={{ width: "100%", fontSize: "0.9rem", padding: "0.6rem" }}
              >
                Ver Historial Completo
              </button>
            </div>
          </div>

          {/* Acciones Recomendadas */}
          <div className="panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <FaLightbulb style={{ color: "var(--color-primary)" }} />
              <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>Acciones Recomendadas</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={() => navigate("/recomendaciones")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left"
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
              >
                <FaHeartbeat style={{ color: "var(--color-primary)" }} />
                <span style={{ color: "var(--color-text-main)", fontSize: "0.9rem" }}>
                  Ver mis recomendaciones
                </span>
              </button>

              <button
                onClick={() => navigate("/juegos")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left"
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
              >
                <FaGamepad style={{ color: "var(--color-primary)" }} />
                <span style={{ color: "var(--color-text-main)", fontSize: "0.9rem" }}>
                  Juegos terapéuticos
                </span>
              </button>

              <button
                onClick={() => navigate("/reportes-usuario")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left"
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
              >
                <FaChartLine style={{ color: "var(--color-primary)" }} />
                <span style={{ color: "var(--color-text-main)", fontSize: "0.9rem" }}>
                  Ver mis reportes
                </span>
              </button>
            </div>
          </div>
        </div>
      </PageCard>

      {/* Información de Perfil */}
      <PageCard size="xl">
        <h3 style={{ color: "var(--color-text-main)", marginBottom: "1.5rem" }}>
          Información de Perfil
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
              }}
            >
              Nombre Completo
            </p>
            <p style={{ color: "var(--color-text-main)", fontWeight: "600" }}>
              {userData.nombre} {userData.apellido}
            </p>
          </div>

          <div>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
              }}
            >
              Correo
            </p>
            <p style={{ color: "var(--color-text-main)", fontWeight: "600" }}>
              {userData.correo}
            </p>
          </div>

          <div>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
              }}
            >
              Edad
            </p>
            <p style={{ color: "var(--color-text-main)", fontWeight: "600" }}>
              {edadCalculada} años
            </p>
          </div>

          <div>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
              }}
            >
              Género
            </p>
            <p style={{ color: "var(--color-text-main)", fontWeight: "600" }}>
              {userData.genero === "M" ? "Masculino"
              : userData.genero === "F" ? "Femenino"
              : "Otro"}
            </p>
          </div>

          <div>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
              }}
            >
              Usa medicamentos
            </p>
            <p style={{ color: "var(--color-text-main)", fontWeight: "600" }}>
              {userData.usa_medicamentos ? "Sí" : "No"}
            </p>
          </div>
        </div>

        <button
          className="auth-button"
          onClick={() => navigate("/actualizar-perfil")}
        >
          Editar Perfil
        </button>
      </PageCard>
    </div>
  );
};

export default Dashboard;
