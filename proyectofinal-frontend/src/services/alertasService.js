// src/services/alertasService.js
import apiClient from "./apiClient";
import api from '../config/api';

const alertasService = {
  // Obtener alertas del usuario actual
  async getMyAlerts() {
    try {
      const response = await apiClient.get(api.endpoints.alertas.myAlerts);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener alertas'
      );
    }
  },

  // Obtener todas las alertas activas (solo admin)
  async getActiveAlerts() {
    try {
      const response = await apiClient.get(api.endpoints.alertas.active);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener alertas activas'
      );
    }
  },

  // Obtener alerta específica
  async getAlertById(id_alerta) {
    try {
      const response = await apiClient.get(api.endpoints.alertas.byId(id_alerta));
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener alerta'
      );
    }
  }
,
  // Asignar alerta a un usuario (admin)
  async asignarAlert(id_alerta, payload) {
    try {
      const response = await apiClient.patch(api.endpoints.alertas.asignar(id_alerta), payload);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Error al asignar alerta'
      );
    }
  },

  // Resolver alerta con notas
  async resolverAlert(id_alerta, payload) {
    try {
      const response = await apiClient.patch(api.endpoints.alertas.resolver(id_alerta), payload);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Error al resolver alerta'
      );
    }
  }
};

export default alertasService;