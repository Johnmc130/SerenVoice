import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaDesktop, FaMobileAlt, FaGlobe, FaClock, FaTimes, FaSignOutAlt, FaArrowLeft } from "react-icons/fa";
import Spinner from "../../components/Publico/Spinner";
import sesionesService from "../../services/sesionesService";
import "../../global.css";
import PageCard from "../../components/Shared/PageCard";
import Pagination from "../../components/Shared/Pagination";
import ConfirmDialog from "../../components/Shared/ConfirmDialog";

const ITEMS_PER_PAGE = 10;

const Sesiones = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [closingSession, setClosingSession] = useState(null);
  const cardRef = useRef(null);
  
  // Estado para ConfirmDialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    confirmText: "Confirmar",
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;
    const els = cardRef.current.querySelectorAll(".reveal");
    els.forEach((el) => el.classList.add("reveal-visible"));
    if (cardRef.current.classList.contains("reveal"))
      cardRef.current.classList.add("reveal-visible");
  }, [sessions]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await sesionesService.getMySessions(50);
      setSessions(response.data || response || []);
    } catch (err) {
      console.error("Error al cargar sesiones:", err);
      setError(err.message || "Error al cargar las sesiones");
    } finally {
      setLoading(false);
    }
  };

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

  const formatDuration = (duracion) => {
    if (!duracion) return "En curso";
    return duracion;
  };

  const getDeviceIcon = (dispositivo) => {
    if (!dispositivo) return FaDesktop;
    const lower = dispositivo.toLowerCase();
    if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) return FaMobileAlt;
    return FaDesktop;
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      activa: { color: "#4caf50", text: "Activa" },
      cerrada: { color: "#9e9e9e", text: "Cerrada" },
      expirada: { color: "#ff9800", text: "Expirada" }
    };
    const info = estados[estado?.toLowerCase()] || { color: "#9e9e9e", text: estado || "Desconocido" };
    return (
      <span style={{
        background: `${info.color}22`,
        color: info.color,
        padding: "0.25rem 0.75rem",
        borderRadius: 20,
        fontSize: "0.85rem",
        fontWeight: 500
      }}>
        {info.text}
      </span>
    );
  };

  // Cerrar sesión específica
  const handleCloseSession = async (id_sesion) => {
    setClosingSession(id_sesion);
    try {
      await sesionesService.closeSession(id_sesion);
      await fetchSessions();
    } catch (err) {
      console.error("Error cerrando sesión:", err);
      setError(err.message || "Error al cerrar sesión");
    } finally {
      setClosingSession(null);
    }
  };

  // Cerrar todas las sesiones activas
  const handleCloseAllSessions = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Cerrar Todas las Sesiones",
      message: "¿Estás seguro de cerrar todas las sesiones activas? Esto cerrará tu sesión actual también y tendrás que volver a iniciar sesión.",
      type: "warning",
      confirmText: "Cerrar Todas",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          await sesionesService.closeAllSessions();
          await fetchSessions();
        } catch (err) {
          console.error("Error cerrando todas las sesiones:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Paginación
  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = sessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeSessions = sessions.filter(s => s.estado === "activa");

  if (loading) {
    return (
      <div className="page-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div className="page-content" ref={cardRef}>
      {/* Botón de regreso */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          className="auth-button"
          style={{ 
            background: "transparent", 
            border: "1px solid var(--color-border)",
            color: "var(--color-text-main)",
            padding: "0.5rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
          onClick={() => navigate("/configuracion")}
        >
          <FaArrowLeft /> Volver a Configuración
        </button>
      </div>

      <PageCard size="xl">
        <div style={{ marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FaDesktop style={{ color: "var(--color-primary)" }} />
            Mis Sesiones
          </h2>
          <p style={{ margin: "0.5rem 0 0 0", color: "var(--color-text-secondary)" }}>
            Gestiona tus sesiones activas y revisa el historial de accesos
          </p>
        </div>
      </PageCard>

      {/* Resumen */}
      <div className="dashboard-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h3 style={{ color: "#4caf50", fontSize: "2rem", margin: 0 }}>{activeSessions.length}</h3>
          <p style={{ margin: "0.5rem 0 0 0" }}>Sesiones Activas</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3 style={{ color: "var(--color-primary)", fontSize: "2rem", margin: 0 }}>{sessions.length}</h3>
          <p style={{ margin: "0.5rem 0 0 0" }}>Total Registradas</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          {activeSessions.length > 1 ? (
            <button
              className="auth-button"
              style={{ 
                background: "#ff6b6b", 
                width: "100%",
                padding: "0.75rem"
              }}
              onClick={handleCloseAllSessions}
              disabled={loading}
            >
              <FaSignOutAlt style={{ marginRight: 8 }} />
              Cerrar todas las sesiones
            </button>
          ) : (
            <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
              Solo tienes una sesión activa
            </p>
          )}
        </div>
      </div>

      {error && (
        <PageCard size="xl">
          <div style={{ padding: "1rem", background: "rgba(255, 107, 107, 0.1)", borderRadius: 8, color: "#ff6b6b" }}>
            {error}
          </div>
        </PageCard>
      )}

      {/* Lista de sesiones */}
      <PageCard size="xl">
        <h3 style={{ marginBottom: "1rem" }}>Historial de Sesiones</h3>
        
        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)" }}>
            No hay sesiones registradas
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {paginatedSessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.dispositivo);
                const isActive = session.estado === "activa";
                return (
                  <div
                    key={session.id_sesion}
                    className="reveal"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1rem",
                      background: isActive ? "rgba(76, 175, 80, 0.08)" : "var(--color-panel)",
                      borderRadius: 12,
                      border: isActive ? "2px solid #4caf50" : "1px solid rgba(0,0,0,0.06)",
                      flexWrap: "wrap"
                    }}
                  >
                    <DeviceIcon 
                      size={32} 
                      style={{ 
                        color: isActive ? "#4caf50" : "var(--color-text-secondary)", 
                        flexShrink: 0 
                      }} 
                    />
                    
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: "var(--color-text-main)", 
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap"
                      }}>
                        {session.navegador || "Navegador desconocido"}
                        {getEstadoBadge(session.estado)}
                      </div>
                      
                      <div style={{ 
                        fontSize: "0.85rem", 
                        color: "var(--color-text-secondary)", 
                        display: "flex", 
                        gap: "1rem", 
                        flexWrap: "wrap",
                        marginTop: "0.5rem"
                      }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <FaGlobe size={12} />
                          {session.ip_address || "IP desconocida"}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <FaClock size={12} />
                          {formatDate(session.fecha_inicio)}
                        </span>
                      </div>
                      
                      {session.sistema_operativo && (
                        <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: 4 }}>
                          {session.sistema_operativo}
                        </div>
                      )}

                      {!isActive && session.duracion && (
                        <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: 4 }}>
                          Duración: {formatDuration(session.duracion)}
                        </div>
                      )}
                    </div>
                    
                    {isActive && (
                      <button
                        className="auth-button"
                        style={{ 
                          background: "transparent", 
                          border: "1px solid #ff6b6b", 
                          color: "#ff6b6b",
                          padding: "0.5rem 1rem",
                          fontSize: "0.85rem"
                        }}
                        onClick={() => handleCloseSession(session.id_sesion)}
                        disabled={closingSession === session.id_sesion}
                      >
                        {closingSession === session.id_sesion ? "Cerrando..." : (
                          <>
                            <FaTimes style={{ marginRight: 4 }} />
                            Cerrar sesión
                          </>
                        )}
                      </button>
                    )}
                    
                    {!isActive && session.fecha_fin && (
                      <div style={{ 
                        fontSize: "0.8rem", 
                        color: "var(--color-text-secondary)",
                        textAlign: "right"
                      }}>
                        Cerrada:<br/>
                        {formatDate(session.fecha_fin)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ marginTop: "1.5rem" }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </PageCard>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
      />
    </div>
  );
};

export default Sesiones;
