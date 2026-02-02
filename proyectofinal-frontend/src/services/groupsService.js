import apiClient from './apiClient';
import api from '../config/api';

// Usar endpoints configurados
const base = api.endpoints.grupos.list;

const groupsService = {
  listar: async () => {
    const res = await apiClient.get(base);
    return res.data;
  },

  listarPublicos: async () => {
    const res = await apiClient.get(`${base}/publicos`);
    return res.data?.data || res.data || [];
  },

  obtener: async (id) => {
    const res = await apiClient.get(`${base}/${id}`);
    return res.data;
  },

  crear: async (payload) => {
    const res = await apiClient.post(base, payload);
    return res.data;
  },

  actualizar: async (id, payload) => {
    const res = await apiClient.put(`${base}/${id}`, payload);
    return res.data;
  },

  eliminar: async (id) => {
    const res = await apiClient.delete(`${base}/${id}`);
    return res.data;
  },

  unirse: async (grupoId, codigoAcceso = null) => {
    const payload = codigoAcceso ? { codigo_acceso: codigoAcceso } : {};
    const res = await apiClient.post(`${base}/${grupoId}/unirse`, payload);
    return res.data;
  },

  // Miembros
  listarMiembros: async (grupoId) => {
    const res = await apiClient.get(`${base}/${grupoId}/miembros`);
    // El backend devuelve { success: true, data: [...] }
    return res.data?.data || res.data || [];
  },

  /**
   * Invitar un usuario al grupo (ahora envía invitación en lugar de agregar directamente)
   * @param {number} grupoId - ID del grupo
   * @param {Object} payload - { usuario_id, correo, mensaje, rol_propuesto }
   */
  invitarMiembro: async (grupoId, payload) => {
    const res = await apiClient.post(`${base}/${grupoId}/miembros`, payload);
    return res.data;
  },

  // Alias para mantener compatibilidad con código existente
  agregarMiembro: async (grupoId, payload) => {
    const res = await apiClient.post(`${base}/${grupoId}/miembros`, payload);
    return res.data;
  },

  actualizarMiembro: async (grupoId, miembroId, payload) => {
    const res = await apiClient.put(`${base}/${grupoId}/miembros/${miembroId}`, payload);
    return res.data;
  },

  eliminarMiembro: async (grupoId, miembroId) => {
    const res = await apiClient.delete(`${base}/${grupoId}/miembros/${miembroId}`);
    return res.data;
  },

  // ============================================================
  // INVITACIONES
  // ============================================================

  /**
   * Obtener invitaciones pendientes del usuario actual
   */
  obtenerMisInvitaciones: async () => {
    const res = await apiClient.get(`${base}/invitaciones`);
    // El backend devuelve { success: true, data: [...] }
    return res.data?.data || res.data || [];
  },

  /**
   * Obtener historial de invitaciones del usuario
   * @param {number} limit - Límite de resultados
   */
  obtenerHistorialInvitaciones: async (limit = 50) => {
    const res = await apiClient.get(`${base}/invitaciones/historial`, { params: { limit } });
    // El backend devuelve { success: true, data: [...] }
    return res.data?.data || res.data || [];
  },

  /**
   * Obtener detalle de una invitación específica
   * @param {number} invitacionId - ID de la invitación
   */
  obtenerInvitacion: async (invitacionId) => {
    const res = await apiClient.get(`${base}/invitaciones/${invitacionId}`);
    return res.data;
  },

  /**
   * Aceptar una invitación a un grupo
   * @param {number} invitacionId - ID de la invitación
   */
  aceptarInvitacion: async (invitacionId) => {
    const res = await apiClient.post(`${base}/invitaciones/${invitacionId}/aceptar`);
    return res.data;
  },

  /**
   * Rechazar una invitación a un grupo
   * @param {number} invitacionId - ID de la invitación
   */
  rechazarInvitacion: async (invitacionId) => {
    const res = await apiClient.post(`${base}/invitaciones/${invitacionId}/rechazar`);
    return res.data;
  },

  /**
   * Cancelar una invitación enviada (solo invitador/facilitador)
   * @param {number} invitacionId - ID de la invitación
   */
  cancelarInvitacion: async (invitacionId) => {
    const res = await apiClient.delete(`${base}/invitaciones/${invitacionId}/cancelar`);
    return res.data;
  },

  /**
   * Obtener invitaciones enviadas por un grupo (solo facilitador)
   * @param {number} grupoId - ID del grupo
   * @param {string} estado - Filtrar por estado (opcional)
   */
  obtenerInvitacionesGrupo: async (grupoId, estado = null) => {
    const params = estado ? { estado } : {};
    const res = await apiClient.get(`${base}/${grupoId}/invitaciones`, { params });
    return res.data;
  },

  // Actividades
  listarActividades: async (grupoId) => {
    const res = await apiClient.get(`${base}/${grupoId}/actividades`);
    return res.data;
  },

  crearActividad: async (grupoId, payload) => {
    const res = await apiClient.post(`${base}/${grupoId}/actividades`, payload);
    return res.data;
  },

  actualizarActividad: async (grupoId, actividadId, payload) => {
    const res = await apiClient.put(`${base}/${grupoId}/actividades/${actividadId}`, payload);
    return res.data;
  },

  eliminarActividad: async (grupoId, actividadId) => {
    const res = await apiClient.delete(`${base}/${grupoId}/actividades/${actividadId}`);
    return res.data;
  },

  // Obtener una actividad individual
  obtenerActividad: async (actividadId) => {
    const res = await apiClient.get(`${base}/actividades/${actividadId}`);
    return res.data;
  },

  // Participaciones
  participarActividad: async (actividadId, payload = {}) => {
    const res = await apiClient.post(`${base}/actividades/${actividadId}/participar`, payload);
    return res.data;
  },

  completarParticipacion: async (participacionId, payload = {}) => {
    const res = await apiClient.put(`${base}/participacion/${participacionId}/completar`, payload);
    return res.data;
  },

  obtenerMiParticipacion: async (actividadId) => {
    const res = await apiClient.get(`${base}/actividades/${actividadId}/mi-participacion`);
    return res.data;
  },

  /**
   * Obtener participantes de una actividad con sus estados y resultados
   * @param {number} actividadId - ID de la actividad
   */
  obtenerParticipantesActividad: async (actividadId) => {
    const res = await apiClient.get(`${base}/actividades/${actividadId}/participantes`);
    return res.data;
  },

  /**
   * Obtener resultado grupal de una actividad
   * @param {number} actividadId - ID de la actividad
   */
  obtenerResultadoGrupal: async (actividadId) => {
    const res = await apiClient.get(`/api/actividades_grupo/${actividadId}/resultado`);
    return res.data;
  },

  /**
   * Obtener estado de una actividad grupal
   * @param {number} actividadId - ID de la actividad
   */
  obtenerEstadoActividad: async (actividadId) => {
    const res = await apiClient.get(`/api/actividades_grupo/${actividadId}/estado`);
    return res.data;
  },

  /**
   * Iniciar actividad grupal (solo facilitador)
   * @param {number} actividadId - ID de la actividad
   */
  iniciarActividad: async (actividadId) => {
    const res = await apiClient.post(`${base}/actividades/${actividadId}/iniciar`);
    return res.data;
  },
};

export default groupsService;
