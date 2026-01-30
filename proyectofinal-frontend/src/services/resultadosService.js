// src/services/resultadosService.js
import apiClient from "./apiClient";
import api from '../config/api';

const resultadosService = {
  // Obtener resultado por ID
  async getById(id_resultado) {
    try {
      const response = await apiClient.get(api.endpoints.resultados.byId(id_resultado));
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener resultado'
      );
    }
  }
};

export default resultadosService;