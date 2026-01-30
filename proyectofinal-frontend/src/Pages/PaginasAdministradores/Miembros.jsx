import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import groupsService from '../../services/groupsService';
import { FaUsers, FaPlus, FaTrash } from 'react-icons/fa';
import "../../styles/StylesAdmin/AdminPages.css";

export default function Miembros(){
  const { id } = useParams();
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo] = useState({ nombre:'', correo:'' });

  const cargar = useCallback(async () => {
    setLoading(true);
    try{ const data = await groupsService.listarMiembros(id); setMiembros(data || []); }catch(e){console.error(e)}finally{setLoading(false)}
  }, [id]);

  useEffect(()=>{ if (id) cargar(); }, [id, cargar]);

  const agregar = async (e) => {
    e.preventDefault();
    try{
      await groupsService.agregarMiembro(id, nuevo);
      setNuevo({ nombre:'', correo:'' });
      cargar();
    }catch(e){ console.error(e) }
  };

  const eliminar = async (miembroId) => {
    if(!confirm('Eliminar miembro?')) return;
    try{ await groupsService.eliminarMiembro(id, miembroId); cargar(); }catch(e){console.error(e)}
  };

  return (
    <div className="admin-miembros-page">
      <div className="admin-page-content">
        {/* Header */}
        <div className="admin-page-header">
          <h2><FaUsers /> Miembros del Grupo</h2>
        </div>

        {/* Formulario para agregar */}
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <div className="admin-card-body">
            <h4 style={{ marginBottom: "1rem" }}>Agregar Nuevo Miembro</h4>
            <form onSubmit={agregar} className="admin-form-row" style={{ gap: "1rem", flexWrap: "wrap" }}>
              <div className="admin-form-group" style={{ flex: 1, minWidth: "200px" }}>
                <label className="admin-form-label">Nombre</label>
                <input 
                  className="admin-form-input"
                  placeholder="Nombre del miembro" 
                  required 
                  value={nuevo.nombre} 
                  onChange={e=>setNuevo(n=>({...n,nombre:e.target.value}))} 
                />
              </div>
              <div className="admin-form-group" style={{ flex: 1, minWidth: "200px" }}>
                <label className="admin-form-label">Correo</label>
                <input 
                  className="admin-form-input"
                  placeholder="correo@ejemplo.com" 
                  type="email"
                  value={nuevo.correo} 
                  onChange={e=>setNuevo(n=>({...n,correo:e.target.value}))} 
                />
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ alignSelf: "flex-end" }}>
                <FaPlus /> Agregar
              </button>
            </form>
          </div>
        </div>

        {/* Lista de miembros */}
        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Cargando miembros...</p>
          </div>
        ) : miembros.length === 0 ? (
          <div className="admin-empty-state">
            <FaUsers />
            <h3>Sin miembros</h3>
            <p>Este grupo aún no tiene miembros.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {miembros.map(m => (
                    <tr key={m.id || m._id}>
                      <td><strong>{m.nombre || m.name}</strong></td>
                      <td className="admin-text-muted">{m.correo || m.email}</td>
                      <td className="admin-table-actions">
                        <button 
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => eliminar(m.id || m._id)}
                        >
                          <FaTrash /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
