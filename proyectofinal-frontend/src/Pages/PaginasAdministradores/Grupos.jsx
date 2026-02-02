import React, { useEffect, useState, useContext } from 'react';
import groupsService from '../../services/groupsService';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from "../../context/themeContextDef";
import { FaUserFriends, FaChartBar, FaUsers, FaClipboardList, FaDownload, FaLock, FaGlobe, FaEnvelope, FaKey } from "react-icons/fa";
import apiClient from '../../services/apiClient';
import api from "../../config/api";
import PageCard from "../../components/Shared/PageCard";
import ConfirmDialog from "../../components/Shared/ConfirmDialog";
import GrupoStatsModal from "../../components/Administrador/GrupoStatsModal";
import MiembrosModal from "../../components/Administrador/MiembrosModal";
import ActividadesModal from "../../components/Administrador/ActividadesModal";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";

export default function Grupos() {
  useContext(ThemeContext);
  const [grupos, setGrupos] = useState([]);
  const [filteredGrupos, setFilteredGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showMiembrosModal, setShowMiembrosModal] = useState(false);
  const [showActividadesModal, setShowActividadesModal] = useState(false);
  const [miembros, setMiembros] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [loadingMiembros, setLoadingMiembros] = useState(false);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [filter, setFilter] = useState({ tipo: "todos", estado: "activos", busqueda: "" });
  const [msg, setMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: 'danger', title: '', message: '', onConfirm: null });
  const navigate = useNavigate();

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(api.endpoints.grupos.estadisticas);
      const data = res.data?.data || [];
      setGrupos(data);
      setFilteredGrupos(data);
    } catch (e) {
      console.error(e);
      // Fallback al servicio anterior
      try {
        const data = await groupsService.listar();
        setGrupos(data || []);
        setFilteredGrupos(data || []);
      } catch (err) {
        console.error(err);
        setGrupos([]);
        setFilteredGrupos([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (id, activo) => {
    try {
      await apiClient.patch(api.endpoints.grupos.estado(id), { activo: !activo });
      setMsg(`Grupo ${!activo ? 'activado' : 'desactivado'} correctamente`);
      cargar();
    } catch (e) {
      console.error(e);
      setMsg("Error al cambiar estado del grupo");
    }
  };

  const viewGrupoStats = (grupo) => {
    // Ya tenemos todos los datos del grupo, no necesitamos hacer otra llamada API
    setSelectedGrupo(grupo);
    setShowModal(true);
  };

  const viewMiembros = async (grupo) => {
    setSelectedGrupo(grupo);
    setShowMiembrosModal(true);
    setLoadingMiembros(true);
    try {
      const res = await apiClient.get(api.endpoints.grupos.miembros(grupo.id_grupo || grupo.id));
      setMiembros(res.data || []);
    } catch (e) {
      console.error(e);
      setMiembros([]);
    } finally {
      setLoadingMiembros(false);
    }
  };

  const viewActividades = async (grupo) => {
    setSelectedGrupo(grupo);
    setShowActividadesModal(true);
    setLoadingActividades(true);
    try {
      const res = await apiClient.get(api.endpoints.grupos.actividades(grupo.id_grupo || grupo.id));
      setActividades(res.data || []);
    } catch (e) {
      console.error(e);
      setActividades([]);
    } finally {
      setLoadingActividades(false);
    }
  };

  const confirmarEliminarMiembro = (miembro) => {
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Eliminar miembro',
      message: `¿Estás seguro de eliminar a ${miembro.nombre || 'este usuario'} del grupo?`,
      onConfirm: () => eliminarMiembro(miembro.id_usuario || miembro.id)
    });
  };

  const eliminarMiembro = async (idUsuario) => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    try {
      await apiClient.delete(api.endpoints.grupos.eliminarMiembro(selectedGrupo.id_grupo || selectedGrupo.id, idUsuario));
      setMsg('Miembro eliminado correctamente');
      setMiembros(miembros.filter(m => m.id_usuario !== idUsuario));
      cargar(); // Refrescar estadísticas
    } catch (e) {
      console.error(e);
      setMsg('Error al eliminar miembro');
    }
  };

  const cambiarRolMiembro = async (idUsuario, nuevoRol) => {
    try {
      await apiClient.put(
        api.endpoints.grupos.actualizarMiembro(selectedGrupo.id_grupo || selectedGrupo.id, idUsuario),
        { rol_grupo: nuevoRol }
      );
      setMsg('Rol actualizado correctamente');
      // Actualizar estado local
      setMiembros(miembros.map(m => 
        (m.id_usuario || m.id) === idUsuario 
          ? { ...m, rol_grupo: nuevoRol } 
          : m
      ));
    } catch (e) {
      console.error(e);
      setMsg('Error al cambiar rol del miembro');
    }
  };

  const confirmarEliminarActividad = (actividad) => {
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Eliminar actividad',
      message: `¿Estás seguro de eliminar la actividad "${actividad.titulo || 'esta actividad'}"?`,
      onConfirm: () => eliminarActividad(actividad.id_actividad || actividad.id)
    });
  };

  const eliminarActividad = async (idActividad) => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    try {
      await apiClient.delete(api.endpoints.grupos.eliminarActividad(idActividad));
      setMsg('Actividad eliminada correctamente');
      setActividades(actividades.filter(a => a.id_actividad !== idActividad));
      cargar(); // Refrescar estadísticas
    } catch (e) {
      console.error(e);
      setMsg('Error al eliminar actividad');
    }
  };

  const exportGrupos = () => {
    const csv = [
      ["ID", "Nombre", "Tipo", "Privacidad", "Facilitador", "Miembros", "Activos", "Actividades", "Completadas", "Estado"].join(","),
      ...filteredGrupos.map(g =>
        [
          g.id_grupo,
          g.nombre_grupo,
          g.tipo_grupo,
          g.privacidad,
          `${g.facilitador_nombre} ${g.facilitador_apellido}`,
          g.total_miembros || 0,
          g.miembros_activos || 0,
          g.total_actividades || 0,
          g.actividades_completadas || 0,
          g.activo ? "Activo" : "Inactivo"
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grupos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setMsg("Grupos exportados correctamente");
  };

  useEffect(() => { cargar(); }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...grupos];

    if (filter.tipo !== "todos") {
      filtered = filtered.filter(g => g.tipo_grupo === filter.tipo);
    }

    if (filter.estado === "activos") {
      filtered = filtered.filter(g => g.activo);
    } else if (filter.estado === "inactivos") {
      filtered = filtered.filter(g => !g.activo);
    }

    if (filter.busqueda) {
      const search = filter.busqueda.toLowerCase();
      filtered = filtered.filter(g =>
        g.nombre_grupo?.toLowerCase().includes(search) ||
        g.descripcion?.toLowerCase().includes(search)
      );
    }

    setFilteredGrupos(filtered);
    setCurrentPage(1); // Reset a página 1 al cambiar filtros
  }, [filter, grupos]);

  return (
    <div className="admin-grupos-page">
      <div className="admin-page-content">
        {/* Card con título y filtros */}
        <PageCard size="xl">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", margin: 0 }}>
              <FaUserFriends style={{ color: "#9c27b0" }} /> Gestión de Grupos
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: "0.5rem 0 0 0" }}>
              Administra y gestiona los grupos del sistema
            </p>
          </div>

          {/* Filtros horizontales */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', alignItems: 'flex-end', overflowX: 'auto' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <div className="input-labels">
                <label>Buscar</label>
              </div>
              <div className="input-group no-icon">
                <input
                  type="text"
                  placeholder="Nombre o descripción..."
                  value={filter.busqueda}
                  onChange={(e) => setFilter({ ...filter, busqueda: e.target.value })}
                />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '140px' }}>
              <div className="input-labels">
                <label>Tipo</label>
              </div>
              <div className="input-group no-icon">
                <select value={filter.tipo} onChange={(e) => setFilter({ ...filter, tipo: e.target.value })}>
                  <option value="todos">Todos</option>
                  <option value="terapia">Terapia</option>
                  <option value="apoyo">Apoyo</option>
                  <option value="taller">Taller</option>
                  <option value="empresa">Empresa</option>
                  <option value="educativo">Educativo</option>
                  <option value="familiar">Familiar</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '140px' }}>
              <div className="input-labels">
                <label>Estado</label>
              </div>
              <div className="input-group no-icon">
                <select value={filter.estado} onChange={(e) => setFilter({ ...filter, estado: e.target.value })}>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={exportGrupos} className="admin-btn admin-btn-secondary">
              <FaDownload /> Exportar
            </button>
          </div>
        </PageCard>

        <p className="admin-text-muted admin-mb-2">
          Mostrando {Math.min(perPage, filteredGrupos.length - (currentPage - 1) * perPage)} de {filteredGrupos.length} grupos
        </p>

        {msg && <div className="admin-message admin-message-success">{msg}</div>}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Cargando grupos...</p>
          </div>
        ) : filteredGrupos.length === 0 ? (
          <div className="admin-empty-state">
            <FaUserFriends />
            <h3>Sin grupos</h3>
            <p>No hay grupos que coincidan con los filtros.</p>
          </div>
        ) : (
          <>
            <div className="admin-cards-grid">
              {filteredGrupos
                .slice((currentPage - 1) * perPage, currentPage * perPage)
                .map(g => {
              const privacyIcon = g.privacidad === 'publico' ? <FaGlobe /> : g.privacidad === 'por_invitacion' ? <FaEnvelope /> : <FaLock />;
              const privacyLabel = g.privacidad === 'publico' ? 'Público' : g.privacidad === 'por_invitacion' ? 'Por invitación' : 'Privado';
              
              return (
                <div 
                  key={g.id_grupo || g.id || g._id} 
                  className="card grupo-card"
                  style={{ 
                    padding: '1.25rem',
                    opacity: g.activo ? 1 : 0.7,
                    textAlign: 'left',
                    margin: 0,
                    background: 'var(--color-panel-solid)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {/* Header del card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {g.nombre_grupo || g.nombre || g.name}
                      </h3>
                      {g.descripcion && (
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                          {g.descripcion.substring(0, 70)}{g.descripcion.length > 70 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    <span className={`admin-badge ${g.activo ? 'admin-badge-success' : 'admin-badge-danger'}`} style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                      {g.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Badges de tipo y privacidad */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      backgroundColor: 'var(--nav-item-hover-bg)',
                      color: 'var(--color-primary)'
                    }}>
                      {g.tipo_grupo || 'N/A'}
                    </span>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      backgroundColor: 'var(--color-panel)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)'
                    }}>
                      {privacyIcon} {privacyLabel}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '0.5rem', 
                    marginBottom: '0.75rem',
                    padding: '0.6rem',
                    background: 'var(--color-panel)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: 'var(--color-primary)' }}>
                        <FaUsers style={{ fontSize: '0.9rem' }} />
                        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{g.miembros_activos || 0}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>/ {g.total_miembros || 0}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>Miembros</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: 'var(--color-success)' }}>
                        <FaClipboardList style={{ fontSize: '0.9rem' }} />
                        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{g.actividades_completadas || 0}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>/ {g.total_actividades || 0}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>Actividades</div>
                    </div>
                  </div>

                  {/* Facilitador/Creador y código */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <FaUserFriends style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }} />
                      <span>
                        {g.facilitador_nombre 
                          ? `${g.facilitador_nombre} ${g.facilitador_apellido || ''}` 
                          : g.creador_nombre 
                            ? `${g.creador_nombre} ${g.creador_apellido || ''} (creador)` 
                            : 'Sin facilitador'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FaKey style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }} />
                      <code style={{ background: 'var(--color-panel)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--color-border)' }}>
                        {g.codigo_acceso || g.codigo_invitacion || 'N/A'}
                      </code>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    <button 
                      onClick={() => viewGrupoStats(g)} 
                      title="Ver estadísticas"
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.4rem 0.6rem', 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.35rem',
                        backgroundColor: 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.85'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      <FaChartBar /> Stats
                    </button>
                    <button 
                      onClick={() => viewMiembros(g)}
                      title="Ver miembros"
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.4rem 0.6rem', 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.35rem',
                        backgroundColor: 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.85'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      <FaUsers /> Miembros
                    </button>
                    <button 
                      onClick={() => viewActividades(g)}
                      title="Ver actividades"
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.4rem 0.6rem', 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.35rem',
                        backgroundColor: 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.85'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      <FaClipboardList /> Actividades
                    </button>
                    <button
                      onClick={() => toggleEstado(g.id_grupo || g.id || g._id, g.activo)}
                      title={g.activo ? 'Desactivar grupo' : 'Activar grupo'}
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.4rem 0.6rem',
                        backgroundColor: g.activo ? '#ff6b6b' : 'var(--color-success)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      {g.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              );
            })}
            </div>

            {/* Paginación */}
            {filteredGrupos.length > perPage && (
              <div className="admin-pagination">
                <button
                  className="admin-pagination-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  «
                </button>
                <button
                  className="admin-pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>
                
                {(() => {
                  const totalPages = Math.ceil(filteredGrupos.length / perPage);
                  const pages = [];
                  let start = Math.max(1, currentPage - 2);
                  let end = Math.min(totalPages, start + 4);
                  if (end - start < 4) start = Math.max(1, end - 4);
                  
                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <button
                        key={i}
                        className={`admin-pagination-btn ${currentPage === i ? 'active' : ''}`}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}
                
                <button
                  className="admin-pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredGrupos.length / perPage), p + 1))}
                  disabled={currentPage >= Math.ceil(filteredGrupos.length / perPage)}
                >
                  ›
                </button>
                <button
                  className="admin-pagination-btn"
                  onClick={() => setCurrentPage(Math.ceil(filteredGrupos.length / perPage))}
                  disabled={currentPage >= Math.ceil(filteredGrupos.length / perPage)}
                >
                  »
                </button>
                
                <select
                  className="admin-pagination-select"
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="5">5 / pág</option>
                  <option value="10">10 / pág</option>
                  <option value="15">15 / pág</option>
                  <option value="30">30 / pág</option>
                  <option value="50">50 / pág</option>
                </select>
              </div>
            )}
          </>
        )}

        {/* Modales usando componentes */}
        <GrupoStatsModal 
          show={showModal} 
          grupo={selectedGrupo} 
          onClose={() => setShowModal(false)} 
        />

        <MiembrosModal 
          show={showMiembrosModal}
          grupo={selectedGrupo}
          miembros={miembros}
          loading={loadingMiembros}
          onClose={() => setShowMiembrosModal(false)}
          onEliminarMiembro={confirmarEliminarMiembro}
          onCambiarRol={cambiarRolMiembro}
        />

        <ActividadesModal 
          show={showActividadesModal}
          grupo={selectedGrupo}
          actividades={actividades}
          loading={loadingActividades}
          onClose={() => setShowActividadesModal(false)}
          onEliminarActividad={confirmarEliminarActividad}
        />

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      </div>
    </div>
  );
}
