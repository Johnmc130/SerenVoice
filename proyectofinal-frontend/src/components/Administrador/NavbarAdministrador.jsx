import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import authService from "../../services/authService";
import logger from '../../utils/logger';
import {
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaBell,
  FaHome,
  FaUsers,
  FaChartBar,
  FaChevronDown,
  FaShieldAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import logo from "../../assets/Logo.svg";
import { makeFotoUrlWithProxy } from '../../utils/avatar';

const NavbarAdministrador = ({ adminData = {}, onMenuToggle, isMobileMenuOpen }) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Solo usar estado interno si no se provee onMenuToggle (compatibilidad hacia atrás)
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
  
  // Determinar si usar estado controlado o interno
  const mobileMenuOpen = onMenuToggle ? isMobileMenuOpen : internalMobileMenuOpen;
  const toggleMobileMenu = onMenuToggle || (() => setInternalMobileMenuOpen(!internalMobileMenuOpen));

  const handleLogout = () => {
    if (auth && auth.logout) auth.logout();
    else {
      localStorage.removeItem("token");
      localStorage.removeItem("roles");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
    }
    navigate("/login");
  };

  const closeMobileMenu = () => {
    if (onMenuToggle) {
      // Si hay control externo, llamar con false para cerrar
      // Nota: onMenuToggle es toggle, así que solo cerramos si está abierto
      if (isMobileMenuOpen) onMenuToggle();
    } else {
      setInternalMobileMenuOpen(false);
    }
  };

  const handleNavigateToProfile = () => {
    navigate("/admin/perfil");
    setUserMenuOpen(false);
    closeMobileMenu();
  };

  const handleNavigateToSettings = () => {
    navigate("/admin/configuracion");
    setUserMenuOpen(false);
    closeMobileMenu();
  };

  // Prefer prop `adminData`, si está vacío usar authService.getUser()
  const currentUser = useMemo(() => {
    return (adminData && Object.keys(adminData).length > 0) ? adminData : authService.getUser() || {};
  }, [adminData]);

  // Debug: Log para verificar los datos del usuario
  useEffect(() => {
    logger.debug('[NAVBAR ADMIN] currentUser:', currentUser);
    logger.debug('[NAVBAR ADMIN] foto_perfil:', currentUser?.foto_perfil);
  }, [currentUser]);

  // usar utilidad compartida makeFotoUrlWithProxy

  return (
    <nav className="navbar admin-navbar">
      {/* Logo y nombre */}
      <div className="nav-brand">
        <img src={logo} alt="SerenVoice Logo" className="nav-logo" />
        <h1 className="nav-title">SerenVoice</h1>
        <span className="admin-badge">
          <FaShieldAlt /> Admin
        </span>
      </div>

      {/* Botón hamburguesa para móvil */}
      <button
        className={`nav-toggle ${mobileMenuOpen ? 'open' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Enlaces y menú */}
      <div className={`nav-links admin-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
        <Link to="/admin/dashboard" className="admin-link" onClick={closeMobileMenu}>
          <FaHome /> <span>Dashboard</span>
        </Link>

        <Link to="/admin/usuarios" className="admin-link" onClick={closeMobileMenu}>
          <FaUsers /> <span>Usuarios</span>
        </Link>

        <Link to="/admin/reportes" className="admin-link" onClick={closeMobileMenu}>
          <FaChartBar /> <span>Reportes</span>
        </Link>

        <Link to="/admin/alertas" className="admin-link" onClick={closeMobileMenu}>
          <FaBell /> <span>Alertas</span>
        </Link>

        {/* Menú de administrador */}
        <div className="user-menu-wrapper">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="admin-user-button"
            aria-label="Abrir menú de administrador"
          >
            {
              // Avatar mejorado con fallback elegante
              (function renderAvatar() {
                const foto = currentUser?.foto_perfil;
                const nombre = currentUser?.nombre || currentUser?.nombres || 'Admin';
                const iniciales = nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                
                // Generar color basado en el nombre
                const getColorFromName = (name) => {
                  const colors = [
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                  ];
                  const index = name.charCodeAt(0) % colors.length;
                  return colors[index];
                };
                
                const avatarStyle = {
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  background: getColorFromName(nombre),
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                };
                
                logger.debug('[NAVBAR ADMIN] Renderizando avatar, foto:', foto);
                
                if (foto) {
                  try {
                    const src = makeFotoUrlWithProxy(foto);
                    logger.debug('[NAVBAR ADMIN] URL de imagen generada:', src);
                    return (
                      <div style={{ position: 'relative', marginRight: 10 }}>
                        <img
                          src={src}
                          alt={`${nombre} avatar`}
                          style={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            border: '2px solid rgba(255,255,255,0.3)',
                          }}
                          onError={(e) => {
                            logger.error('[NAVBAR ADMIN] Error cargando imagen:', src);
                            // Reemplazar con avatar de iniciales
                            e.target.parentElement.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:600;color:#fff;background:${getColorFromName(nombre)};box-shadow:0 2px 8px rgba(0,0,0,0.15);border:2px solid rgba(255,255,255,0.3)">${iniciales}</div>`;
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 12,
                          height: 12,
                          backgroundColor: '#22c55e',
                          borderRadius: '50%',
                          border: '2px solid var(--color-panel-solid, #fff)',
                        }} title="En línea" />
                      </div>
                    );
                  } catch (err) {
                    logger.warn('[NAVBAR_ADMIN] avatar render error:', err);
                  }
                }
                
                // Avatar con iniciales elegante
                logger.debug('[NAVBAR ADMIN] No hay foto, mostrando avatar con iniciales');
                return (
                  <div style={{ position: 'relative', marginRight: 10 }}>
                    <div style={avatarStyle}>
                      {iniciales}
                    </div>
                    <span style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 12,
                      height: 12,
                      backgroundColor: '#22c55e',
                      borderRadius: '50%',
                      border: '2px solid var(--color-panel-solid, #fff)',
                    }} title="En línea" />
                  </div>
                );
              })()
            }
            <span>{currentUser.nombre || currentUser.nombres || 'Admin'}</span>
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
              <button
                onClick={handleNavigateToProfile}
                className="admin-menu-item"
              >
                <FaUser /> <span>Mi Perfil</span>
              </button>

              {/* Configuración */}
              <button
                onClick={handleNavigateToSettings}
                className="admin-menu-item"
              >
                <FaCog /> <span>Configuración</span>
              </button>

              {/* Cerrar sesión */}
              <button
                onClick={handleLogout}
                className="admin-menu-item admin-logout"
              >
                <FaSignOutAlt /> <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavbarAdministrador;
