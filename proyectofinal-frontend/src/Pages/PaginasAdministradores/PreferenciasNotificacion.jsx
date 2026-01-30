import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import { 
  FaBell, 
  FaCog, 
  FaSave, 
  FaToggleOn, 
  FaToggleOff,
  FaEnvelope,
  FaMobile,
  FaDesktop,
  FaExclamationTriangle,
  FaUsers,
  FaChartBar,
  FaTimes,
  FaPlus,
  FaEdit,
  FaTrash
} from "react-icons/fa";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";
import ConfirmDialog from "../../components/Shared/ConfirmDialog";

const PreferenciasNotificacion = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  
  // Estado para ConfirmDialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    confirmText: "Eliminar",
    onConfirm: () => {}
  });
  
  // Plantillas de notificación
  const [plantillas, setPlantillas] = useState([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [showPlantillaModal, setShowPlantillaModal] = useState(false);
  
  // Configuración global
  const [config, setConfig] = useState({
    notificaciones_email: true,
    notificaciones_push: true,
    notificaciones_in_app: true,
    frecuencia_resumen: "diario",
    hora_resumen: "09:00",
    alertas_criticas_inmediatas: true,
    recordatorio_inactividad: true,
    dias_inactividad: 7,
    notificar_nuevos_usuarios: true,
    notificar_alertas_resueltas: true,
    notificar_reportes_generados: true
  });
  
  // Form de plantilla
  const [plantillaForm, setPlantillaForm] = useState({
    nombre: "",
    tipo: "alerta",
    asunto: "",
    contenido: "",
    activo: true
  });

  const tiposPlantilla = [
    { value: "alerta", label: "Alerta Emocional", icon: <FaExclamationTriangle /> },
    { value: "bienvenida", label: "Bienvenida", icon: <FaUsers /> },
    { value: "recordatorio", label: "Recordatorio", icon: <FaBell /> },
    { value: "reporte", label: "Reporte", icon: <FaChartBar /> },
    { value: "grupo", label: "Grupos", icon: <FaUsers /> },
    { value: "sistema", label: "Sistema", icon: <FaCog /> }
  ];

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar plantillas
      const plantillasRes = await apiClient.get(api.endpoints.notificaciones.plantillas);
      setPlantillas(plantillasRes.data?.data || plantillasRes.data || []);
      
      // Cargar configuración
      try {
        const configRes = await apiClient.get(api.endpoints.notificaciones.configuracion);
        if (configRes.data?.data) {
          setConfig(prev => ({ ...prev, ...configRes.data.data }));
        }
      } catch {
        console.log("Config not found, using defaults");
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showMessage("Error al cargar configuración", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message, type = "success") => {
    setMsg(message);
    setMsgType(type);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await apiClient.put(api.endpoints.notificaciones.configuracion, config);
      showMessage("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      showMessage("Error al guardar configuración", "error");
    } finally {
      setSaving(false);
    }
  };

  const openCreatePlantilla = () => {
    setSelectedPlantilla(null);
    setPlantillaForm({
      nombre: "",
      tipo: "alerta",
      asunto: "",
      contenido: "",
      activo: true
    });
    setShowPlantillaModal(true);
  };

  const openEditPlantilla = (plantilla) => {
    setSelectedPlantilla(plantilla);
    setPlantillaForm({
      nombre: plantilla.nombre || "",
      tipo: plantilla.tipo || "alerta",
      asunto: plantilla.asunto || "",
      contenido: plantilla.contenido || "",
      activo: plantilla.activo !== false
    });
    setShowPlantillaModal(true);
  };

  const handleSavePlantilla = async (e) => {
    e.preventDefault();
    
    if (!plantillaForm.nombre.trim() || !plantillaForm.asunto.trim()) {
      showMessage("Nombre y asunto son requeridos", "error");
      return;
    }
    
    try {
      if (selectedPlantilla) {
        await apiClient.put(`${api.endpoints.notificaciones.plantillas}/${selectedPlantilla.id}`, plantillaForm);
        setPlantillas(prev => prev.map(p => 
          p.id === selectedPlantilla.id ? { ...p, ...plantillaForm } : p
        ));
        showMessage("Plantilla actualizada");
      } else {
        const res = await apiClient.post(api.endpoints.notificaciones.plantillas, plantillaForm);
        const nuevaPlantilla = res.data?.data || { id: Date.now(), ...plantillaForm };
        setPlantillas(prev => [...prev, nuevaPlantilla]);
        showMessage("Plantilla creada");
      }
      setShowPlantillaModal(false);
    } catch (error) {
      console.error("Error al guardar plantilla:", error);
      showMessage("Error al guardar plantilla", "error");
    }
  };

  const togglePlantillaActiva = async (plantilla) => {
    try {
      const newStatus = !plantilla.activo;
      await apiClient.patch(`${api.endpoints.notificaciones.plantillas}/${plantilla.id}`, { activo: newStatus });
      setPlantillas(prev => prev.map(p => 
        p.id === plantilla.id ? { ...p, activo: newStatus } : p
      ));
      showMessage(`Plantilla ${newStatus ? "activada" : "desactivada"}`);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      showMessage("Error al cambiar estado", "error");
    }
  };

  const deletePlantilla = async (plantilla) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Plantilla",
      message: `¿Estás seguro de eliminar la plantilla "${plantilla.nombre}"? Esta acción no se puede deshacer.`,
      type: "danger",
      confirmText: "Eliminar",
      onConfirm: async () => {
        try {
          await apiClient.delete(`${api.endpoints.notificaciones.plantillas}/${plantilla.id}`);
          setPlantillas(prev => prev.filter(p => p.id !== plantilla.id));
          showMessage("Plantilla eliminada");
        } catch (error) {
          console.error("Error al eliminar:", error);
          showMessage("Error al eliminar plantilla", "error");
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getTipoInfo = (tipo) => {
    return tiposPlantilla.find(t => t.value === tipo) || { label: tipo, icon: <FaBell /> };
  };

  return (
    <div className="admin-preferencias-notificacion-page">
      <div className="admin-page-content">
        {/* Header */}
        <div className="admin-page-header">
          <h2><FaBell /> Preferencias de Notificaciones</h2>
          <div className="admin-header-actions">
            <button onClick={handleSaveConfig} className="admin-btn admin-btn-primary" disabled={saving}>
              <FaSave /> {saving ? "Guardando..." : "Guardar Todo"}
            </button>
          </div>
        </div>

        {msg && (
          <div className={`admin-message admin-message-${msgType}`}>
            {msg}
          </div>
        )}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Cargando configuración...</p>
          </div>
        ) : (
          <>
            {/* Configuración General */}
            <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
              <div className="admin-card-header">
                <h3><FaCog /> Configuración General</h3>
              </div>
              <div className="admin-card-body">
                <div className="admin-grid-3">
                  {/* Canales de notificación */}
                  <div className="admin-config-section">
                    <h4>Canales de Notificación</h4>
                    
                    <div className="admin-toggle-item">
                      <label>
                        <FaEnvelope /> Notificaciones por Email
                      </label>
                      <button 
                        className={`admin-toggle ${config.notificaciones_email ? 'active' : ''}`}
                        onClick={() => setConfig({ ...config, notificaciones_email: !config.notificaciones_email })}
                      >
                        {config.notificaciones_email ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                    
                    <div className="admin-toggle-item">
                      <label>
                        <FaMobile /> Notificaciones Push
                      </label>
                      <button 
                        className={`admin-toggle ${config.notificaciones_push ? 'active' : ''}`}
                        onClick={() => setConfig({ ...config, notificaciones_push: !config.notificaciones_push })}
                      >
                        {config.notificaciones_push ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                    
                    <div className="admin-toggle-item">
                      <label>
                        <FaDesktop /> Notificaciones In-App
                      </label>
                      <button 
                        className={`admin-toggle ${config.notificaciones_in_app ? 'active' : ''}`}
                        onClick={() => setConfig({ ...config, notificaciones_in_app: !config.notificaciones_in_app })}
                      >
                        {config.notificaciones_in_app ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                  </div>

                  {/* Resumen y frecuencia */}
                  <div className="admin-config-section">
                    <h4>Resumen Automático</h4>
                    
                    <div className="admin-form-group">
                      <label className="admin-form-label">Frecuencia del Resumen</label>
                      <select 
                        className="admin-form-control"
                        value={config.frecuencia_resumen}
                        onChange={(e) => setConfig({ ...config, frecuencia_resumen: e.target.value })}
                      >
                        <option value="nunca">Nunca</option>
                        <option value="diario">Diario</option>
                        <option value="semanal">Semanal</option>
                        <option value="mensual">Mensual</option>
                      </select>
                    </div>
                    
                    {config.frecuencia_resumen !== 'nunca' && (
                      <div className="admin-form-group">
                        <label className="admin-form-label">Hora del Resumen</label>
                        <input 
                          type="time"
                          className="admin-form-control"
                          value={config.hora_resumen}
                          onChange={(e) => setConfig({ ...config, hora_resumen: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Alertas */}
                  <div className="admin-config-section">
                    <h4>Alertas y Eventos</h4>
                    
                    <div className="admin-toggle-item">
                      <label>
                        <FaExclamationTriangle /> Alertas críticas inmediatas
                      </label>
                      <button 
                        className={`admin-toggle ${config.alertas_criticas_inmediatas ? 'active' : ''}`}
                        onClick={() => setConfig({ ...config, alertas_criticas_inmediatas: !config.alertas_criticas_inmediatas })}
                      >
                        {config.alertas_criticas_inmediatas ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                    
                    <div className="admin-toggle-item">
                      <label>Notificar nuevos usuarios</label>
                      <button 
                        className={`admin-toggle ${config.notificar_nuevos_usuarios ? 'active' : ''}`}
                        onClick={() => setConfig({ ...config, notificar_nuevos_usuarios: !config.notificar_nuevos_usuarios })}
                      >
                        {config.notificar_nuevos_usuarios ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                    
                    <div className="admin-toggle-item">
                      <label>Notificar alertas resueltas</label>
                      <button 
                        className={`admin-toggle ${config.notificar_alertas_resueltas ? 'active' : ''}`}
                        onClick={() => setConfig({ ...config, notificar_alertas_resueltas: !config.notificar_alertas_resueltas })}
                      >
                        {config.notificar_alertas_resueltas ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recordatorio de inactividad */}
                <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--color-card-secondary, rgba(0,0,0,0.03))", borderRadius: "8px" }}>
                  <div className="admin-toggle-item" style={{ marginBottom: "1rem" }}>
                    <label><strong>Recordatorio de inactividad de usuarios</strong></label>
                    <button 
                      className={`admin-toggle ${config.recordatorio_inactividad ? 'active' : ''}`}
                      onClick={() => setConfig({ ...config, recordatorio_inactividad: !config.recordatorio_inactividad })}
                    >
                      {config.recordatorio_inactividad ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                  </div>
                  
                  {config.recordatorio_inactividad && (
                    <div className="admin-form-group" style={{ maxWidth: "200px" }}>
                      <label className="admin-form-label">Días de inactividad</label>
                      <input 
                        type="number"
                        className="admin-form-control"
                        min="1"
                        max="90"
                        value={config.dias_inactividad}
                        onChange={(e) => setConfig({ ...config, dias_inactividad: parseInt(e.target.value) || 7 })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Plantillas de Notificación */}
            <div className="admin-card">
              <div className="admin-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3><FaEnvelope /> Plantillas de Notificación</h3>
                <button onClick={openCreatePlantilla} className="admin-btn admin-btn-primary admin-btn-sm">
                  <FaPlus /> Nueva Plantilla
                </button>
              </div>
              <div className="admin-card-body">
                {plantillas.length === 0 ? (
                  <div className="admin-empty-state">
                    <FaEnvelope />
                    <h3>Sin plantillas</h3>
                    <p>No hay plantillas de notificación configuradas.</p>
                    <button onClick={openCreatePlantilla} className="admin-btn admin-btn-primary">
                      <FaPlus /> Crear primera plantilla
                    </button>
                  </div>
                ) : (
                  <div className="admin-cards-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                    {plantillas.map((plantilla) => {
                      const tipoInfo = getTipoInfo(plantilla.tipo);
                      return (
                        <div 
                          key={plantilla.id}
                          className={`admin-card ${!plantilla.activo ? 'admin-card-inactive' : ''}`}
                          style={{ borderLeft: `4px solid ${plantilla.activo ? '#4caf50' : '#9e9e9e'}` }}
                        >
                          <div className="admin-card-body">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                  <span style={{ color: "var(--color-primary)" }}>{tipoInfo.icon}</span>
                                  <h4 style={{ margin: 0 }}>{plantilla.nombre}</h4>
                                </div>
                                <span className={`admin-badge ${plantilla.activo ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
                                  {plantilla.activo ? "Activa" : "Inactiva"}
                                </span>
                                <span className="admin-badge admin-badge-info" style={{ marginLeft: "0.5rem" }}>
                                  {tipoInfo.label}
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                  className="admin-btn admin-btn-icon admin-btn-secondary"
                                  onClick={() => openEditPlantilla(plantilla)}
                                  title="Editar"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className={`admin-btn admin-btn-icon ${plantilla.activo ? 'admin-btn-success' : 'admin-btn-warning'}`}
                                  onClick={() => togglePlantillaActiva(plantilla)}
                                  title={plantilla.activo ? "Desactivar" : "Activar"}
                                >
                                  {plantilla.activo ? <FaToggleOn /> : <FaToggleOff />}
                                </button>
                                <button
                                  className="admin-btn admin-btn-icon admin-btn-danger"
                                  onClick={() => deletePlantilla(plantilla)}
                                  title="Eliminar"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                            
                            <div style={{ marginTop: "0.75rem" }}>
                              <p className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                                <strong>Asunto:</strong> {plantilla.asunto}
                              </p>
                              {plantilla.contenido && (
                                <p className="admin-text-muted" style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {plantilla.contenido.substring(0, 100)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal de Plantilla */}
        {showPlantillaModal && (
          <div className="admin-modal-overlay" onClick={() => setShowPlantillaModal(false)}>
            <div className="admin-modal" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">
                  {selectedPlantilla ? "Editar Plantilla" : "Nueva Plantilla"}
                </h3>
                <button className="admin-modal-close" onClick={() => setShowPlantillaModal(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={handleSavePlantilla}>
                <div className="admin-modal-body">
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Nombre *</label>
                      <input
                        type="text"
                        className="admin-form-control"
                        value={plantillaForm.nombre}
                        onChange={(e) => setPlantillaForm({ ...plantillaForm, nombre: e.target.value })}
                        placeholder="Ej: Alerta crítica detectada"
                        required
                      />
                    </div>
                    
                    <div className="admin-form-group">
                      <label className="admin-form-label">Tipo</label>
                      <select
                        className="admin-form-control"
                        value={plantillaForm.tipo}
                        onChange={(e) => setPlantillaForm({ ...plantillaForm, tipo: e.target.value })}
                      >
                        {tiposPlantilla.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="admin-form-group">
                    <label className="admin-form-label">Asunto del Email *</label>
                    <input
                      type="text"
                      className="admin-form-control"
                      value={plantillaForm.asunto}
                      onChange={(e) => setPlantillaForm({ ...plantillaForm, asunto: e.target.value })}
                      placeholder="Ej: ⚠️ Alerta emocional detectada en {{usuario}}"
                      required
                    />
                    <small className="admin-text-muted">Puedes usar variables: {"{{usuario}}"}, {"{{fecha}}"}, {"{{tipo}}"}</small>
                  </div>
                  
                  <div className="admin-form-group">
                    <label className="admin-form-label">Contenido</label>
                    <textarea
                      className="admin-form-control"
                      rows="6"
                      value={plantillaForm.contenido}
                      onChange={(e) => setPlantillaForm({ ...plantillaForm, contenido: e.target.value })}
                      placeholder="Contenido de la notificación..."
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="checkbox"
                        checked={plantillaForm.activo}
                        onChange={(e) => setPlantillaForm({ ...plantillaForm, activo: e.target.checked })}
                      />
                      Plantilla activa
                    </label>
                  </div>
                </div>
                
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowPlantillaModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    <FaSave /> {selectedPlantilla ? "Guardar Cambios" : "Crear Plantilla"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Diálogo de confirmación */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          confirmText={confirmDialog.confirmText}
        />
      </div>
    </div>
  );
};

export default PreferenciasNotificacion;
