import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaChartBar,
  FaBell,
  FaExclamationTriangle,
  FaCog,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaClipboardList,
  FaGamepad,
  FaUserFriends,
  FaLightbulb,
  FaShieldAlt,
  FaHistory,
  FaBrain,
  FaEnvelope,
  FaPlayCircle,
} from "react-icons/fa";

const SidebarAdmin = ({ isCollapsed, onToggle, isMobileOpen }) => {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  // Determinar qué submenú abrir basándose en la ruta actual
  useEffect(() => {
    if (location.pathname.startsWith("/admin/reportes") || 
        location.pathname.startsWith("/admin/analisis") ||
        location.pathname.startsWith("/admin/auditoria")) {
      setOpenSubmenu("reportes");
    } else if (
      location.pathname.startsWith("/admin/configuracion") ||
      location.pathname.startsWith("/admin/perfil")
    ) {
      setOpenSubmenu("config");
    } else if (location.pathname.startsWith("/admin/grupos")) {
      setOpenSubmenu("grupos");
    } else if (location.pathname.startsWith("/admin/juegos") ||
               location.pathname.startsWith("/admin/sesiones-juego")) {
      setOpenSubmenu("juegos");
    }
  }, [location.pathname]);

  const toggleSubmenu = (menu) => {
    if (isCollapsed) {
      // Si está colapsado, expandir primero
      onToggle?.();
      setTimeout(() => setOpenSubmenu(menu), 150);
    } else {
      setOpenSubmenu(openSubmenu === menu ? null : menu);
    }
  };

  const menuItems = [
    {
      type: "link",
      to: "/admin/dashboard",
      icon: <FaHome />,
      label: "Panel Principal",
    },
    {
      type: "link",
      to: "/admin/usuarios",
      icon: <FaUsers />,
      label: "Usuarios",
    },
    {
      type: "submenu",
      id: "grupos",
      icon: <FaUserFriends />,
      label: "Grupos",
      items: [
        { to: "/admin/grupos", label: "Ver Grupos" },
        { to: "/admin/grupos/nuevo", label: "Crear Grupo" },
      ],
    },
    {
      type: "link",
      to: "/admin/alertas",
      icon: <FaExclamationTriangle />,
      label: "Alertas",
    },
    {
      type: "link",
      to: "/admin/notificaciones",
      icon: <FaBell />,
      label: "Notificaciones",
    },
    {
      type: "link",
      to: "/admin/preferencias-notificacion",
      icon: <FaEnvelope />,
      label: "Config. Notificaciones",
    },
    {
      type: "link",
      to: "/admin/recomendaciones",
      icon: <FaLightbulb />,
      label: "Recomendaciones",
    },
    {
      type: "divider",
    },
    {
      type: "submenu",
      id: "juegos",
      icon: <FaGamepad />,
      label: "Juegos",
      items: [
        { to: "/admin/juegos", label: "Gestionar Juegos" },
        { to: "/admin/sesiones-juego", label: "Sesiones de Juego", icon: <FaPlayCircle /> },
      ],
    },
    {
      type: "submenu",
      id: "reportes",
      icon: <FaChartBar />,
      label: "Reportes",
      items: [
        { to: "/admin/reportes", label: "Reportes Generales" },
        { to: "/admin/analisis", label: "Análisis Emocional", icon: <FaBrain /> },
        { to: "/admin/auditoria", label: "Auditoría", icon: <FaHistory /> },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "submenu",
      id: "config",
      icon: <FaCog />,
      label: "Configuración",
      items: [
        { to: "/admin/perfil", label: "Mi Perfil", icon: <FaUser /> },
        { to: "/admin/configuracion", label: "Ajustes del Sistema", icon: <FaShieldAlt /> },
      ],
    },
  ];

  return (
    <aside
      className={`sidebar-admin ${isCollapsed ? "collapsed" : ""} ${
        isMobileOpen ? "mobile-open" : ""
      }`}
    >
      {/* Botón de colapsar/expandir */}
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      {/* Navegación */}
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item, index) => {
            if (item.type === "divider") {
              return <li key={`divider-${index}`} className="sidebar-divider" />;
            }

            if (item.type === "submenu") {
              const isOpen = openSubmenu === item.id;
              const isActive = item.items.some((sub) =>
                location.pathname.startsWith(sub.to)
              );

              return (
                <li
                  key={item.id}
                  className={`sidebar-item has-submenu ${isActive ? "active" : ""}`}
                >
                  <button
                    className={`sidebar-link submenu-toggle ${isActive ? "active" : ""}`}
                    onClick={() => toggleSubmenu(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="sidebar-label">{item.label}</span>
                        <FaChevronDown
                          className={`submenu-arrow ${isOpen ? "open" : ""}`}
                        />
                      </>
                    )}
                  </button>

                  {!isCollapsed && (
                    <ul className={`sidebar-submenu ${isOpen ? "open" : ""}`}>
                      {item.items.map((subItem) => (
                        <li key={subItem.to}>
                          <NavLink
                            to={subItem.to}
                            className={({ isActive }) =>
                              `sidebar-sublink ${isActive ? "active" : ""}`
                            }
                            end={subItem.to === "/admin/grupos" || subItem.to === "/admin/reportes"}
                          >
                            {subItem.icon && (
                              <span className="sidebar-icon small">{subItem.icon}</span>
                            )}
                            <span>{subItem.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.to} className="sidebar-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer del sidebar */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">
            <FaShieldAlt style={{ marginRight: "6px", verticalAlign: "middle" }} />
            Panel de Administración
          </p>
          <p className="sidebar-footer-text">SerenVoice © 2025</p>
        </div>
      )}
    </aside>
  );
};

export default SidebarAdmin;
