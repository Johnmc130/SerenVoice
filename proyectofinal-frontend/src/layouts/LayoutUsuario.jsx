import React, { useState, useEffect, useContext } from "react";
import NavbarUsuario from "../components/Usuario/NavbarUsuario";
import SidebarUsuario from "../components/Usuario/SidebarUsuario";
import { ThemeContext } from "../context/themeContextDef";
import authService from "../services/authService";
import FondoClaro from "../assets/FondoClaro.svg";
import FondoOscuro from "../assets/FondoOscuro.svg";
import "../styles/StylesUsuarios/SidebarUsuario.css";

/**
 * LayoutUsuario - Componente de layout para páginas de usuario
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido de la página
 * @param {boolean} props.showNavbar - Si mostrar el navbar (default: true)
 * @param {boolean} props.showSidebar - Si mostrar el sidebar (default: true)
 * @param {boolean} props.fullWidth - Si el contenido debe ocupar todo el ancho (default: false)
 */
const LayoutUsuario = ({ 
  children, 
  showNavbar = true, 
  showSidebar = true,
  fullWidth = false 
}) => {
  const { isDark } = useContext(ThemeContext);
  const userData = authService.getUser();
  
  // Estado del sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Recuperar estado guardado del localStorage
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Guardar estado del sidebar en localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Cerrar menú móvil al cambiar de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cerrar menú móvil al navegar (cuando cambian los children)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [children]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Calcular clases para el contenido principal
  const mainContentClasses = [
    "main-content-with-sidebar",
    sidebarCollapsed ? "sidebar-collapsed" : "",
    !showSidebar ? "no-sidebar" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={`layout-with-sidebar ${!showSidebar ? "no-sidebar" : ""}`}>
      {/* Navbar superior */}
      {showNavbar && (
        <NavbarUsuario 
          userData={userData} 
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={mobileMenuOpen}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <SidebarUsuario
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          isMobileOpen={mobileMenuOpen}
        />
      )}

      {/* Overlay para móvil */}
      {showSidebar && (
        <div
          className={`sidebar-overlay ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Contenido principal */}
      <main
        className={mainContentClasses}
        style={{
          backgroundImage: `url(${isDark ? FondoOscuro : FondoClaro})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
          paddingTop: showNavbar ? "70px" : "0",
          marginLeft: !showSidebar ? "0" : undefined,
        }}
      >
        <div 
          className="content-wrapper" 
          style={{ 
            padding: fullWidth ? "0" : "2rem",
            maxWidth: fullWidth ? "none" : "1400px",
            margin: fullWidth ? "0" : "0 auto",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default LayoutUsuario;
