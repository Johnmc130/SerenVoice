// proyectofinal-frontend/src/services/notificacionesService.js
import apiClient from './apiClient';
import api from '../config/api';

class NotificacionesService {
  async getNotificaciones(limit = 50, onlyUnread = false) {
    const res = await apiClient.get(api.endpoints.notificaciones.base, {
      params: { limit, only_unread: onlyUnread },
    });
    return res.data;
  }

  async getUnreadCount() {
    const res = await apiClient.get(`${api.endpoints.notificaciones.base}/count`);
    return res.data?.data?.count || 0;
  }

  async markAsRead(idNotificacion) {
    const res = await apiClient.put(`${api.endpoints.notificaciones.base}/${idNotificacion}/read`);
    return res.data;
  }

  async markAllAsRead() {
    const res = await apiClient.put(`${api.endpoints.notificaciones.base}/read-all`);
    return res.data;
  }

  async archiveNotificacion(idNotificacion) {
    const res = await apiClient.put(`${api.endpoints.notificaciones.base}/${idNotificacion}/archive`);
    return res.data;
  }

  async deleteNotificacion(idNotificacion) {
    const res = await apiClient.delete(`${api.endpoints.notificaciones.base}/${idNotificacion}`);
    return res.data;
  }

  async getUrgentNotifications() {
    const res = await apiClient.get(`${api.endpoints.notificaciones.base}/urgent`);
    return res.data;
  }

  async getPreferences() {
    const res = await apiClient.get(`${api.endpoints.notificaciones.base}/preferences`);
    return res.data;
  }

  async updatePreferences(preferences) {
    const res = await apiClient.put(`${api.endpoints.notificaciones.base}/preferences`, preferences);
    return res.data;
  }

  async pauseNotifications(horas = null) {
    const res = await apiClient.post(`${api.endpoints.notificaciones.base}/pause`, { horas });
    return res.data;
  }

  async resumeNotifications() {
    const res = await apiClient.post(`${api.endpoints.notificaciones.base}/resume`);
    return res.data;
  }
}

export default new NotificacionesService();
