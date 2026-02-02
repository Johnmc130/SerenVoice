// src/services/reportesService.js
import apiClient from "./apiClient";
import api from "../config/api";

const reportesService = {
  // Generar nuevo reporte
  async generateReport(fecha_inicio, fecha_fin, formato = 'pdf') {
    try {
      const response = await apiClient.post(api.endpoints.reportes.generate, {
        fecha_inicio,
        fecha_fin,
        formato
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al generar reporte'
      );
    }
  },

  // Obtener reportes del usuario actual
  async getMyReports() {
    try {
      const response = await apiClient.get(api.endpoints.reportes.myReports);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener reportes'
      );
    }
  },

  // Obtener detalles de un reporte
  async getReportById(id_reporte) {
    try {
      const response = await apiClient.get(api.endpoints.reportes.byId(id_reporte));
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener reporte'
      );
    }
  }
};

export default reportesService;

// Compatibilidad con nombres usados en la app móvil / componentes en español
reportesService.obtenerReporteCompleto = async () => {
  try {
    const response = await apiClient.get('/reportes/mi-reporte-completo');
    // mobile API shape: { success: true, data: { ... } }
    if (response.data && response.data.success) return response.data.data;
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Error al obtener reporte completo');
  }
};

// Descargar reporte como PDF
reportesService.descargarPDF = async () => {
  try {
    const response = await apiClient.get('/reportes/mi-reporte-completo/pdf', {
      responseType: 'blob'
    });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Error al descargar PDF');
  }
};

reportesService.generarReporte = reportesService.generateReport;
reportesService.misReportes = reportesService.getMyReports;
reportesService.obtenerReportePorId = reportesService.getReportById;

// --- ADMIN / REPORTES HELPERS (moved from src/utils/api.js)
export const fetchReporteGeneral = async (filtros = {}) => {
  const response = await apiClient.get(api.endpoints.admin.reportes.resumenGeneral, { params: filtros });
  return response.data;
};

export const fetchTendencias = async (filtros = {}) => {
  const response = await apiClient.get(api.endpoints.admin.reportes.tendencias, { params: filtros });
  return response.data;
};

export const fetchDistribucionEmociones = async (filtros = {}) => {
  const response = await apiClient.get(api.endpoints.admin.reportes.distribucionEmociones, { params: filtros });
  return response.data;
};

export const fetchClasificaciones = async (filtros = {}) => {
  const response = await apiClient.get(api.endpoints.admin.reportes.clasificaciones, { params: filtros });
  return response.data;
};

export const fetchGruposActividad = async (filtros = {}) => {
  const response = await apiClient.get(api.endpoints.admin.reportes.gruposActividad, { params: filtros });
  return response.data;
};

export const fetchEfectividadRecomendaciones = async (filtros = {}) => {
  const response = await apiClient.get(api.endpoints.admin.reportes.efectividadRecomendaciones, { params: filtros });
  return response.data;
};

export const fetchAlertasCriticas = async (filtros = {}) => {
  const response = await apiClient.get(api.endpoints.admin.reportes.alertasCriticas, { params: filtros });
  return response.data;
};

export const fetchUsuariosEstadisticas = async (filtros = {}) => {
  const response = await apiClient.get(api.endpoints.admin.reportes.usuariosEstadisticas, { params: filtros });
  return response.data;
};

export const exportarReporteAdmin = async ({ tipo, formato, filtros }) => {
  const response = await apiClient.post(
    api.endpoints.admin.reportes.exportar,
    { tipo, formato, filtros },
    { responseType: 'blob' }
  );
  return response.data;
};

// adjuntar al export por defecto para conveniencia
reportesService.fetchReporteGeneral = fetchReporteGeneral;
reportesService.fetchTendencias = fetchTendencias;
reportesService.fetchDistribucionEmociones = fetchDistribucionEmociones;
reportesService.fetchClasificaciones = fetchClasificaciones;
reportesService.fetchGruposActividad = fetchGruposActividad;
reportesService.fetchEfectividadRecomendaciones = fetchEfectividadRecomendaciones;
reportesService.fetchAlertasCriticas = fetchAlertasCriticas;
reportesService.fetchUsuariosEstadisticas = fetchUsuariosEstadisticas;
reportesService.exportarReporte = exportarReporteAdmin;