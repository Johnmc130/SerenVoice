// src/config/api.js
// En desarrollo, usar rutas relativas para que el proxy de Vite maneje las peticiones
// En producción con Nginx proxy, también usar rutas relativas

const isDevelopment = import.meta.env.DEV;
const RAW_API_URL = import.meta.env.VITE_API_URL || "";
const normalize = (u) => u.replace(/\/+$/, "");

// Usar rutas relativas (/api) cuando no hay VITE_API_URL definida
// Nginx actúa como proxy reverso en producción
const API_BASE = RAW_API_URL ? `${normalize(RAW_API_URL)}/api` : "/api";

// ID de Cliente de Google OAuth
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// NOTA: No loguear el client ID en producción por seguridad

const api = {
  baseURL: API_BASE,
  endpoints: {
    auth: {
      base: "/auth",
      login: "/auth/login",
      register: "/auth/register",
      logout: "/auth/logout",
      google: "/auth/google",
      forgotPassword: "/auth/forgot-password",
      resetPassword: "/auth/reset-password",
      verifyEmail: "/auth/verify-email",
      resendVerification: "/auth/resend-verification",
      proxyImage: "/auth/proxy_image",
    },
    usuarios: {
      list: "/usuarios",
      detail: (id) => `/usuarios/${id}`,
      search: "/usuarios/search",
      create: "/usuarios",
      update: (id) => `/usuarios/${id}`,
      delete: (id) => `/usuarios/${id}`,
      statistics: "/usuarios/statistics",
    },
    // alias en inglés para código existente que referencia api.endpoints.users
    users: {
      list: "/usuarios",
      me: "/usuarios/me",
      byId: (id) => `/usuarios/${id}`,
      create: "/usuarios",
      update: (id) => `/usuarios/${id}`,
      delete: (id) => `/usuarios/${id}`,
    },
    contacto: "/contact/send",
    admin: {
      usuarios: {
        list: "/admin/usuarios",
        detail: (id) => `/admin/usuarios/${id}`,
      },
      reportes: {
        resumenGeneral: "/admin/reportes/resumen-general",
        tendencias: "/admin/reportes/tendencias-emocionales",
        distribucionEmociones: "/admin/reportes/distribucion-emociones",
        clasificaciones: "/admin/reportes/clasificaciones",
        gruposActividad: "/admin/reportes/grupos-actividad",
        efectividadRecomendaciones: "/admin/reportes/efectividad-recomendaciones",
        alertasCriticas: "/admin/reportes/alertas-criticas",
        usuariosEstadisticas: "/admin/reportes/usuarios-estadisticas",
        exportar: "/admin/reportes/exportar",
      },
    },
    reportes: {
      generate: "/reportes/generate",
      myReports: "/reportes/my-reports",
      byId: (id) => `/reportes/${id}`,
    },
    juegos: {
      list: "/juegos",
      recomendados: "/juegos/recomendados",
      iniciar: "/juegos/iniciar",
      finalizar: "/juegos/finalizar",
      estadisticas: "/juegos/estadisticas",
      historial: "/juegos/historial",
    },
    alertas: {
      list: "/alertas",
      myAlerts: "/alertas/my-alerts",
      active: "/alertas/active",
      byId: (id) => `/alertas/${id}`,
      historial: (id) => `/alertas/${id}/historial`,
      asignar: (id) => `/alertas/${id}/asignar`,
      resolver: (id) => `/alertas/${id}/resolver`,
      criticas: "/alertas/criticas",
    },
    analisis: {
      get: (id) => `/analisis/${id}`,
      audio: (id) => `/analisis/${id}/audio`,
      history: "/analisis/history",
      today: "/analisis/hoy",
    },
    grupos: {
      list: "/grupos",
      estadisticas: "/grupos/estadisticas",
      detail: (id) => `/grupos/${id}`,
      miembros: (id) => `/grupos/${id}/miembros`,
      actualizarMiembro: (idGrupo, idUsuario) => `/grupos/${idGrupo}/miembros/${idUsuario}`,
      eliminarMiembro: (idGrupo, idUsuario) => `/grupos/${idGrupo}/miembros/${idUsuario}`,
      actividades: (id) => `/grupos/${id}/actividades`,
      eliminarActividad: (idActividad) => `/grupos/actividades/${idActividad}`,
      estado: (id) => `/grupos/${id}/estado`,
      estadisticasDetalladas: (id) => `/grupos/${id}/estadisticas-detalladas`,
    },
    audio: {
      analyze: "/audio/analyze",
      health: "/audio/health",
      trainingStats: "/audio/training-stats",
      retrain: "/audio/retrain",
    },
    notificaciones: {
      base: "/notificaciones",
      plantillas: "/notificaciones/plantillas",
      configuracion: "/notificaciones/configuracion",
    },
    sesiones: {
      mySessions: "/sesiones/my-sessions",
      active: "/sesiones/active",
      close: (id) => `/sesiones/${id}/close`,
      closeAll: "/sesiones/close-all",
    },
    resultados: {
      byId: (id) => `/resultados/${id}`,
    },
    recomendaciones: {
      list: "/recomendaciones",
      byResultado: (id) => `/recomendaciones/resultado/${id}`,
      byId: (id) => `/recomendaciones/${id}`,
      todas: "/recomendaciones/todas",
      estadisticas: "/recomendaciones/estadisticas",
      marcarAplicada: (id) => `/recomendaciones/${id}/aplicar`,
      marcarUtil: (id) => `/recomendaciones/${id}/util`,
    },
    sesionesJuego: {
      todas: "/sesiones-juego/todas",
      estadisticas: "/sesiones-juego/estadisticas",
    },
    auditoria: {
      sesiones: "/auditoria/sesiones",
      cambiosRoles: "/auditoria/cambios-roles",
      actividadSospechosa: "/auditoria/actividad-sospechosa",
    },
  },
};

export default api;
