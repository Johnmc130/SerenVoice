// src/utils/ProtectedRoute.jsx
import React, { useEffect, useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/authContextDef";
import secureStorage from "./secureStorage";
import logger from './logger';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useContext(AuthContext);
  
  useEffect(() => {
    logger.debug("[DEPURACIÓN] ProtectedRoute montado, verificando usuario...");
  }, []);
  
  const hasToken = secureStorage.hasValidToken();
  
  logger.debug("[DEPURACIÓN] Cargando:", loading);
  logger.debug("[DEPURACIÓN] Usuario obtenido:", user);
  logger.debug("[DEPURACIÓN] Token válido:", hasToken);
  logger.debug("[DEPURACIÓN] Rol requerido:", requiredRole, ", usuario tiene:", user?.role);

  // ESPERAR a que AuthContext termine de cargar
  if (loading) {
    logger.debug("[DEPURACIÓN] AuthContext cargando... esperando");
    return <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      color: 'var(--color-text-main, #000)'
    }}>Verificando sesión...</div>;
  }

  // Verificar DESPUÉS de que cargue si hay token válido
  if (!hasToken || !user) {
    logger.debug("[DEPURACIÓN] Sin token o sin usuario → redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const userRole = (user.role || '').toString().toLowerCase();
    const reqRole = (requiredRole || '').toString().toLowerCase();
    
    // Normalizar 'admin' y 'administrador' como equivalentes
    const normalizeRole = (role) => {
      if (role === 'admin' || role === 'administrador') return 'admin';
      return role;
    };
    
    if (normalizeRole(userRole) !== normalizeRole(reqRole)) {
      logger.debug(`[DEPURACIÓN] Rol incorrecto → redirigiendo a /`);
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
