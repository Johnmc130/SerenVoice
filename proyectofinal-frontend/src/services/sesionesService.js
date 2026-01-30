// src/services/sesionesService.js
import apiClient from "./apiClient";
import api from '../config/api';

const sesionesService = {
  // Obtener sesiones del usuario actual
  async getMySessions(limit = 10) {
    try {
      const response = await apiClient.get(api.endpoints.sesiones.mySessions, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener sesiones'
      );
    }
  },

  // Obtener sesiones activas del usuario
  async getActiveSessions() {
    try {
      const response = await apiClient.get(api.endpoints.sesiones.active);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener sesiones activas'
      );
    }
  },

  // Cerrar sesión específica
  async closeSession(id_sesion) {
    try {
      const response = await apiClient.put(api.endpoints.sesiones.close(id_sesion));
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al cerrar sesión'
      );
    }
  }
,
  // Cerrar todas las sesiones activas del usuario
  async closeAllSessions() {
    try {
      const response = await apiClient.put(api.endpoints.sesiones.closeAll);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Error al cerrar todas las sesiones'
      );
    }
  }
};

export default sesionesService;