// src/services/analisisService.js
import apiClient from "./apiClient";
import api from '../config/api';

const analisisService = {
  // Obtener detalle de un análisis
  async getAnalisisById(id_analisis) {
    try {
      const response = await apiClient.get(api.endpoints.analisis.get(id_analisis));
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener análisis'
      );
    }
  },

  /**
   * Obtener historial de análisis del usuario con filtros opcionales
   * @param {number} limit - Límite de resultados
   * @param {Object} filters - Filtros opcionales
   * @param {string} filters.fecha_inicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} filters.fecha_fin - Fecha fin (YYYY-MM-DD)
   * @param {string} filters.estado - Estado del análisis (completado, pendiente, error)
   * @param {string} filters.clasificacion - Clasificación del resultado
   * @param {string} filters.emocion_dominante - Emoción dominante detectada
   * @returns {Promise<Object>} Respuesta con historial de análisis
   */
  async getHistory(limit = 50, filters = {}) {
    try {
      // Construir parámetros de la petición
      const params = { limit };
      
      // Agregar filtros si existen
      if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio;
      if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin;
      if (filters.estado) params.estado = filters.estado;
      if (filters.clasificacion) params.clasificacion = filters.clasificacion;
      if (filters.emocion_dominante) params.emocion_dominante = filters.emocion_dominante;
      
      const response = await apiClient.get(api.endpoints.analisis.history, { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener historial'
      );
    }
  }
};

export default analisisService;