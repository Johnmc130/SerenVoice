import React, { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../../context/themeContextDef";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import { FaBell, FaEdit, FaPlus, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";

const Notificaciones = () => {
  useContext(ThemeContext);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tipo_notificacion: "sistema",
    titulo_plantilla: "",
    mensaje_plantilla: "",
    icono_defecto: "🔔",
    prioridad_defecto: "media",
    activa: true
  });

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      const res = await apiClient.get(api.endpoints.notificaciones.plantillas);
      setPlantillas(res.data?.data || []);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      setMsg("Error al cargar plantillas de notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plantilla) => {
    setEditingTemplate(plantilla);
    setFormData({
      tipo_notificacion: plantilla.tipo_notificacion,
      titulo_plantilla: plantilla.titulo_plantilla,
      mensaje_plantilla: plantilla.mensaje_plantilla,
      icono_defecto: plantilla.icono_defecto || "🔔",
      prioridad_defecto: plantilla.prioridad_defecto,
      activa: plantilla.activa
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      tipo_notificacion: "sistema",
      titulo_plantilla: "",
      mensaje_plantilla: "",
      icono_defecto: "🔔",
      prioridad_defecto: "media",
      activa: true
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await apiClient.put(`${api.endpoints.notificaciones.plantillas}/${editingTemplate.id_plantilla}`, formData);
        setMsg("Plantilla actualizada correctamente");
      } else {
        await apiClient.post(api.endpoints.notificaciones.plantillas, formData);
        setMsg("Plantilla creada correctamente");
      }
      setShowModal(false);
      cargarPlantillas();
    } catch (error) {
      console.error("Error al guardar plantilla:", error);
      setMsg("Error al guardar plantilla");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    try {
      await apiClient.delete(`${api.endpoints.notificaciones.plantillas}/${id}`);
      setMsg("Plantilla eliminada correctamente");
      cargarPlantillas();
    } catch (error) {
      console.error("Error al eliminar plantilla:", error);
      setMsg("Error al eliminar plantilla");
    }
  };

  const toggleEstado = async (id, activa) => {
    try {
      await apiClient.patch(`${api.endpoints.notificaciones.plantillas}/${id}/estado`, { activa: !activa });
      setMsg(`Plantilla ${!activa ? 'activada' : 'desactivada'} correctamente`);
      cargarPlantillas();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      setMsg("Error al cambiar estado de la plantilla");
    }
  };

  const getPriorityColor = (prioridad) => {
    switch (prioridad) {
      case 'urgente': return '#ff6b6b';
      case 'alta': return '#ff9800';
      case 'media': return '#ffc107';
      case 'baja': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className="page-content">
        {/* Header */}
        <div className="admin-page-header">
          <h2><FaBell /> Gestión de Notificaciones</h2>
          <div className="admin-header-actions">
            <button onClick={handleCreate} className="admin-btn admin-btn-primary">
              <FaPlus /> <span className="admin-hidden-mobile">Nueva Plantilla</span>
            </button>
          </div>
        </div>

        <p className="admin-text-muted admin-mb-2">
          Total de plantillas: {plantillas.length}
        </p>

        {msg && <div className="admin-message admin-message-success">{msg}</div>}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Cargando plantillas...</p>
          </div>
        ) : plantillas.length === 0 ? (
          <div className="admin-empty-state">
            <FaBell />
            <h3>Sin plantillas</h3>
            <p>No hay plantillas de notificaciones configuradas.</p>
          </div>
        ) : (
          <div className="admin-cards-grid">
            {plantillas.map((plantilla) => (
              <div
                key={plantilla.id_plantilla}
                className="admin-card"
                style={{
                  borderLeft: `4px solid ${getPriorityColor(plantilla.prioridad_defecto)}`,
                  opacity: plantilla.activa ? 1 : 0.7
                }}
              >
                <div className="admin-card-header">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "1.25rem" }}>{plantilla.icono_defecto}</span>
                      <h4 className="admin-card-title">{plantilla.titulo_plantilla}</h4>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span className={`admin-badge ${plantilla.prioridad_defecto === 'urgente' ? 'admin-badge-danger' : plantilla.prioridad_defecto === 'alta' ? 'admin-badge-warning' : 'admin-badge-info'}`}>
                        {plantilla.prioridad_defecto}
                      </span>
                      {!plantilla.activa && (
                        <span className="admin-badge admin-badge-danger">INACTIVA</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-card-body">
                  <p className="admin-text-muted" style={{ fontSize: "0.9rem" }}>{plantilla.mensaje_plantilla}</p>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <span><strong>Tipo:</strong> {plantilla.tipo_notificacion}</span>
                    {plantilla.fecha_modificacion && (
                      <span><strong>Modificado:</strong> {new Date(plantilla.fecha_modificacion).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="admin-card-footer">
                  <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => handleEdit(plantilla)}>
                    <FaEdit /> Editar
                  </button>
                  <button 
                    className={`admin-btn admin-btn-sm ${plantilla.activa ? 'admin-btn-warning' : 'admin-btn-success'}`}
                    onClick={() => toggleEstado(plantilla.id_plantilla, plantilla.activa)}
                  >
                    {plantilla.activa ? 'Desactivar' : 'Activar'}
                  </button>
                  <button 
                    className="admin-btn admin-btn-danger admin-btn-sm admin-btn-icon"
                    onClick={() => handleDelete(plantilla.id_plantilla)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de edición/creación */}
        {showModal && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">{editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}</h3>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={handleSave}>
                <div className="admin-modal-body">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Tipo de Notificación</label>
                    <select
                      className="admin-form-select"
                      value={formData.tipo_notificacion}
                      onChange={(e) => setFormData({ ...formData, tipo_notificacion: e.target.value })}
                      required
                    >
                      <option value="sistema">Sistema</option>
                      <option value="invitacion_grupo">Invitación a Grupo</option>
                      <option value="actividad_grupo">Actividad de Grupo</option>
                      <option value="recordatorio_actividad">Recordatorio de Actividad</option>
                      <option value="recomendacion">Recomendación</option>
                      <option value="alerta_critica">Alerta Crítica</option>
                      <option value="mensaje_facilitador">Mensaje del Facilitador</option>
                      <option value="logro_desbloqueado">Logro Desbloqueado</option>
                      <option value="recordatorio_analisis">Recordatorio de Análisis</option>
                      <option value="actualizacion_grupo">Actualización de Grupo</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Título de la Plantilla</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={formData.titulo_plantilla}
                      onChange={(e) => setFormData({ ...formData, titulo_plantilla: e.target.value })}
                      placeholder="Ej: Nueva invitación a grupo"
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Mensaje de la Plantilla</label>
                    <textarea
                      className="admin-form-textarea"
                      value={formData.mensaje_plantilla}
                      onChange={(e) => setFormData({ ...formData, mensaje_plantilla: e.target.value })}
                      placeholder="Ej: Has sido invitado al grupo {nombre_grupo}"
                      rows="4"
                      required
                    />
                    <small className="admin-text-muted">
                      Usa variables entre llaves, ej: {'{nombre_grupo}, {nombre_usuario}'}
                    </small>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Icono por Defecto</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        value={formData.icono_defecto}
                        onChange={(e) => setFormData({ ...formData, icono_defecto: e.target.value })}
                        placeholder="🔔"
                        maxLength="10"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Prioridad por Defecto</label>
                      <select
                        className="admin-form-select"
                        value={formData.prioridad_defecto}
                        onChange={(e) => setFormData({ ...formData, prioridad_defecto: e.target.value })}
                        required
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.activa}
                        onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                      />
                      Plantilla Activa
                    </label>
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>
                    <FaTimes /> Cancelar
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    <FaSave /> Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

export default Notificaciones;
