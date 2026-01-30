// Variables de entorno para la aplicación
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
export const API_BASE_URL = `${BACKEND_URL}/api`;

// Configuración de la aplicación
export const config = {
  apiUrl: API_URL,
  backendUrl: BACKEND_URL,
  apiBaseUrl: API_BASE_URL,
};

export default config;
