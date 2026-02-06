// Variables de entorno para la aplicación
// En producción con Nginx proxy, usar rutas relativas
export const API_URL = import.meta.env.VITE_API_URL || '';
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
export const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

// Configuración de la aplicación
export const config = {
  apiUrl: API_URL || '/api',
  backendUrl: BACKEND_URL || '',
  apiBaseUrl: API_BASE_URL,
};

export default config;
