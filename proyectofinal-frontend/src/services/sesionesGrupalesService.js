import apiClient from './apiClient';

// Nota: apiClient.baseURL ya incluye '/api', así que no lo necesitamos aquí
const BASE_URL = '/sesiones-grupales';

const sesionesGrupalesService = {
  /**
   * Obtener todas las sesiones de un grupo
   */
  obtenerSesionesGrupo: async (grupoId, estado = null) => {
    const params = estado ? `?estado=${estado}` : '';
    const res = await apiClient.get(`${BASE_URL}/grupo/${grupoId}${params}`);
    return res.data?.data || res.data || [];
  },

  /**
   * Obtener sesión activa del grupo
   */
  obtenerSesionActiva: async (grupoId) => {
    const res = await apiClient.get(`${BASE_URL}/grupo/${grupoId}/activa`);
    return res.data;
  },

  /**
   * Iniciar nueva sesión grupal de análisis de voz
   */
  iniciarSesion: async (grupoId, datos) => {
    const res = await apiClient.post(`${BASE_URL}/grupo/${grupoId}/iniciar`, datos);
    return res.data;
  },

  /**
   * Obtener detalle de una sesión
   */
  obtenerDetalle: async (sesionId) => {
    const res = await apiClient.get(`${BASE_URL}/${sesionId}`);
    return res.data;
  },

  /**
   * Registrar participación con audio y análisis
   */
  registrarParticipacion: async (sesionId, datos) => {
    const res = await apiClient.post(`${BASE_URL}/${sesionId}/participar`, datos);
    return res.data;
  },

  /**
   * Obtener mi participación en una sesión
   */
  obtenerMiParticipacion: async (sesionId) => {
    const res = await apiClient.get(`${BASE_URL}/${sesionId}/mi-participacion`);
    return res.data;
  },

  /**
   * Obtener resultados grupales de una sesión
   */
  obtenerResultadosGrupales: async (sesionId) => {
    const res = await apiClient.get(`${BASE_URL}/${sesionId}/resultado`);
    return res.data;
  },

  /**
   * Obtener el estado actual de la sesión
   */
  obtenerEstadoSesion: async (sesionId) => {
    const res = await apiClient.get(`${BASE_URL}/${sesionId}`);
    return res.data;
  },

  /**
   * Completar/finalizar una sesión (solo facilitadores)
   */
  completarSesion: async (sesionId) => {
    const res = await apiClient.put(`${BASE_URL}/${sesionId}/completar`);
    return res.data;
  },

  /**
   * Cancelar una sesión (solo facilitadores)
   */
  cancelarSesion: async (sesionId, motivo = null) => {
    const res = await apiClient.put(`${BASE_URL}/${sesionId}/cancelar`, { motivo });
    return res.data;
  },

  /**
   * Subir audio para participación en sesión grupal
   */
  subirAudioParticipacion: async (sesionId, audioBlob, duracion, onProgress = null) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');
    formData.append('duracion', duracion || 0);
    formData.append('id_sesion', sesionId);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      };
    }

    const res = await apiClient.post(`${BASE_URL}/${sesionId}/subir-audio`, formData, config);
    return res.data;
  },

  /**
   * Listar participantes de una sesión
   */
  listarParticipantes: async (sesionId) => {
    const res = await apiClient.get(`${BASE_URL}/${sesionId}/participantes`);
    return res.data?.data || res.data || [];
  }
};

export default sesionesGrupalesService;
