// src/utils/secureStorage.js
// Almacenamiento seguro de tokens con soporte para persistencia
// Soporta modo "Recuérdame" con localStorage y sesiones temporales con sessionStorage

/**
 * SecureStorage - Almacena tokens de forma segura
 * 
 * Modos:
 * - Persistente (recordarme=true): Usa localStorage, persiste al cerrar navegador
 * - Sesión (recordarme=false): Usa sessionStorage, se borra al cerrar navegador
 */

// Closure para mantener tokens
const createSecureStorage = () => {
  // Estado privado
  let _accessToken = null;
  let _refreshToken = null;
  let _tokenExpiry = null;
  let _isPersistent = false;
  
  const _listeners = new Set();
  
  // Claves de almacenamiento
  const KEYS = {
    ACCESS: 'sv_access',
    REFRESH: 'sv_refresh',
    EXPIRY: 'sv_expiry',
    PERSISTENT: 'sv_persist'
  };

  const getStorage = () => _isPersistent ? localStorage : sessionStorage;
  
  const save = () => {
    try {
      const s = getStorage();
      if (_accessToken) s.setItem(KEYS.ACCESS, _accessToken);
      if (_refreshToken) s.setItem(KEYS.REFRESH, _refreshToken);
      if (_tokenExpiry) s.setItem(KEYS.EXPIRY, _tokenExpiry.toString());
      s.setItem(KEYS.PERSISTENT, _isPersistent.toString());
    } catch (e) {
      console.warn('Error guardando tokens:', e);
    }
  };
  
  const load = () => {
    try {
      // Primero intentar desde localStorage (sesiones persistentes)
      let isPersist = localStorage.getItem(KEYS.PERSISTENT);
      let s = localStorage;
      
      // Si no hay datos en localStorage, intentar sessionStorage
      if (!localStorage.getItem(KEYS.ACCESS) && sessionStorage.getItem(KEYS.ACCESS)) {
        isPersist = sessionStorage.getItem(KEYS.PERSISTENT) || 'false';
        s = sessionStorage;
      }
      
      _accessToken = s.getItem(KEYS.ACCESS);
      _refreshToken = s.getItem(KEYS.REFRESH);
      const exp = s.getItem(KEYS.EXPIRY);
      _tokenExpiry = exp ? parseInt(exp, 10) : null;
      _isPersistent = isPersist === 'true';
      
      // Verificar expiración
      if (_tokenExpiry && Date.now() > _tokenExpiry) {
        _accessToken = null;
        _refreshToken = null;
        _tokenExpiry = null;
      }
      
      // Log de debug
      if (_accessToken) {
        console.log('[secureStorage] Tokens cargados:', {
          hasAccess: !!_accessToken,
          hasRefresh: !!_refreshToken,
          isPersistent: _isPersistent,
          from: s === localStorage ? 'localStorage' : 'sessionStorage'
        });
      }
    } catch (e) {
      console.warn('Error cargando tokens:', e);
    }
  };

  const notifyListeners = () => {
    _listeners.forEach(listener => {
      try {
        listener(_accessToken);
      } catch (e) {
        console.warn('Listener error:', e);
      }
    });
  };
  
  load();

  return {
    /**
     * Almacena el access token
     * @param {string|null} token - JWT access token
     * @param {number} [expiresIn] - Segundos hasta expiración
     * @param {boolean} [persistent] - Persistir al cerrar navegador
     */
    setAccessToken(token, expiresIn = null, persistent = false) {
      _accessToken = token;
      _isPersistent = persistent;
      
      if (token && expiresIn) {
        _tokenExpiry = Date.now() + (expiresIn * 1000);
      } else if (!token) {
        _tokenExpiry = null;
      }
      
      save();
      notifyListeners();
    },

    /**
     * Obtiene el access token actual
     * @returns {string|null}
     */
    getAccessToken() {
      // Verificar si el token ha expirado
      if (_tokenExpiry && Date.now() > _tokenExpiry) {
        this.clearTokens();
        return null;
      }
      return _accessToken;
    },

    /**
     * Almacena el refresh token
     * @param {string|null} token
     * @param {boolean} [persistent] - Persistir al cerrar navegador
     */
    setRefreshToken(token, persistent = false) {
      _refreshToken = token;
      _isPersistent = persistent;
      save();
    },

    /**
     * Obtiene el refresh token
     * @returns {string|null}
     */
    getRefreshToken() {
      return _refreshToken;
    },

    /**
     * Verifica si hay un token válido
     * @returns {boolean}
     */
    hasValidToken() {
      const token = this.getAccessToken();
      return token !== null && token !== undefined && token !== '';
    },

    /**
     * Verifica si el token está próximo a expirar (dentro de 5 minutos)
     * @returns {boolean}
     */
    isTokenExpiringSoon() {
      if (!_tokenExpiry) return false;
      const fiveMinutes = 5 * 60 * 1000;
      return Date.now() > (_tokenExpiry - fiveMinutes);
    },

    /**
     * Limpia todos los tokens
     */
    clearTokens() {
      _accessToken = null;
      _refreshToken = null;
      _tokenExpiry = null;
      _isPersistent = false;
      
      try {
        [localStorage, sessionStorage].forEach(s => {
          Object.values(KEYS).forEach(k => s.removeItem(k));
        });
        // Limpiar legacy
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('session_id');
      } catch (e) {
        console.warn('Error clearing storage:', e);
      }
      
      notifyListeners();
    },

    /**
     * Registra un listener para cambios de token
     * @param {Function} listener
     * @returns {Function} Función para cancelar la suscripción
     */
    subscribe(listener) {
      _listeners.add(listener);
      return () => _listeners.delete(listener);
    },

    /**
     * Obtiene información del token (sin datos sensibles)
     * @returns {Object}
     */
    getTokenInfo() {
      return {
        hasToken: !!_accessToken,
        hasRefreshToken: !!_refreshToken,
        expiresAt: _tokenExpiry ? new Date(_tokenExpiry).toISOString() : null,
        isExpiringSoon: this.isTokenExpiringSoon(),
        isPersistent: _isPersistent
      };
    },
    
    isPersistentMode() {
      return _isPersistent;
    },
    
    /**
     * Recarga tokens desde storage (útil al inicializar la app)
     */
    reloadFromStorage() {
      load();
      notifyListeners();
    }
  };
};

// Singleton instance
const secureStorage = createSecureStorage();

// Prevenir modificaciones al objeto exportado
Object.freeze(secureStorage);

export default secureStorage;

// También exportar para migración gradual desde localStorage
export const migrateFromLocalStorage = () => {
  try {
    const oldToken = localStorage.getItem('token');
    if (oldToken) {
      secureStorage.setAccessToken(oldToken);
      // Opcional: limpiar después de migrar
      // localStorage.removeItem('token');
    }
    return true;
  } catch (e) {
    console.warn('Error migrating token from localStorage:', e);
    return false;
  }
};
