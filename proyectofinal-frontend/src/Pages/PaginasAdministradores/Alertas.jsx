import React, { useRef, useState, useEffect, useContext } from "react";
import { FaBell, FaCheck, FaExclamationTriangle, FaUser, FaFilter, FaDownload, FaCheckCircle, FaTimes } from "react-icons/fa";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";
import PageCard from "../../components/Shared/PageCard";
import { useAlertas } from "../../context/AlertasContext";
import { ThemeContext } from "../../context/themeContextDef";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import alertasService from "../../services/alertasService";

const Alertas = () => {
  useContext(ThemeContext);
  const { alerts: contextAlerts, assignToMe, resolveAlerta } = useAlertas();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ tipo: "todas", severidad: "todas", estado: "activas" });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [historial, setHistorial] = useState([]);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const els = cardRef.current.querySelectorAll(".reveal");
    els.forEach((el) => el.classList.add("reveal-visible"));
  }, []);

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        // backend expone /api/alertas/active para alertas activas (admin)
        const res = await apiClient.get(api.endpoints.alertas.active);
        setAlerts(res.data?.data || []);
        setFilteredAlerts(res.data?.data || []);
      } catch (error) {
        console.error("Error al cargar alertas:", error);
        // fallback al contexto local si la API falla
        setAlerts(contextAlerts);
        setFilteredAlerts(contextAlerts);
      } finally {
        setLoading(false);
      }
    };
    fetchAlertas();
  }, [contextAlerts]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...alerts];

    if (filter.tipo !== "todas") {
      filtered = filtered.filter(a => a.tipo_alerta === filter.tipo);
    }

    if (filter.severidad !== "todas") {
      // la severidad viene como "tipo_recomendacion" desde el backend
      filtered = filtered.filter(a => (a.tipo_recomendacion || a.severidad || a.tipo_alerta) === filter.severidad);
    }

    if (filter.estado === "activas") {
      filtered = filtered.filter(a => a.activo && !a.fecha_revision);
    } else if (filter.estado === "resueltas") {
      filtered = filtered.filter(a => a.fecha_revision);
    }

    setFilteredAlerts(filtered);
  }, [filter, alerts]);

  const handleAssign = async (id) => {
    // open assign modal and load admins
    try {
      setSelectedAlert(alerts.find(a => (a.id_alerta || a.id) === id) || null);
      setShowAssignModal(true);
      // obtener admins (usar endpoint de usuarios admin que retorna solo admins)
      const res = await apiClient.get(api.endpoints.admin.usuarios.list);
      // el backend puede retornar { success: true, usuarios: [...] } o { success: true, data: [...] }
      const adminsList = res.data?.usuarios || res.data?.data || res.data || [];
      setAdmins(adminsList);
      setSelectedAdmin(null);
    } catch (error) {
      console.error('Error cargando administradores:', error);
      setMsg('Error cargando administradores');
    }
  };

  const handleResolve = async (id) => {
    // open resolve modal
    setSelectedAlert(alerts.find(a => (a.id_alerta || a.id) === id) || null);
    setResolveNotes("");
    setShowResolveModal(true);
  };

  const viewAlertDetail = async (alerta) => {
    setSelectedAlert(alerta);
    setShowModal(true);
    try {
      const id = alerta.id_alerta || alerta.id;
      const res = await apiClient.get(api.endpoints.alertas.historial(id));
      setHistorial(res.data?.data || []);
    } catch (err) {
      console.error('Error cargando historial:', err);
      setHistorial([]);
    }
  };

  const confirmAssign = async () => {
    if (!selectedAlert) return;
    if (!selectedAdmin) {
      setMsg('Selecciona un administrador antes de confirmar');
      return;
    }
    const id = selectedAlert.id_alerta || selectedAlert.id;
    try {
      const payload = { id_usuario_asignado: Number(selectedAdmin) };
      await alertasService.asignarAlert(id, payload);
      assignToMe(id);
      setAlerts(prev => prev.map(a => (a.id_alerta === id || a.id === id) ? { ...a, id_usuario_asignado: selectedAdmin } : a));
      setMsg('Alerta asignada correctamente');
      setShowAssignModal(false);
    } catch (err) {
      console.error('Error asignando alerta:', err);
      setMsg('Error al asignar alerta');
    }
  };

  const confirmResolve = async () => {
    if (!selectedAlert) return;
    const id = selectedAlert.id_alerta || selectedAlert.id;
    try {
      const payload = { notas: resolveNotes };
      await alertasService.resolverAlert(id, payload);
      resolveAlerta(id);
      setAlerts(prev => prev.map(a => (a.id_alerta === id || a.id === id) ? { ...a, fecha_revision: new Date().toISOString(), fecha_resolucion: new Date().toISOString() } : a));
      setMsg('Alerta resuelta correctamente');
      setShowResolveModal(false);
    } catch (err) {
      console.error('Error resolviendo alerta:', err);
      setMsg('Error al resolver alerta');
    }
  };

  const getSeverityColor = (tipo) => {
    switch (tipo) {
      case 'critica': return '#ff6b6b';
      case 'alta': return '#ff9800';
      case 'media': return '#ffc107';
      case 'baja': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const exportAlertas = () => {
    const csv = [
      ["ID", "Usuario", "Tipo", "Severidad", "Título", "Descripción", "Fecha", "Estado"].join(","),
      ...filteredAlerts.map(a =>
        [
          a.id_alerta || a.id,
          `${a.nombre} ${a.apellido}`,
          a.tipo_alerta,
          a.tipo_recomendacion || "N/A",
          a.titulo,
          a.descripcion?.replace(/,/g, ";") || "",
          a.fecha || a.fecha_creacion,
          a.fecha_revision ? "Resuelta" : "Activa"
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alertas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setMsg("Alertas exportadas correctamente");
  };

  return (
    <div className="admin-alertas-page">
      <div className="admin-page-content">
        {/* Card con título y filtros */}
        <PageCard size="xl">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", margin: 0 }}>
              <FaBell style={{ color: "#ff6b6b" }} /> Gestión de Alertas Críticas
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: "0.5rem 0 0 0" }}>
              Monitorea y gestiona las alertas del sistema
            </p>
          </div>

          {/* Filtros horizontales */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', alignItems: 'flex-end', marginBottom: '1rem', overflowX: 'auto' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <div className="input-labels">
              <label><FaFilter /> Tipo de Alerta</label>
            </div>
            <div className="input-group no-icon">
              <select value={filter.tipo} onChange={(e) => setFilter({ ...filter, tipo: e.target.value })}>
                <option value="todas">Todas</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <div className="input-labels">
              <label><FaFilter /> Severidad</label>
            </div>
            <div className="input-group no-icon">
              <select value={filter.severidad} onChange={(e) => setFilter({ ...filter, severidad: e.target.value })}>
                <option value="todas">Todas</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <div className="input-labels">
              <label><FaCheckCircle /> Estado</label>
            </div>
            <div className="input-group no-icon">
              <select value={filter.estado} onChange={(e) => setFilter({ ...filter, estado: e.target.value })}>
                <option value="activas">Activas</option>
                <option value="resueltas">Resueltas</option>
                <option value="todas">Todas</option>
              </select>
            </div>
          </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={exportAlertas} className="admin-btn admin-btn-secondary">
              <FaDownload /> Exportar
            </button>
          </div>
        </PageCard>

        <p className="admin-text-muted admin-mb-2">
          Mostrando {filteredAlerts.length} de {alerts.length} alertas
        </p>

        {msg && <div className="admin-message admin-message-success">{msg}</div>}

          {loading ? (
            <div className="admin-loading">
              <div className="admin-loading-spinner"></div>
              <p>Cargando alertas...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="admin-empty-state">
              <FaCheck />
              <h3>Sin alertas pendientes</h3>
              <p>No hay alertas que coincidan con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="admin-cards-grid">
              {filteredAlerts.map((a) => (
                <div
                  key={a.id_alerta || a.id}
                  className="admin-card"
                  style={{
                    borderLeft: `4px solid ${getSeverityColor(a.tipo_alerta)}`,
                    opacity: a.fecha_revision ? 0.7 : 1,
                  }}
                >
                  <div className="admin-card-header">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <FaExclamationTriangle style={{ color: getSeverityColor(a.tipo_alerta) }} />
                        <h4 className="admin-card-title">{a.titulo}</h4>
                      </div>
                      <span className={`admin-badge ${a.tipo_alerta === 'critica' ? 'admin-badge-danger' : a.tipo_alerta === 'alta' ? 'admin-badge-warning' : 'admin-badge-info'}`}>
                        {a.tipo_alerta?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="admin-card-body">
                    <p className="admin-text-muted" style={{ fontSize: "0.9rem" }}>{a.descripcion}</p>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.85rem" }}>
                      <span><FaUser /> {a.nombre} {a.apellido}</span>
                      <span><strong>Fecha:</strong> {new Date(a.fecha || a.fecha_creacion).toLocaleDateString()}</span>
                    </div>

                    {a.contexto && (
                      <p style={{ fontSize: "0.85rem", fontStyle: "italic" }} className="admin-text-muted">
                        Contexto: {a.contexto}
                      </p>
                    )}

                    {a.fecha_revision && (
                      <div className="admin-badge admin-badge-success">
                        ✓ Resuelta el {new Date(a.fecha_revision).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="admin-card-footer">
                    <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => viewAlertDetail(a)}>
                      Ver Detalles
                    </button>
                    {!a.fecha_revision && (
                      <>
                        <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => handleAssign(a.id_alerta || a.id)}>
                          Asignar
                        </button>
                        <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => handleResolve(a.id_alerta || a.id)}>
                          <FaCheck /> Resolver
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}


        {/* Modal Asignar administrador */}
        {showAssignModal && selectedAlert && (
          <div className="admin-modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Asignar Alerta</h3>
                <button className="admin-modal-close" onClick={() => setShowAssignModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="admin-modal-body">
                <p>Alerta: <strong>{selectedAlert.titulo}</strong></p>
                <div className="admin-form-group">
                  <label className="admin-form-label">Seleccionar administrador</label>
                  <select 
                    className="admin-form-select"
                    value={selectedAdmin || ""} 
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                  >
                    <option value="">-- Seleccionar --</option>
                    {admins.map(u => (
                      <option key={u.id_usuario || u.id} value={u.id_usuario || u.id}>
                        {u.nombre} {u.apellido} {u.correo ? `(${u.correo})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancelar
                </button>
                <button 
                  className="admin-btn admin-btn-primary" 
                  onClick={confirmAssign} 
                  disabled={!selectedAdmin}
                  style={{ opacity: !selectedAdmin ? 0.6 : 1 }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Resolver alerta con notas */}
        {showResolveModal && selectedAlert && (
          <div className="admin-modal-overlay" onClick={() => setShowResolveModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Resolver Alerta</h3>
                <button className="admin-modal-close" onClick={() => setShowResolveModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="admin-modal-body">
                <p>Alerta: <strong>{selectedAlert.titulo}</strong></p>
                <div className="admin-form-group">
                  <label className="admin-form-label">Notas de resolución (opcional)</label>
                  <textarea
                    className="admin-form-textarea"
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    rows={6}
                    placeholder="Notas de resolución (opcional)"
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowResolveModal(false)}>
                  Cancelar
                </button>
                <button className="admin-btn admin-btn-success" onClick={confirmResolve}>
                  Resolver
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal Ver Detalles */}
        {showModal && selectedAlert && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Detalles de la Alerta</h3>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Tipo de Alerta:</label>
                  <span className={`admin-badge ${selectedAlert.tipo_alerta === 'critica' ? 'admin-badge-danger' : selectedAlert.tipo_alerta === 'alta' ? 'admin-badge-warning' : 'admin-badge-info'}`}>
                    {selectedAlert.tipo_alerta?.toUpperCase()}
                  </span>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Título:</label>
                  <p>{selectedAlert.titulo}</p>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Descripción:</label>
                  <p>{selectedAlert.descripcion}</p>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Usuario Afectado:</label>
                    <p>{selectedAlert.nombre} {selectedAlert.apellido}</p>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Correo:</label>
                    <p>{selectedAlert.correo}</p>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Clasificación:</label>
                  <p>{selectedAlert.clasificacion}</p>
                </div>

                {selectedAlert.contexto && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Contexto:</label>
                    <p>{selectedAlert.contexto}</p>
                  </div>
                )}

                <div className="admin-form-group">
                  <label className="admin-form-label">Niveles Emocionales:</label>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    {selectedAlert.nivel_estres && <span className="admin-badge admin-badge-warning">Estrés: {selectedAlert.nivel_estres.toFixed(2)}%</span>}
                    {selectedAlert.nivel_ansiedad && <span className="admin-badge admin-badge-danger">Ansiedad: {selectedAlert.nivel_ansiedad.toFixed(2)}%</span>}
                    {selectedAlert.emocion_dominante && <span className="admin-badge admin-badge-info">{selectedAlert.emocion_dominante}</span>}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Fecha de Creación:</label>
                  <p>{new Date(selectedAlert.fecha || selectedAlert.fecha_creacion).toLocaleString()}</p>
                </div>

                {historial && historial.length > 0 && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Historial de acciones:</label>
                    <div style={{ maxHeight: '200px', overflow: 'auto', background: 'var(--color-bg)', padding: '0.75rem', borderRadius: '8px' }}>
                      {historial.map((h) => (
                        <div key={h.id_historial || h.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                          <strong>{h.accion}</strong> — {h.detalles || ''}
                          <div className="admin-text-muted" style={{ fontSize: '0.8rem' }}>
                            {h.usuario_responsable ? `Por: ${h.usuario_responsable}` : ''} {h.fecha_accion ? `• ${new Date(h.fecha_accion).toLocaleString()}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAlert.fecha_revision && (
                  <div className="admin-message admin-message-success">
                    ✓ Resuelta el {new Date(selectedAlert.fecha_revision).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alertas;
