import React, { useEffect, useState, useCallback, useRef } from "react";
import AuthContext from "./authContextDef";
import authService from "../services/authService";
import secureStorage from "../utils/secureStorage";
import secureLogger from "../utils/secureLogger";
import useSessionTimeout from "../hooks/useSessionTimeout";

// Constantes de configuración
const SESSION_TIMEOUT_MINUTES = 30;
const SESSION_WARNING_MINUTES = 5;

export const AuthProvider = ({ children }) => {
  // Estado de carga inicial
  const [loading, setLoading] = useState(true);
  
  // Inicializar desde secureStorage y authService
  const [token, setToken] = useState(() => {
    secureStorage.reloadFromStorage();
    return secureStorage.getAccessToken();
  });
  const [user, setUser] = useState(() => authService.getUser());
  const [roles, setRoles] = useState(() => {
    const u = authService.getUser();
    return u?.roles || [];
  });
  const [userRole, setUserRoleState] = useState(() => {
    const u = authService.getUser();
    return u?.role || null;
  });
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  
  // Referencia para navegación (se configura desde componentes que tienen acceso al router)
  const navigateRef = useRef(null);
  
  // Cargar sesión al montar
  useEffect(() => {
    secureLogger.debug('AuthProvider montado - verificando sesión existente');
    secureStorage.reloadFromStorage();
    const storedToken = secureStorage.getAccessToken();
    const storedUser = authService.getUser();
    
    if (storedToken && storedUser) {
      secureLogger.info('Sesión existente restaurada', { 
        userId: storedUser.id_usuario,
        persistent: secureStorage.isPersistentMode()
      });
      setToken(storedToken);
      setUser(storedUser);
      setRoles(storedUser.roles || []);
      setUserRoleState(storedUser.role || storedUser.roles?.[0] || null);
    } else {
      secureLogger.debug('No hay sesión existente');
    }
    
    setLoading(false);
  }, []);

  // Configurar navegación (llamar desde App.jsx)
  const setNavigate = useCallback((navFn) => {
    navigateRef.current = navFn;
  }, []);

  // Sincronizar token con secureStorage
  useEffect(() => {
    const unsubscribe = secureStorage.subscribe((newToken) => {
      setToken(newToken);
    });
    return unsubscribe;
  }, []);

  // Sincronizar token con secureStorage cuando cambia
  useEffect(() => {
    if (token) {
      // secureStorage ya maneja localStorage/sessionStorage según modo persistente
      secureStorage.setAccessToken(token, null, secureStorage.isPersistentMode());
    } else {
      secureStorage.clearTokens();
    }
  }, [token]);

  // Sincronizar user, roles y userRole con el storage correcto
  useEffect(() => {
    if (user) {
      authService.setUser(user); // Usa el storage correcto según modo
    }
  }, [user]);

  useEffect(() => {
    if (user && user.roles) {
      setRoles(user.roles);
      setUserRoleState(user.role || user.roles[0]);
    }
  }, [user]);

  // Función de logout centralizada
  const performLogout = useCallback(async (reason = 'manual') => {
    secureLogger.info('Logout iniciado', { reason });
    
    // Intentar logout remoto (también limpiará la sesión en el servidor)
    try {
      await authService.logout();
    } catch {
      secureLogger.warn("AuthProvider.logout: falló authService.logout");
    }

    // Limpiar almacenamiento seguro (limpia localStorage y sessionStorage)
    secureStorage.clearTokens();

    // Limpiar estado local
    setToken(null);
    setRoles([]);
    setUser(null);
    setUserRoleState(null);
    setShowTimeoutWarning(false);

    // Navegar a login si es timeout
    if (reason === 'timeout' && navigateRef.current) {
      navigateRef.current('/login', { 
        state: { message: 'Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.' }
      });
    }
  }, []);

  // Handlers para timeout de sesión
  const handleSessionTimeout = useCallback(() => {
    setShowTimeoutWarning(false);
    performLogout('timeout');
  }, [performLogout]);

  const handleSessionWarning = useCallback((minutesLeft) => {
    secureLogger.debug('Advertencia de sesión', { minutesLeft });
    setShowTimeoutWarning(true);
  }, []);

  // Hook de timeout de sesión
  const { resetTimer } = useSessionTimeout({
    timeoutMinutes: SESSION_TIMEOUT_MINUTES,
    warningMinutes: SESSION_WARNING_MINUTES,
    onTimeout: handleSessionTimeout,
    onWarning: handleSessionWarning,
    enabled: !!token // Solo activo si hay sesión
  });

  // Extender sesión (llamar cuando el usuario interactúa o confirma la advertencia)
  const extendSession = useCallback(() => {
    setShowTimeoutWarning(false);
    resetTimer();
    secureLogger.debug('Sesión extendida por actividad del usuario');
  }, [resetTimer]);

  const login = useCallback(({ token: newToken, refreshToken, roles: newRoles = [], user: newUser = null, recordarme = false }) => {
    // Guardar token en memoria segura con modo persistente
    secureStorage.setAccessToken(newToken, null, recordarme);
    if (refreshToken) {
      secureStorage.setRefreshToken(refreshToken, recordarme);
    }
    
    setToken(newToken);
    setRoles(newRoles);
    
    // Asegurar que user.role esté establecido desde roles array
    if (newUser && !newUser.role && newRoles.length > 0) {
      newUser.role = newRoles[0];
    }
    
    setUser(newUser);
    setUserRoleState(newUser?.role || newRoles[0] || null);
    setShowTimeoutWarning(false);
    
    // Guardar user en el storage correcto
    if (newUser) {
      const storage = recordarme ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(newUser));
    }
    
    // Resetear timer de sesión
    resetTimer();
    
    secureLogger.info('Login exitoso', { persistent: recordarme });
  }, [resetTimer]);

  const logout = useCallback(async () => {
    await performLogout('manual');
  }, [performLogout]);

  const setUserRole = useCallback((role) => {
    setUserRoleState(role);
  }, []);

  // Verificar si la sesión es válida
  const isSessionValid = useCallback(() => {
    return secureStorage.hasValidToken();
  }, []);

  // Verificar si el token está por expirar
  const isTokenExpiringSoon = useCallback(() => {
    return secureStorage.isTokenExpiringSoon();
  }, []);

  // Mostrar loading durante inicialización
  if (loading) {
    return <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      color: 'var(--color-text-main, #000)'
    }}>Cargando sesión...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      token, 
      user,
      roles, 
      userRole, 
      isAuthenticated: !!token && !!user,
      loading,
      login, 
      logout, 
      setUserRole,
      setNavigate,
      // Nuevas propiedades de seguridad
      showTimeoutWarning,
      extendSession,
      isSessionValid,
      isTokenExpiringSoon
    }}>
      {children}
      
      {/* Modal de advertencia de timeout */}
      {showTimeoutWarning && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div 
            style={{
              backgroundColor: 'var(--color-panel, #fff)',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-main, #333)' }}>
              ⚠️ Sesión por expirar
            </h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary, #666)' }}>
              Tu sesión expirará en {SESSION_WARNING_MINUTES} minutos por inactividad.
              ¿Deseas continuar conectado?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={extendSession}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--color-primary, #4CAF50)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Continuar
              </button>
              <button
                onClick={() => performLogout('manual')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-main, #333)',
                  border: '1px solid var(--color-border, #ddd)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

