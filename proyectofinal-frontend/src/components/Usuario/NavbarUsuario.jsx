import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import authService from "../../services/authService";
import notificacionesService from "../../services/notificacionesService";
import {
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaBell,
  FaHome,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaMicrophone,
  FaHistory,
  FaLightbulb,
} from "react-icons/fa";
import logo from "../../assets/Logo.svg";
import { makeFotoUrlWithProxy } from '../../utils/avatar';

const NavbarUsuario = ({ userData = {} }) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await notificacionesService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error al cargar contador:', error);
      }
    };

    loadUnreadCount();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (notificationsOpen) {
      loadNotifications();
    }
  }, [notificationsOpen]);

  const loadNotifications = async () => {
    try {
      const response = await notificacionesService.getNotificaciones(10, false);
      setNotificaciones(response.data || []);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      // Marcar como leída
      if (!notif.leida) {
        await notificacionesService.markAsRead(notif.id_notificacion);
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Cerrar el dropdown
      setNotificationsOpen(false);

      // Navegar a la URL si existe
      if (notif.url_accion) {
        navigate(notif.url_accion);
      }
    } catch (error) {
      console.error('Error al procesar notificación:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificacionesService.markAllAsRead();
      setUnreadCount(0);
      loadNotifications();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleLogout = async () => {
    console.debug('[NAVBAR] handleLogout invoked, auth.logout exists:', !!(auth && auth.logout));

    // Intentar usar el contexto primero
    try {
      if (auth && auth.logout) {
        // el logout del context puede ser asíncrono
        const res = auth.logout();
        if (res && res.then) await res;
        console.debug('[NAVBAR] auth.logout completed');
      } else {
        // Fallback directo al servicio (asegura que se llame la lógica de cierre remoto)
        console.debug('[NAVBAR] auth context missing — calling authService.logout() directly');
        try {
          await authService.logout();
          console.debug('[NAVBAR] authService.logout completed');
        } catch (e) {
          console.warn('[NAVBAR] authService.logout failed:', e);
        }
        localStorage.removeItem("token");
        localStorage.removeItem("roles");
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
      }
    } catch (e) {
      console.error('[NAVBAR] Error during logout process:', e);
    }

    navigate("/login");
  };

  const handleNavigateToProfile = () => {
    navigate("/actualizar-perfil");
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const handleNavigateToSettings = () => {
    navigate("/configuracion");
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  // Prefer prop `userData`, si está vacío usar authService.getUser() para reflejar cambios en localStorage
  const currentUser = (userData && Object.keys(userData).length > 0) ? userData : authService.getUser() || {};

  // usar utilidad makeFotoUrlWithProxy

  return (
    <nav className="navbar user-navbar">
      {/* Logo y nombre */}
      <div className="nav-brand">
        <img src={logo} alt="SerenVoice Logo" className="nav-logo" />
        <h1 className="nav-title">SerenVoice</h1>
        <span className="user-badge">Usuario</span>
      </div>

      {/* Botón hamburguesa para móvil */}
      <button
        className={`nav-toggle ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Enlaces y menú */}
      <div className={`nav-links user-nav-links ${mobileMenuOpen ? "open" : ""}`}>
        <Link to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
          <FaHome /> <span>Inicio</span>
        </Link>

        <Link to="/analizar-voz" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
          <FaMicrophone /> <span>Analizar Voz</span>
        </Link>

        <Link to="/historial" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
          <FaHistory /> <span>Historial</span>
        </Link>

        <Link to="/recomendaciones" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
          <FaLightbulb /> <span>Recomendaciones</span>
        </Link>

        {/* Botón de notificaciones con dropdown */}
        <div className="notifications-wrapper">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="notifications-button"
            aria-label="Notificaciones"
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="notifications-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notificaciones</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="mark-all-read-btn"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              <div className="notifications-list">
                {notificaciones.length === 0 ? (
                  <div className="no-notifications">
                    <FaBell style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }} />
                    <p>No tienes notificaciones</p>
                  </div>
                ) : (
                  notificaciones.map((notif) => (
                    <div
                      key={notif.id_notificacion}
                      className={`notification-item ${notif.leida ? 'read' : 'unread'}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notification-icon">{notif.icono || '🔔'}</div>
                      <div className="notification-content">
                        <h4>{notif.titulo}</h4>
                        <p>{notif.mensaje}</p>
                        <span className="notification-time">{notif.tiempo_transcurrido}</span>
                      </div>
                      {!notif.leida && <div className="unread-indicator"></div>}
                    </div>
                  ))
                )}
              </div>

              <div className="notifications-footer">
                <Link
                  to="/notificaciones"
                  onClick={() => setNotificationsOpen(false)}
                  className="view-all-link"
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Menú de usuario */}
        <div className="user-menu-wrapper">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="user-menu-button"
            aria-label="Abrir menú de usuario"
          >
            {
              // Mostrar imagen de perfil si existe, sino el ícono por defecto
              (function renderAvatar() {
                const foto = currentUser?.foto_perfil;
                if (foto) {
                  try {
                    const src = makeFotoUrlWithProxy(foto);
                    return (
                      <img
                        src={src}
                        alt={`${currentUser.nombre || 'Usuario'} avatar`}
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }}
                      />
                    );
                  } catch (err) {
                    console.warn('[NAVBAR] avatar render error:', err);
                    return <FaUser />;
                  }
                }
                return <FaUser />;
              })()
            }
            <span>{currentUser.nombre || currentUser.nombres || "Usuario"}</span>
            <FaChevronDown
              style={{
                fontSize: "0.75rem",
                transition: "transform 0.3s",
                transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {userMenuOpen && (
            <div className="user-dropdown">
              {/* Perfil */}
              <button onClick={handleNavigateToProfile} className="user-menu-item">
                <FaUser /> <span>Mi Perfil</span>
              </button>

              {/* Configuración */}
              <button onClick={handleNavigateToSettings} className="user-menu-item">
                <FaCog /> <span>Configuración</span>
              </button>

              {/* Cerrar sesión */}
              <button onClick={handleLogout} className="user-menu-item user-logout">
                <FaSignOutAlt /> <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavbarUsuario;
