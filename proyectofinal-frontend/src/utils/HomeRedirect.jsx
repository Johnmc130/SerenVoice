// src/utils/HomeRedirect.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/authContextDef";
import Inicio from "../Pages/PaginasPublicas/Inicio.jsx";

/**
 * Componente que redirecciona automáticamente al dashboard
 * si el usuario está autenticado, o muestra la página de Inicio
 */
const HomeRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  // Esperar a que termine de cargar la sesión
  if (loading) {
    return <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      color: 'var(--color-text-main, #000)'
    }}>Cargando...</div>;
  }

  // Si está autenticado, redirigir según rol
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Si no está autenticado, mostrar página de inicio
  return <Inicio />;
};

export default HomeRedirect;
