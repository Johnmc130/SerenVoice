// src/services/rolesService.js
import apiClient from "./apiClient";

const rolesService = {
  // Obtener todos los roles (solo admin)
  async getAllRoles() {
    try {
      const response = await apiClient.get('/roles');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener roles'
      );
    }
  },

  // Obtener rol por ID
  async getRoleById(id_rol) {
    try {
      const response = await apiClient.get(`/roles/${id_rol}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener rol'
      );
    }
  },

  // Crear nuevo rol (solo admin)
  async createRole(nombre_rol, descripcion = null) {
    try {
      const response = await apiClient.post('/roles', {
        nombre_rol,
        descripcion
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al crear rol'
      );
    }
  }
};

export default rolesService;