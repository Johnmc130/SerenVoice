import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import groupsService from '../../services/groupsService';
import { FaClipboardList, FaPlus, FaTrash } from 'react-icons/fa';
import "../../styles/StylesAdmin/AdminPages.css";

export default function ActividadesGrupo(){
  const { id } = useParams();
  const [actividades, setActividades] = useState([]);
  const [nuevo, setNuevo] = useState({ titulo:'', descripcion:'' });
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try{ const data = await groupsService.listarActividades(id); setActividades(data || []); }catch(e){console.error(e)}finally{setLoading(false)}
  }, [id]);

  useEffect(()=>{ if (id) cargar(); }, [id, cargar]);

  const crear = async (e) => {
    e.preventDefault();
    try{ await groupsService.crearActividad(id, nuevo); setNuevo({ titulo:'', descripcion:'' }); cargar(); }catch(e){console.error(e)}
  };

  const eliminar = async (actividadId) => {
    if(!confirm('Eliminar actividad?')) return;
    try{ await groupsService.eliminarActividad(id, actividadId); cargar(); }catch(e){console.error(e)}
  };

  return (
    <div className="admin-actividades-page">
      <div className="admin-page-content">
        {/* Header */}
        <div className="admin-page-header">
          <h2><FaClipboardList /> Actividades del Grupo</h2>
        </div>

        {/* Formulario para crear */}
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <div className="admin-card-body">
            <h4 style={{ marginBottom: "1rem" }}>Crear Nueva Actividad</h4>
            <form onSubmit={crear}>
              <div className="admin-form-row" style={{ gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <div className="admin-form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label className="admin-form-label">Título</label>
                  <input 
                    className="admin-form-input"
                    placeholder="Título de la actividad" 
                    required 
                    value={nuevo.titulo} 
                    onChange={e=>setNuevo(n=>({...n,titulo:e.target.value}))} 
                  />
                </div>
                <div className="admin-form-group" style={{ flex: 2, minWidth: "250px" }}>
                  <label className="admin-form-label">Descripción</label>
                  <input 
                    className="admin-form-input"
                    placeholder="Descripción de la actividad" 
                    value={nuevo.descripcion} 
                    onChange={e=>setNuevo(n=>({...n,descripcion:e.target.value}))} 
                  />
                </div>
              </div>
              <button type="submit" className="admin-btn admin-btn-primary">
                <FaPlus /> Crear Actividad
              </button>
            </form>
          </div>
        </div>

        {/* Lista de actividades */}
        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Cargando actividades...</p>
          </div>
        ) : actividades.length === 0 ? (
          <div className="admin-empty-state">
            <FaClipboardList />
            <h3>Sin actividades</h3>
            <p>Este grupo aún no tiene actividades.</p>
          </div>
        ) : (
          <div className="admin-cards-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {actividades.map(a => (
              <div key={a.id || a._id} className="admin-card">
                <div className="admin-card-body">
                  <h4 style={{ marginBottom: "0.5rem" }}>{a.titulo || a.title}</h4>
                  <p className="admin-text-muted">{a.descripcion || a.description || 'Sin descripción'}</p>
                  <div style={{ marginTop: "1rem" }}>
                    <button 
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => eliminar(a.id || a._id)}
                    >
                      <FaTrash /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
