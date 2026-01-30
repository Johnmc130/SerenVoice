import apiClient from './apiClient';
import api from '../config/api';

export const userService = {
  async getProfile() {
    try {
      const response = await apiClient.get(api.endpoints.users.me);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener perfil' };
    }
  },

  async getUserById(userId) {
    try {
      const response = await apiClient.get(`${api.endpoints.users.byId}/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener usuario' };
    }
  },

  async updateProfile(userId, userData) {
    try {
      const response = await apiClient.put(
        `${api.endpoints.users.byId}/${userId}`, 
        userData
      );
      
      // Actualizar usuario en localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar perfil' };
    }
  },

  async getAllUsers(page = 1, perPage = 20) {
    try {
      const response = await apiClient.get(
        `${api.endpoints.users.list}?page=${page}&per_page=${perPage}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener usuarios' };
    }
  },

  async searchUsers(query = '', page = 1, perPage = 10) {
    try {
      const q = encodeURIComponent(query || '');
      const response = await apiClient.get(
        `${api.endpoints.usuarios.search}?query=${q}&page=${page}&per_page=${perPage}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al buscar usuarios' };
    }
  },

  async deleteUser(userId) {
    try {
      const response = await apiClient.delete(`${api.endpoints.users.byId}/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar usuario' };
    }
  }
};

export default userService;