import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import { 
  FaGamepad, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaToggleOn, 
  FaToggleOff, 
  FaSearch,
  FaTimes,
  FaSave,
  FaChartBar
} from "react-icons/fa";
import PageCard from "../../components/Shared/PageCard";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";

const JuegosAdmin = () => {
  const [juegos, setJuegos] = useState([]);
  const [filteredJuegos, setFilteredJuegos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [stats, setStats] = useState({});
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedJuego, setSelectedJuego] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo_juego: "puzzle",
    duracion_recomendada: 10,
    objetivo_emocional: "",
    icono: "🎮",
    activo: true
  });

  const tiposJuego = [
    { value: "respiracion", label: "Respiración", emoji: "🌬️" },
    { value: "puzzle", label: "Puzzle", emoji: "🧩" },
    { value: "mandala", label: "Mandala", emoji: "🎨" },
    { value: "memoria", label: "Memoria", emoji: "🧠" },
    { value: "mindfulness", label: "Mindfulness", emoji: "🧘" },
    { value: "relajacion", label: "Relajación", emoji: "💆" }
  ];

  useEffect(() => {
    cargarJuegos();
    cargarEstadisticas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarJuegos = async () => {
    try {
      const res = await apiClient.get(api.endpoints.juegos.list);
      const juegosData = res.data?.juegos || res.data?.data || [];
      setJuegos(juegosData);
      setFilteredJuegos(juegosData);
    } catch (error) {
      console.error("Error al cargar juegos:", error);
      showMessage("Error al cargar juegos terapéuticos", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const res = await apiClient.get(api.endpoints.juegos.estadisticas);
      setStats(res.data?.data || res.data || {});
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  // Filtrar juegos
  useEffect(() => {
    let filtered = [...juegos];
    
    if (searchTerm) {
      filtered = filtered.filter(j => 
        j.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterTipo !== "todos") {
      filtered = filtered.filter(j => j.tipo_juego === filterTipo);
    }
    
    setFilteredJuegos(filtered);
  }, [searchTerm, filterTipo, juegos]);

  const showMessage = (message, type = "success") => {
    setMsg(message);
    setMsgType(type);
    setTimeout(() => setMsg(""), 4000);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      nombre: "",
      descripcion: "",
      tipo_juego: "puzzle",
      duracion_recomendada: 10,
      objetivo_emocional: "",
      icono: "🎮",
      activo: true
    });
    setShowModal(true);
  };

  const openEditModal = (juego) => {
    setIsEditing(true);
    setSelectedJuego(juego);
    setFormData({
      nombre: juego.nombre || "",
      descripcion: juego.descripcion || "",
      tipo_juego: juego.tipo_juego || "puzzle",
      duracion_recomendada: juego.duracion_recomendada || 10,
      objetivo_emocional: juego.objetivo_emocional || "",
      icono: juego.icono || "🎮",
      activo: juego.activo !== false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      showMessage("El nombre es requerido", "error");
      return;
    }
    
    try {
      if (isEditing && selectedJuego) {
        // Actualizar
        await apiClient.put(`${api.endpoints.juegos.list}/${selectedJuego.id}`, formData);
        setJuegos(prev => prev.map(j => 
          j.id === selectedJuego.id ? { ...j, ...formData } : j
        ));
        showMessage("Juego actualizado correctamente");
      } else {
        // Crear
        const res = await apiClient.post(api.endpoints.juegos.list, formData);
        const nuevoJuego = res.data?.data || res.data?.juego || { id: Date.now(), ...formData };
        setJuegos(prev => [...prev, nuevoJuego]);
        showMessage("Juego creado correctamente");
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error al guardar juego:", error);
      showMessage("Error al guardar el juego", "error");
    }
  };

  const toggleActivo = async (juego) => {
    try {
      const newStatus = !juego.activo;
      await apiClient.patch(`${api.endpoints.juegos.list}/${juego.id}`, { activo: newStatus });
      setJuegos(prev => prev.map(j => 
        j.id === juego.id ? { ...j, activo: newStatus } : j
      ));
      showMessage(`Juego ${newStatus ? "activado" : "desactivado"} correctamente`);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      showMessage("Error al cambiar el estado del juego", "error");
    }
  };

  const confirmDelete = (juego) => {
    setSelectedJuego(juego);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedJuego) return;
    
    try {
      await apiClient.delete(`${api.endpoints.juegos.list}/${selectedJuego.id}`);
      setJuegos(prev => prev.filter(j => j.id !== selectedJuego.id));
      showMessage("Juego eliminado correctamente");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error al eliminar juego:", error);
      showMessage("Error al eliminar el juego", "error");
    }
  };

  const getTipoLabel = (tipo) => {
    const found = tiposJuego.find(t => t.value === tipo);
    return found ? `${found.emoji} ${found.label}` : tipo;
  };

  return (
    <div className="admin-juegos-page">
      <div className="admin-page-content">
        {/* Header y Filtros en PageCard */}
        <PageCard size="xl">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", margin: 0 }}>
              <FaGamepad style={{ color: "#9c27b0" }} /> Gestión de Juegos Terapéuticos
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: "0.5rem 0 0 0" }}>Administra los juegos terapéuticos disponibles</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', alignItems: 'flex-end', overflowX: 'auto' }}>
            <div style={{ flex: 2, minWidth: '180px' }}>
              <div className="input-labels">
                <label><FaSearch /> Buscar</label>
              </div>
              <div className="input-group no-icon">
                <input
                  type="text"
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <div className="input-labels">
                <label>Tipo de Juego</label>
              </div>
              <div className="input-group no-icon">
                <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                  <option value="todos">Todos los tipos</option>
                  {tiposJuego.map(t => (
                    <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={openCreateModal} className="admin-btn admin-btn-primary" style={{ whiteSpace: 'nowrap' }}>
              <FaPlus /> <span className="admin-hidden-mobile">Nuevo Juego</span>
            </button>
          </div>
        </PageCard>

        {/* Estadísticas */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🎮</div>
            <div className="admin-stat-value">{juegos.length}</div>
            <div className="admin-stat-label">Total Juegos</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">✅</div>
            <div className="admin-stat-value">{juegos.filter(j => j.activo).length}</div>
            <div className="admin-stat-label">Juegos Activos</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📊</div>
            <div className="admin-stat-value">{stats.sesiones_totales || 0}</div>
            <div className="admin-stat-label">Sesiones Totales</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">⭐</div>
            <div className="admin-stat-value">{stats.efectividad_promedio || "N/A"}%</div>
            <div className="admin-stat-label">Efectividad Promedio</div>
          </div>
        </div>

        <p className="admin-text-muted admin-mb-2">
          Mostrando {filteredJuegos.length} de {juegos.length} juegos
        </p>

        {msg && (
          <div className={`admin-message admin-message-${msgType}`}>
            {msg}
          </div>
        )}

        {/* Lista de juegos */}
        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Cargando juegos...</p>
          </div>
        ) : filteredJuegos.length === 0 ? (
          <div className="admin-empty-state">
            <FaGamepad />
            <h3>Sin juegos</h3>
            <p>No hay juegos que coincidan con los filtros.</p>
            <button onClick={openCreateModal} className="admin-btn admin-btn-primary">
              <FaPlus /> Crear primer juego
            </button>
          </div>
        ) : (
          <div className="admin-cards-grid">
            {filteredJuegos.map((juego) => (
              <div
                key={juego.id}
                className={`admin-card ${!juego.activo ? 'admin-card-inactive' : ''}`}
                style={{ borderLeft: `4px solid ${juego.activo ? '#4caf50' : '#9e9e9e'}` }}
              >
                <div className="admin-card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "2rem" }}>{juego.icono || "🎮"}</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{juego.nombre}</h3>
                          <span className={`admin-badge ${juego.activo ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
                            {juego.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                      
                      <p className="admin-text-muted" style={{ marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                        {juego.descripcion || "Sin descripción"}
                      </p>
                      
                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
                        <span className="admin-badge admin-badge-info">
                          {getTipoLabel(juego.tipo_juego)}
                        </span>
                        <span className="admin-text-muted">
                          ⏱️ {juego.duracion_recomendada || 10} min
                        </span>
                        {juego.objetivo_emocional && (
                          <span className="admin-text-muted">
                            🎯 {juego.objetivo_emocional}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <button
                        className="admin-btn admin-btn-icon admin-btn-secondary"
                        onClick={() => openEditModal(juego)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className={`admin-btn admin-btn-icon ${juego.activo ? 'admin-btn-success' : 'admin-btn-warning'}`}
                        onClick={() => toggleActivo(juego)}
                        title={juego.activo ? "Desactivar" : "Activar"}
                      >
                        {juego.activo ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                      <button
                        className="admin-btn admin-btn-icon admin-btn-danger"
                        onClick={() => confirmDelete(juego)}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de crear/editar */}
        {showModal && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">
                  {isEditing ? "Editar Juego" : "Nuevo Juego Terapéutico"}
                </h3>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="admin-modal-body">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Nombre *</label>
                    <input
                      type="text"
                      className="admin-form-control"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Respiración Consciente"
                      required
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label className="admin-form-label">Descripción</label>
                    <textarea
                      className="admin-form-control"
                      rows="3"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción del juego y sus beneficios..."
                    />
                  </div>
                  
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Tipo de Juego</label>
                      <select
                        className="admin-form-control"
                        value={formData.tipo_juego}
                        onChange={(e) => setFormData({ ...formData, tipo_juego: e.target.value })}
                      >
                        {tiposJuego.map(t => (
                          <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="admin-form-group">
                      <label className="admin-form-label">Duración (minutos)</label>
                      <input
                        type="number"
                        className="admin-form-control"
                        min="1"
                        max="60"
                        value={formData.duracion_recomendada}
                        onChange={(e) => setFormData({ ...formData, duracion_recomendada: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                  </div>
                  
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Objetivo Emocional</label>
                      <input
                        type="text"
                        className="admin-form-control"
                        value={formData.objetivo_emocional}
                        onChange={(e) => setFormData({ ...formData, objetivo_emocional: e.target.value })}
                        placeholder="Ej: Reducir ansiedad"
                      />
                    </div>
                    
                    <div className="admin-form-group">
                      <label className="admin-form-label">Ícono</label>
                      <input
                        type="text"
                        className="admin-form-control"
                        value={formData.icono}
                        onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                        placeholder="🎮"
                        maxLength="4"
                      />
                    </div>
                  </div>
                  
                  <div className="admin-form-group">
                    <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      />
                      Juego activo (visible para usuarios)
                    </label>
                  </div>
                </div>
                
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    <FaSave /> {isEditing ? "Guardar Cambios" : "Crear Juego"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && selectedJuego && (
          <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Confirmar Eliminación</h3>
                <button className="admin-modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="admin-modal-body">
                <p>¿Estás seguro de que deseas eliminar el juego <strong>{selectedJuego.nombre}</strong>?</p>
                <p className="admin-text-muted">Esta acción no se puede deshacer y se perderán todas las estadísticas asociadas.</p>
              </div>
              
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancelar
                </button>
                <button className="admin-btn admin-btn-danger" onClick={handleDelete}>
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JuegosAdmin;
