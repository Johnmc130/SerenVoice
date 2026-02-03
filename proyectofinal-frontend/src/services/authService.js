// src/services/authService.js
import apiClient from "./apiClient";
import api from "../config/api";
import sesionesService from "./sesionesService";
import secureLogger from '../utils/secureLogger';
import secureStorage from '../utils/secureStorage';
import { sanitizeEmail, sanitizeName } from '../utils/sanitize';

const authService = {
  publicMode: false, // activar para pruebas públicas

  async login(email, password, recordarme = false) {
    if (this.publicMode) {
      secureLogger.debug("[authService] Modo público activado: inicio de sesión ignorado");
      return { token: null, user: null };
    }

    // Sanitizar correo antes de enviar
    const { sanitized: sanitizedEmail, valid } = sanitizeEmail(email);
    if (!valid) {
      throw new Error("Formato de correo electrónico inválido");
    }

    try {
      // Usar skipAuthRedirect para que el interceptor NO redirija en caso de 401
      // (credenciales incorrectas deben mostrar error, no recargar página)
      const response = await apiClient.post(api.endpoints.auth.login, { 
        correo: sanitizedEmail, 
        contrasena: password, // No sanitizar contraseñas
        recordarme: recordarme // Enviar parámetro de recordar sesión
      }, { skipAuthRedirect: true });
      
      if (!response.data.success) throw new Error(response.data.error || "Credenciales incorrectas");

      const { token, refresh_token, user } = response.data;
      const session_id = response.data.session_id || null;
      
      // Manejar roles como arreglo
      const userWithRole = { 
        ...user, 
        role: user.roles && user.roles.length > 0 ? user.roles[0] : "usuario",
        roles: user.roles || ["usuario"]
      };

      // Guardar tokens en secureStorage con persistencia según recordarme
      secureStorage.setAccessToken(token, null, recordarme);
      if (refresh_token) {
        secureStorage.setRefreshToken(refresh_token, recordarme);
      }
      
      // Guardar usuario y session_id con el mismo criterio
      const storage = recordarme ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(userWithRole));
      if (session_id) storage.setItem("session_id", session_id);
      
      secureLogger.info('Login exitoso', { persistent: recordarme });
      return { token, refresh_token, user: userWithRole };
    } catch (error) {
      secureLogger.warn('Login fallido');
      // Crear error personalizado con toda la información del backend
      const errorData = error.response?.data || {};
      const errorObj = new Error(errorData.error || error.message);
      errorObj.response = error.response; // Mantener respuesta completa
      errorObj.attempts_left = errorData.attempts_left;
      errorObj.blocked = errorData.blocked;
      errorObj.remaining_time = errorData.remaining_time;
      throw errorObj;
    }
  },

  async register(userData) {
    if (this.publicMode) {
      secureLogger.debug("[authService] Modo público activado: registro ignorado");
      return { token: null, user: null };
    }

    // Sanitizar datos de entrada
    const { sanitized: sanitizedEmail, valid } = sanitizeEmail(userData.correo);
    if (!valid) {
      throw new Error("Formato de correo electrónico inválido");
    }

    try {
      const response = await apiClient.post(api.endpoints.auth.register, {
        nombre: sanitizeName(userData.nombres || userData.nombre),
        apellido: sanitizeName(userData.apellidos || userData.apellido),
        correo: sanitizedEmail,
        contrasena: userData.contrasena, // No sanitizar contraseñas
        genero: userData.genero,
        fecha_nacimiento: userData.fecha_nacimiento || null
      });

      if (!response.data.success) throw new Error(response.data.error || "Error al registrar usuario");

      secureLogger.info('Registro exitoso');
      return response.data;
    } catch (error) {
      secureLogger.warn('Registro fallido');
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  async registerWithPhoto(formData) {
    if (this.publicMode) {
      secureLogger.debug("[authService] Modo público activado: registro ignorado");
      return { token: null, user: null };
    }

    try {
      const response = await apiClient.post(api.endpoints.auth.register, formData);

      if (!response.data.success) throw new Error(response.data.error || "Error al registrar usuario");

      secureLogger.info('Registro con foto exitoso');
      return response.data;
    } catch (error) {
      secureLogger.warn('Registro con foto fallido');
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  async logout() {
    if (this.publicMode) return;
    try {
      const sessionId = localStorage.getItem("session_id");
      secureLogger.debug('[authService] logout called');
      
      if (sessionId) {
        try {
          secureLogger.debug('[authService] attempting to close remote session');
          await sesionesService.closeSession(sessionId);
          secureLogger.debug('[authService] remote session closed successfully');
        } catch {
          secureLogger.warn("Error cerrando sesión remota");
        }
      } else {
        secureLogger.debug('[authService] no session_id found — attempting to close all active sessions');
        try {
          await sesionesService.closeAllSessions();
          secureLogger.debug('[authService] closeAllSessions succeeded');
        } catch {
          secureLogger.warn('[authService] closeAllSessions failed');
        }
      }
    } finally {
      // Limpiar almacenamiento seguro (borra localStorage y sessionStorage)
      secureStorage.clearTokens();
      
      // Limpiar rate limiter del login
      try {
        sessionStorage.removeItem('login_attempts');
      } catch {
        // Ignorar errores de limpieza
      }
      
      secureLogger.info('Logout completado');
    }
  },

  getToken() {
    if (this.publicMode) return null;
    return secureStorage.getAccessToken();
  },

  getUser() {
    if (this.publicMode) return null;
    // Intentar sessionStorage primero, luego localStorage
    let user = sessionStorage.getItem("user") || localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getCurrentUser() {
    return this.getUser();
  },

  isAuthenticated() {
    if (this.publicMode) return false;
    return secureStorage.hasValidToken();
  },

  setUser(updatedUser) {
    if (this.publicMode) return;
    const userWithRole = { 
      ...updatedUser, 
      role: updatedUser.role || (updatedUser.roles?.[0] || "usuario"),
      roles: updatedUser.roles || ["usuario"]
    };
    // Guardar en el storage que corresponda según el modo persistente
    const storage = secureStorage.isPersistentMode() ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(userWithRole));
  },

  // Método para autenticación con Google
  async googleAuth(googleData) {
    if (this.publicMode) {
      secureLogger.debug("[authService] Modo público activado: Google Auth ignorado");
      return { token: null, user: null };
    }

    try {
      // Sanitizar datos de Google
      const sanitizedData = {
        google_uid: googleData.google_uid,
        correo: sanitizeEmail(googleData.correo).sanitized,
        nombre: sanitizeName(googleData.nombre || ''),
        apellido: sanitizeName(googleData.apellido || ''),
        foto_perfil: googleData.foto_perfil || '',
        fecha_nacimiento: googleData.fecha_nacimiento,
        genero: googleData.genero
      };

      const response = await apiClient.post(api.endpoints.auth.google, sanitizedData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Error en autenticación de Google");
      }

      const { token, refresh_token, user } = response.data;
      
      // Manejar roles como arreglo
      const userWithRole = { 
        ...user, 
        role: user.roles && user.roles.length > 0 ? user.roles[0] : "usuario",
        roles: user.roles || ["usuario"]
      };

      // Guardar en almacenamiento seguro
      secureStorage.setAccessToken(token);
      if (refresh_token) {
        secureStorage.setRefreshToken(refresh_token);
      }
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userWithRole));
      if (response.data.session_id) localStorage.setItem("session_id", response.data.session_id);
      
      secureLogger.info('Google Auth exitoso');
      return { token, refresh_token, user: userWithRole };
    } catch (error) {
      secureLogger.warn('Google Auth fallido');
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  // Verificar si el token está por expirar
  isTokenExpiringSoon() {
    return secureStorage.isTokenExpiringSoon();
  },

  // Refrescar token manualmente
  async refreshToken() {
    const currentRefreshToken = secureStorage.getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('No hay token de actualización disponible');
    }

    try {
      const response = await apiClient.post(api.endpoints.auth.refresh || '/auth/refresh', {}, {
        headers: { 'Authorization': `Bearer ${currentRefreshToken}` }
      });

      if (response.data.token) {
        secureStorage.setAccessToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        secureLogger.debug('Token actualizado exitosamente');
        return response.data.token;
      }
      
      throw new Error('No se recibió nuevo token');
    } catch (error) {
      secureLogger.warn('Error actualizando token');
      throw error;
    }
  }
};

export default authService;
