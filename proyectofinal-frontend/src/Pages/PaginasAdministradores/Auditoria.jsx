import React, { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../../context/themeContextDef";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import { FaShieldAlt, FaFilter, FaExclamationTriangle, FaDownload, FaEye, FaTimes, FaSearch } from "react-icons/fa";
import PageCard from "../../components/Shared/PageCard";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";

const Auditoria = () => {
  useContext(ThemeContext);
  const [sesiones, setSesiones] = useState([]);
  const [cambiosRoles, setCambiosRoles] = useState([]);
  const [actividadSospechosa, setActividadSospechosa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sesiones"); // sesiones, roles, sospechosa
  const [filter, setFilter] = useState({ usuario: "", desde: "", hasta: "" });
  const [filteredData, setFilteredData] = useState([]);
  const [msg, setMsg] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [sesionesRes, rolesRes, sospechosaRes] = await Promise.all([
        apiClient.get(api.endpoints.auditoria.sesiones),
        apiClient.get(api.endpoints.auditoria.cambiosRoles),
        apiClient.get(api.endpoints.auditoria.actividadSospechosa),
      ]);

      setSesiones(sesionesRes.data?.data || []);
      setCambiosRoles(rolesRes.data?.data || []);
      setActividadSospechosa(sospechosaRes.data?.data || []);
    } catch (error) {
      console.error("Error al cargar datos de auditoría:", error);
      setMsg("Error al cargar datos de auditoría");
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let data = [];
    switch (activeTab) {
      case "sesiones":
        data = sesiones;
        break;
      case "roles":
        data = cambiosRoles;
        break;
      case "sospechosa":
        data = actividadSospechosa;
        break;
    }

    let filtered = [...data];

    if (filter.usuario) {
      filtered = filtered.filter(item =>
        item.usuario?.toLowerCase().includes(filter.usuario.toLowerCase()) ||
        item.email?.toLowerCase().includes(filter.usuario.toLowerCase())
      );
    }

    if (filter.desde) {
      filtered = filtered.filter(item => {
        const fecha = new Date(item.fecha_inicio || item.fecha_cambio || item.fecha_deteccion);
        return fecha >= new Date(filter.desde);
      });
    }

    if (filter.hasta) {
      filtered = filtered.filter(item => {
        const fecha = new Date(item.fecha_inicio || item.fecha_cambio || item.fecha_deteccion);
        return fecha <= new Date(filter.hasta);
      });
    }

    setFilteredData(filtered);
  }, [filter, activeTab, sesiones, cambiosRoles, actividadSospechosa]);

  const exportarDatos = () => {
    let headers = [];
    let rows = [];

    switch (activeTab) {
      case "sesiones":
        headers = ["ID", "Usuario", "Email", "IP", "Dispositivo", "Inicio", "Fin", "Duración (min)"];
        rows = filteredData.map(s => [
          s.id_sesion,
          s.usuario,
          s.email,
          s.ip_address,
          s.dispositivo,
          new Date(s.fecha_inicio).toLocaleString(),
          s.fecha_fin ? new Date(s.fecha_fin).toLocaleString() : "Activa",
          s.duracion_minutos || "N/A"
        ]);
        break;
      case "roles":
        headers = ["ID", "Usuario", "Email", "Rol Anterior", "Rol Nuevo", "Admin", "Fecha"];
        rows = filteredData.map(r => [
          r.id_cambio,
          r.usuario,
          r.email,
          r.rol_anterior,
          r.rol_nuevo,
          r.admin_asigna || "Sistema",
          new Date(r.fecha_cambio).toLocaleString()
        ]);
        break;
      case "sospechosa":
        headers = ["ID", "Usuario", "Email", "Tipo", "Descripción", "Gravedad", "Fecha"];
        rows = filteredData.map(a => [
          a.id_actividad,
          a.usuario,
          a.email,
          a.tipo_actividad,
          a.descripcion,
          a.nivel_gravedad,
          new Date(a.fecha_deteccion).toLocaleString()
        ]);
        break;
    }

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setMsg(`Datos exportados correctamente`);
  };

  const verDetalles = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  return (
    <div className="admin-auditoria-page">
      <div className="admin-page-content">
        {/* Header y Filtros en PageCard */}
        <PageCard size="xl">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", margin: 0 }}>
              <FaShieldAlt style={{ color: "#2196f3" }} /> Auditoría y Seguridad
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: "0.5rem 0 0 0" }}>Monitorea sesiones, cambios de roles y actividad sospechosa</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', alignItems: 'flex-end', overflowX: 'auto' }}>
            <div style={{ flex: 2, minWidth: '180px' }}>
              <div className="input-labels">
                <label><FaSearch /> Buscar usuario/email</label>
              </div>
              <div className="input-group no-icon">
                <input
                  type="text"
                  placeholder="Nombre o email..."
                  value={filter.usuario}
                  onChange={(e) => setFilter({ ...filter, usuario: e.target.value })}
                />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div className="input-labels">
                <label>Desde</label>
              </div>
              <div className="input-group no-icon">
                <input
                  type="date"
                  value={filter.desde}
                  onChange={(e) => setFilter({ ...filter, desde: e.target.value })}
                />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div className="input-labels">
                <label>Hasta</label>
              </div>
              <div className="input-group no-icon">
                <input
                  type="date"
                  value={filter.hasta}
                  onChange={(e) => setFilter({ ...filter, hasta: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={exportarDatos} className="admin-btn admin-btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              <FaDownload /> <span className="admin-hidden-mobile">Exportar</span>
            </button>
          </div>
        </PageCard>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab("sesiones")}
            className={`admin-tab ${activeTab === "sesiones" ? 'active' : ''}`}
          >
            <span>Sesiones</span>
            <span className="badge">{sesiones.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`admin-tab ${activeTab === "roles" ? 'active' : ''}`}
          >
            <span>Cambios de Roles</span>
            <span className="badge">{cambiosRoles.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("sospechosa")}
            className={`admin-tab ${activeTab === "sospechosa" ? 'active' : ''}`}
          >
            <FaExclamationTriangle />
            <span>Sospechosa</span>
            <span className="badge">{actividadSospechosa.length}</span>
          </button>
        </div>

        <p className="admin-text-muted admin-mb-2">
          Mostrando {filteredData.length} registros
        </p>

        {msg && <div className="admin-message admin-message-success">{msg}</div>}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Cargando datos de auditoría...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="admin-empty-state">
            <FaShieldAlt />
            <h3>Sin registros</h3>
            <p>No hay registros que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    {activeTab === "sesiones" && (
                      <>
                        <th>Usuario</th>
                        <th>IP</th>
                        <th className="admin-hidden-mobile">Dispositivo</th>
                        <th>Inicio</th>
                        <th>Duración</th>
                        <th>Acciones</th>
                      </>
                    )}
                    {activeTab === "roles" && (
                      <>
                        <th>Usuario</th>
                        <th>Rol Anterior</th>
                        <th>Rol Nuevo</th>
                        <th className="admin-hidden-mobile">Admin</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </>
                    )}
                    {activeTab === "sospechosa" && (
                      <>
                        <th>Usuario</th>
                        <th>Tipo</th>
                        <th className="admin-hidden-mobile">Descripción</th>
                        <th>Gravedad</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, idx) => (
                    <tr key={idx}>
                      {activeTab === "sesiones" && (
                        <>
                          <td>
                            <div><strong>{item.usuario}</strong></div>
                            <div className="admin-text-muted" style={{ fontSize: "0.85rem" }}>{item.email}</div>
                          </td>
                          <td>{item.ip_address}</td>
                          <td className="admin-hidden-mobile">{item.dispositivo}</td>
                          <td>{new Date(item.fecha_inicio).toLocaleString()}</td>
                          <td>
                            {item.duracion_minutos ? `${item.duracion_minutos} min` : (
                              <span className="admin-badge admin-badge-success">🟢 Activa</span>
                            )}
                          </td>
                          <td className="admin-table-actions">
                            <button className="admin-btn admin-btn-secondary admin-btn-icon" onClick={() => verDetalles(item)}>
                              <FaEye />
                            </button>
                          </td>
                        </>
                      )}
                      {activeTab === "roles" && (
                        <>
                          <td>
                            <div><strong>{item.usuario}</strong></div>
                            <div className="admin-text-muted" style={{ fontSize: "0.85rem" }}>{item.email}</div>
                          </td>
                          <td><span className="admin-badge admin-badge-neutral">{item.rol_anterior}</span></td>
                          <td><span className="admin-badge admin-badge-info">{item.rol_nuevo}</span></td>
                          <td className="admin-hidden-mobile">{item.admin_asigna || "Sistema"}</td>
                          <td>{new Date(item.fecha_cambio).toLocaleString()}</td>
                          <td className="admin-table-actions">
                            <button className="admin-btn admin-btn-secondary admin-btn-icon" onClick={() => verDetalles(item)}>
                              <FaEye />
                            </button>
                          </td>
                        </>
                      )}
                      {activeTab === "sospechosa" && (
                        <>
                          <td>
                            <div><strong>{item.usuario}</strong></div>
                            <div className="admin-text-muted" style={{ fontSize: "0.85rem" }}>{item.email}</div>
                          </td>
                          <td>{item.tipo_actividad}</td>
                          <td className="admin-hidden-mobile">{item.descripcion}</td>
                          <td>
                            <span className={`admin-badge ${item.nivel_gravedad === 'critica' ? 'admin-badge-danger' : item.nivel_gravedad === 'alta' ? 'admin-badge-warning' : 'admin-badge-info'}`}>
                              {item.nivel_gravedad}
                            </span>
                          </td>
                          <td>{new Date(item.fecha_deteccion).toLocaleString()}</td>
                          <td className="admin-table-actions">
                            <button className="admin-btn admin-btn-secondary admin-btn-icon" onClick={() => verDetalles(item)}>
                              <FaEye />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de detalles */}
        {showModal && selectedItem && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">
                  Detalles de {activeTab === "sesiones" ? "Sesión" : activeTab === "roles" ? "Cambio de Rol" : "Actividad Sospechosa"}
                </h3>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="admin-modal-body">
                {activeTab === "sesiones" && (
                  <>
                    <div className="admin-form-group"><label className="admin-form-label">Usuario:</label><p>{selectedItem.usuario}</p></div>
                    <div className="admin-form-group"><label className="admin-form-label">Email:</label><p>{selectedItem.email}</p></div>
                    <div className="admin-form-row">
                      <div className="admin-form-group"><label className="admin-form-label">IP:</label><p>{selectedItem.ip_address}</p></div>
                      <div className="admin-form-group"><label className="admin-form-label">Dispositivo:</label><p>{selectedItem.dispositivo}</p></div>
                    </div>
                    <div className="admin-form-group"><label className="admin-form-label">Inicio:</label><p>{new Date(selectedItem.fecha_inicio).toLocaleString()}</p></div>
                    {selectedItem.fecha_fin && <div className="admin-form-group"><label className="admin-form-label">Fin:</label><p>{new Date(selectedItem.fecha_fin).toLocaleString()}</p></div>}
                    {selectedItem.duracion_minutos && <div className="admin-form-group"><label className="admin-form-label">Duración:</label><p>{selectedItem.duracion_minutos} minutos</p></div>}
                  </>
                )}
                {activeTab === "roles" && (
                  <>
                    <div className="admin-form-group"><label className="admin-form-label">Usuario:</label><p>{selectedItem.usuario}</p></div>
                    <div className="admin-form-group"><label className="admin-form-label">Email:</label><p>{selectedItem.email}</p></div>
                    <div className="admin-form-row">
                      <div className="admin-form-group"><label className="admin-form-label">Rol Anterior:</label><span className="admin-badge admin-badge-neutral">{selectedItem.rol_anterior}</span></div>
                      <div className="admin-form-group"><label className="admin-form-label">Rol Nuevo:</label><span className="admin-badge admin-badge-info">{selectedItem.rol_nuevo}</span></div>
                    </div>
                    <div className="admin-form-group"><label className="admin-form-label">Asignado por:</label><p>{selectedItem.admin_asigna || "Sistema automático"}</p></div>
                    <div className="admin-form-group"><label className="admin-form-label">Fecha:</label><p>{new Date(selectedItem.fecha_cambio).toLocaleString()}</p></div>
                    {selectedItem.razon && <div className="admin-form-group"><label className="admin-form-label">Razón:</label><p>{selectedItem.razon}</p></div>}
                  </>
                )}
                {activeTab === "sospechosa" && (
                  <>
                    <div className="admin-form-group"><label className="admin-form-label">Usuario:</label><p>{selectedItem.usuario}</p></div>
                    <div className="admin-form-group"><label className="admin-form-label">Email:</label><p>{selectedItem.email}</p></div>
                    <div className="admin-form-row">
                      <div className="admin-form-group"><label className="admin-form-label">Tipo:</label><p>{selectedItem.tipo_actividad}</p></div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Gravedad:</label>
                        <span className={`admin-badge ${selectedItem.nivel_gravedad === 'critica' ? 'admin-badge-danger' : selectedItem.nivel_gravedad === 'alta' ? 'admin-badge-warning' : 'admin-badge-info'}`}>
                          {selectedItem.nivel_gravedad}
                        </span>
                      </div>
                    </div>
                    <div className="admin-form-group"><label className="admin-form-label">Descripción:</label><p>{selectedItem.descripcion}</p></div>
                    <div className="admin-form-group"><label className="admin-form-label">Fecha:</label><p>{new Date(selectedItem.fecha_deteccion).toLocaleString()}</p></div>
                    {selectedItem.ip_address && <div className="admin-form-group"><label className="admin-form-label">IP:</label><p>{selectedItem.ip_address}</p></div>}
                    {selectedItem.acciones_tomadas && <div className="admin-form-group"><label className="admin-form-label">Acciones:</label><p>{selectedItem.acciones_tomadas}</p></div>}
                  </>
                )}
              </div>

              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auditoria;
