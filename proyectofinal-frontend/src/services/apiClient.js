// src/services/apiClient.js
import axios from "axios";
import apiConfig from "../config/api";
import secureStorage from '../utils/secureStorage';
import secureLogger from '../utils/secureLogger';

// ==============================
// CONFIGURACIÓN BASE (SEGURO PARA EXPO)
// ==============================
const deriveBaseUrl = () => {
  if (apiConfig?.baseURL) return apiConfig.baseURL;
  const raw = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const normalized = String(raw).replace(/\/+$/, "");
  return `${normalized}/api`;
};

const API_BASE_URL = deriveBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 30000, // 30 segundos timeout
});

// ==============================
// NORMALIZAR URL
// ==============================
const normalizeUrl = (url) => {
  if (!url) return url;
  return url.replace(/\/+$/, "");
};

// ==============================
// INTERCEPTOR DE PETICIÓN
// ==============================
apiClient.interceptors.request.use(
  (config) => {
    // Usar secureStorage en lugar de localStorage para el token
    const token = secureStorage.getAccessToken() || localStorage.getItem("token");
    config.url = normalizeUrl(config.url);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Solo establecer Content-Type si no es FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Agregar cabeceras de seguridad
    config.headers['X-Requested-With'] = 'XMLHttpRequest';

    secureLogger.debug(`PETICIÓN: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    secureLogger.error("ERROR EN PETICIÓN:", error);
    return Promise.reject(error);
  }
);

// ==============================
// INTERCEPTOR DE RESPUESTA
// ==============================
apiClient.interceptors.response.use(
  (response) => {
    secureLogger.debug(`RESPUESTA ${response.status}: ${response.config.url}`);
    return response;
  },
  async (error) => {
    // Ignorar cancelaciones (AbortController / axios cancel)
    const isCanceled = error?.code === 'ERR_CANCELED' || (axios.isCancel && axios.isCancel(error));
    const status = error.response?.status;
    const url = error.config?.url;

    if (isCanceled) {
      secureLogger.debug(`PETICIÓN CANCELADA: ${url}`);
      return Promise.reject(error);
    }

    secureLogger.error(`ERROR EN RESPUESTA ${status} en ${url}`);

    if (status === 401) {
      secureLogger.warn("Token expirado o inválido (interceptor)");

      // Si la petición incluyó el header `X-Skip-Auth-Redirect`, no forzamos
      // la redirección automática. Esto permite llamadas de sondeo/filtrado
      // que no deben interrumpir la experiencia del usuario.
      const skipRedirect = error.config?.headers?.['X-Skip-Auth-Redirect'] || error.config?.skipAuthRedirect;
      if (skipRedirect) {
        secureLogger.debug('Omitiendo redirección automática para petición debido al header X-Skip-Auth-Redirect');
        return Promise.reject(error);
      }

      // Intentar refrescar el token antes de hacer logout
      const refreshToken = secureStorage.getRefreshToken();
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: { 'Authorization': `Bearer ${refreshToken}` }
          });
          
          if (response.data.token) {
            secureStorage.setAccessToken(response.data.token);
            error.config.headers.Authorization = `Bearer ${response.data.token}`;
            return apiClient(error.config);
          }
        } catch {
          secureLogger.warn('Token refresh failed');
        }
      }

      // Limpiar storage y redirigir
      secureStorage.clearTokens();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("session_id");
      
      // Redirigir a la página de login
      if (typeof window !== 'undefined') {
        window.setTimeout(() => { window.location.href = '/login'; }, 150);
      }
    }

    return Promise.reject(error);
  }
);

// ==============================
// HELPER PARA OBTENER AUDIO CON AUTH HEADER (sin token en URL)
// ==============================
export const getAuthenticatedBlobUrl = async (endpoint) => {
  try {
    const response = await apiClient.get(endpoint, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  } catch (error) {
    secureLogger.error('Error al obtener blob autenticado:', error);
    throw error;
  }
};

// ==============================
// API DE JUEGOS
// ==============================
export const juegosAPI = {
  listar: async () => {
    const response = await apiClient.get(apiConfig.endpoints.juegos.list);
    return response.data;
  },

  recomendados: async (estado) => {
    const response = await apiClient.get(apiConfig.endpoints.juegos.recomendados, { params: { estado } });
    return response.data;
  },

  iniciar: async (juegoId, estadoAntes = null) => {
    const response = await apiClient.post(apiConfig.endpoints.juegos.iniciar, {
      juego_id: juegoId,
      estado_antes: estadoAntes,
    });
    return response.data;
  },

  finalizar: async (sesionId, datos) => {
    const response = await apiClient.post(apiConfig.endpoints.juegos.finalizar, {
      sesion_id: sesionId,
      puntuacion: datos.puntuacion,
      completado: datos.completado,
      estado_despues: datos.estadoDespues,
      mejora_percibida: datos.mejora,
      notas: datos.notas || "",
    });
    return response.data;
  },

  estadisticas: async () => {
    const response = await apiClient.get(apiConfig.endpoints.juegos.estadisticas);
    return response.data;
  },

  historial: async (limit = 20) => {
    const response = await apiClient.get(apiConfig.endpoints.juegos.historial, { params: { limit } });
    return response.data;
  },
};

export default apiClient;
