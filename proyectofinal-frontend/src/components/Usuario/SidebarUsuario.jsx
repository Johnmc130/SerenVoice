import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaHome,
  FaMicrophone,
  FaHistory,
  FaLightbulb,
  FaGamepad,
  FaUsers,
  FaChartBar,
  FaBell,
  FaCog,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaEnvelope,
} from "react-icons/fa";

const SidebarUsuario = ({ isCollapsed, onToggle, isMobileOpen }) => {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  // Determinar qué submenú abrir basándose en la ruta actual
  useEffect(() => {
    if (location.pathname.startsWith("/grupos")) {
      setOpenSubmenu("grupos");
    } else if (location.pathname.startsWith("/configuracion") || location.pathname.startsWith("/actualizar-perfil") || location.pathname.startsWith("/notificaciones/configuracion") || location.pathname.startsWith("/sesiones")) {
      setOpenSubmenu("config");
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
      to: "/dashboard",
      icon: <FaHome />,
      label: "Inicio",
    },
    {
      type: "link",
      to: "/analizar-voz",
      icon: <FaMicrophone />,
      label: "Analizar Voz",
    },
    {
      type: "link",
      to: "/historial",
      icon: <FaHistory />,
      label: "Historial",
    },
    {
      type: "link",
      to: "/recomendaciones",
      icon: <FaLightbulb />,
      label: "Recomendaciones",
    },
    {
      type: "link",
      to: "/juegos",
      icon: <FaGamepad />,
      label: "Juegos Terapéuticos",
    },
    {
      type: "submenu",
        id: "grupos",
      icon: <FaUsers />,
      label: "Grupos",
      items: [
        { to: "/grupos?owner=me", label: "Mis Grupos" },
        { to: "/buscar-grupos", label: "Buscar Grupos" },
        { to: "/grupos/nuevo", label: "Crear Grupo" },
        { to: "/invitaciones", label: "Invitaciones" },
      ],
    },
    {
      type: "link",
      to: "/reportes",
      icon: <FaChartBar />,
      label: "Mis Reportes",
    },
    {
      type: "link",
      to: "/notificaciones",
      icon: <FaBell />,
      label: "Notificaciones",
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
        { to: "/actualizar-perfil", label: "Mi Perfil", icon: <FaUser /> },
        { to: "/configuracion", label: "Preferencias", icon: <FaCog /> },
        { to: "/notificaciones/configuracion", label: "Notificaciones", icon: <FaBell /> },
      ],
    },
  ];

  return (
    <aside className={`sidebar-usuario ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
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
                <li key={item.id} className={`sidebar-item has-submenu ${isActive ? "active" : ""}`}>
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
                            end={subItem.to === "/grupos"}
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
          <p className="sidebar-footer-text">SerenVoice © 2025</p>
        </div>
      )}
    </aside>
  );
};

export default SidebarUsuario;
