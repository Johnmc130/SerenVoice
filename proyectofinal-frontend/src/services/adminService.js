import apiClient from './apiClient';
import api from '../config/api';

export const adminService = {
  async getDashboardStats() {
    try {
      const response = await apiClient.get(api.endpoints.admin.dashboard);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener estadísticas' };
    }
  },

  async getUsers(filters = {}) {
    try {
      const response = await apiClient.get(api.endpoints.admin.users, { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener usuarios' };
    }
  },

  async getStatistics(period = 'month') {
    try {
      const response = await apiClient.get(api.endpoints.admin.statistics, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener estadísticas' };
    }
  }
};

export default adminService;