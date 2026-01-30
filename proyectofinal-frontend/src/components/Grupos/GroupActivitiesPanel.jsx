import React, { useEffect, useState, useCallback } from 'react';
import { FaTag, FaAlignLeft, FaList, FaCalendarAlt, FaPlus, FaCheck, FaPlay, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import groupsService from '../../services/groupsService';

export default function GroupActivitiesPanel({ grupoId, onQueueAdd, onQueueUpdate, queuedActivities = [] }){
  const [actividades, setActividades] = useState([]);
  const [nuevo, setNuevo] = useState({ titulo:'', descripcion:'', tipo_actividad:'tarea', fecha_inicio:'', fecha_fin:'' });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [participaciones, setParticipaciones] = useState({});
  const [loadingParticipacion, setLoadingParticipacion] = useState({});

  const cargar = useCallback(async () => {
    if (!grupoId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try{
      const data = await groupsService.listarActividades(grupoId);
      const actividadesList = data || [];
      setActividades(actividadesList);
      
      // Cargar estado de participación para cada actividad
      const participacionesMap = {};
      for (const act of actividadesList) {
        const actId = act.id_actividad || act.id;
        try {
          const res = await groupsService.obtenerMiParticipacion(actId);
          if (res.success && res.participacion) {
            participacionesMap[actId] = {
              participando: true,
              completada: res.participacion.completada || res.participacion.estado === 'completada',
              id_participacion: res.participacion.id_participacion || res.participacion.id
            };
          } else {
            participacionesMap[actId] = { participando: false, completada: false, id_participacion: null };
          }
        } catch {
          participacionesMap[actId] = { participando: false, completada: false, id_participacion: null };
        }
      }
      setParticipaciones(participacionesMap);
    }catch(e){ console.error('[GroupActivitiesPanel] cargar', e); }
    finally{ setLoading(false); }
  }, [grupoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      const str = value.toString();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const d = new Date(str + 'T00:00:00');
        return d.toLocaleDateString();
      }
      const d = new Date(str);
      if (!isNaN(d)) return d.toLocaleString();
      return str;
    } catch {
      return value;
    }
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      'tarea': '📋 Tarea',
      'juego_grupal': '🎮 Juego Grupal',
      'ejercicio_respiracion': '🌬️ Ejercicio Respiración',
      'meditacion_guiada': '🧘 Meditación Guiada',
      'reflexion': '💭 Reflexión',
      'otro': '📌 Otro'
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo) => {
    const colors = {
      'tarea': '#4caf50',
      'juego_grupal': '#9c27b0',
      'ejercicio_respiracion': '#00bcd4',
      'meditacion_guiada': '#673ab7',
      'reflexion': '#ff9800',
      'otro': '#607d8b'
    };
    return colors[tipo] || '#607d8b';
  };

  // Date limits
  const toDateInputString = (d) => d.toISOString().slice(0,10);
  const normalizeForDateInput = (v) => {
    if (!v) return '';
    try { const s = v.toString(); if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10); const d = new Date(s); if (!isNaN(d)) return d.toISOString().slice(0,10); return s.slice(0,10); } catch { return '' }
  };
  const todayDate = new Date();
  const todayStr = toDateInputString(new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()));
  const maxDate = new Date(todayDate);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxStr = toDateInputString(new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()));

  const validateDates = (obj) => {
    const titulo = (obj.titulo || obj.title || '').toString().trim();
    const descripcion = (obj.descripcion || obj.description || '').toString().trim();
    const tipo = (obj.tipo_actividad || obj.type || '').toString().trim();
    const inicio = obj.fecha_inicio || obj.fechaInicio || null;
    const fin = obj.fecha_fin || obj.fechaFin || null;

    if (!titulo) return { ok:false, msg: 'El título es obligatorio' };
    if (!descripcion) return { ok:false, msg: 'La descripción es obligatoria' };
    if (!tipo) return { ok:false, msg: 'Selecciona un tipo de actividad' };
    if (!inicio || !fin) return { ok:false, msg: 'Debe completar Fecha Inicio y Fecha Fin' };

    const parse = (s) => { if (!s) return null; try { return new Date(s + 'T00:00:00'); } catch { return new Date(s); } };
    const di = parse(inicio);
    const df = parse(fin);
    const today = new Date(todayStr + 'T00:00:00');
    const maxD = new Date(maxStr + 'T00:00:00');

    if (isNaN(di)) return { ok:false, msg: 'Fecha inicio inválida' };
    if (isNaN(df)) return { ok:false, msg: 'Fecha fin inválida' };
    if (di < today) return { ok:false, msg: 'La fecha de inicio no puede ser anterior a hoy' };
    if (df < today) return { ok:false, msg: 'La fecha de fin no puede ser anterior a hoy' };
    if (di > maxD) return { ok:false, msg: 'La fecha de inicio no puede ser mayor a un año desde hoy' };
    if (df > maxD) return { ok:false, msg: 'La fecha de fin no puede ser mayor a un año desde hoy' };
    if (df < di) return { ok:false, msg: 'La fecha de fin no puede ser anterior a la fecha de inicio' };
    return { ok:true };
  };

  const resetForm = () => {
    setNuevo({ titulo:'', descripcion:'', tipo_actividad:'tarea', fecha_inicio:'', fecha_fin:'' });
    setEditingIndex(null);
    setEditingId(null);
    setShowForm(false);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validateDates(nuevo);
    if (!v.ok) { setErrorMsg(v.msg); return; }

    if (!grupoId) {
      // Modo borrador para crear grupo
      if (onQueueAdd) {
        const nowIso = new Date().toISOString();
        const queued = { ...nuevo, fecha_creacion: nowIso, fechaCreacion: nowIso };
        if (editingIndex !== null && typeof onQueueUpdate === 'function') {
          const updated = queuedActivities.map((it, idx) => idx === editingIndex ? queued : it);
          onQueueUpdate(updated);
        } else {
          onQueueAdd(queued);
        }
        resetForm();
      }
      return;
    }
    
    try{
      const nowIso = new Date().toISOString();
      const payload = { ...nuevo, fecha_creacion: nowIso, fechaCreacion: nowIso };
      if (editingId) {
        await groupsService.actualizarActividad(grupoId, editingId, payload);
      } else {
        await groupsService.crearActividad(grupoId, payload);
      }
      resetForm();
      cargar();
    }catch(e){console.error('[GroupActivitiesPanel] crear',e)}
  };

  const eliminar = async (actividadId) => {
    if(!confirm('¿Eliminar actividad?')) return;
    try{ await groupsService.eliminarActividad(grupoId, actividadId); cargar(); }catch(e){console.error('[GroupActivitiesPanel] eliminar',e)}
  };

  const editarQueued = (index) => {
    const a = queuedActivities[index];
    setNuevo({
      titulo: a.titulo || a.title || '',
      descripcion: a.descripcion || a.description || '',
      tipo_actividad: a.tipo_actividad || a.type || 'tarea',
      fecha_inicio: normalizeForDateInput(a.fecha_inicio || a.fechaInicio),
      fecha_fin: normalizeForDateInput(a.fecha_fin || a.fechaFin),
    });
    setEditingIndex(index);
    setEditingId(null);
    setShowForm(true);
    setErrorMsg('');
  };

  const editarExistente = (a) => {
    setNuevo({
      titulo: a.titulo || a.title || '',
      descripcion: a.descripcion || a.description || '',
      tipo_actividad: a.tipo_actividad || a.type || 'tarea',
      fecha_inicio: normalizeForDateInput(a.fecha_inicio || a.fechaInicio),
      fecha_fin: normalizeForDateInput(a.fecha_fin || a.fechaFin),
    });
    setEditingId(a.id_actividad || a.id || a._id);
    setEditingIndex(null);
    setShowForm(true);
    setErrorMsg('');
  };

  const quitarQueued = (index) => {
    if (onQueueUpdate) {
      onQueueUpdate(queuedActivities.filter((_,i) => i !== index));
    }
  };

  // Participación
  const participar = async (actividadId) => {
    setLoadingParticipacion(prev => ({ ...prev, [actividadId]: true }));
    try {
      const res = await groupsService.participarActividad(actividadId);
      if (res.success || res.id_participacion) {
        setParticipaciones(prev => ({
          ...prev,
          [actividadId]: {
            participando: true,
            completada: false,
            id_participacion: res.id_participacion || res.data?.id_participacion
          }
        }));
      }
    } catch (e) {
      console.error('[GroupActivitiesPanel] participar', e);
      setErrorMsg('Error al unirse a la actividad');
    } finally {
      setLoadingParticipacion(prev => ({ ...prev, [actividadId]: false }));
    }
  };

  const completarParticipacion = async (actividadId) => {
    const participacion = participaciones[actividadId];
    if (!participacion?.id_participacion) return;
    
    setLoadingParticipacion(prev => ({ ...prev, [actividadId]: true }));
    try {
      const res = await groupsService.completarParticipacion(participacion.id_participacion);
      if (res.success) {
        setParticipaciones(prev => ({
          ...prev,
          [actividadId]: { ...prev[actividadId], completada: true }
        }));
      }
    } catch (e) {
      console.error('[GroupActivitiesPanel] completar', e);
      setErrorMsg('Error al completar la actividad');
    } finally {
      setLoadingParticipacion(prev => ({ ...prev, [actividadId]: false }));
    }
  };

  // Estilos reutilizables
  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--color-shadow)',
    background: 'var(--color-panel-solid)',
    color: 'var(--color-text-main)',
    fontSize: '0.95rem'
  };

  const labelStyle = {
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  // Renderizado de tarjeta de actividad
  const renderActivityCard = (a, index, isQueued = false) => {
    const actId = isQueued ? `queued-${index}` : (a.id_actividad || a.id);
    const titulo = a.titulo || a.title || 'Sin título';
    const descripcion = a.descripcion || a.description || 'Sin descripción';
    const tipo = a.tipo_actividad || a.type || 'tarea';
    const fechaInicio = formatDate(a.fecha_inicio || a.fechaInicio);
    const fechaFin = formatDate(a.fecha_fin || a.fechaFin);
    const part = participaciones[actId] || {};
    const isLoading = loadingParticipacion[actId];

    return (
      <div key={actId} style={{
        background: 'var(--color-panel-solid)',
        padding: '1.25rem',
        borderRadius: '12px',
        border: '1px solid var(--color-shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '1rem' }}>{titulo}</h4>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{descripcion}</p>
          </div>
          <span style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '12px',
            background: getTipoColor(tipo),
            color: 'white',
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}>
            {getTipoLabel(tipo)}
          </span>
        </div>

        {/* Fechas */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '0.5rem', 
          fontSize: '0.85rem',
          padding: '0.75rem',
          background: 'var(--color-panel)',
          borderRadius: '8px'
        }}>
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Inicio:</span>
            <div style={{ color: 'var(--color-text-main)', fontWeight: '500' }}>{fechaInicio}</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Fin:</span>
            <div style={{ color: 'var(--color-text-main)', fontWeight: '500' }}>{fechaFin}</div>
          </div>
        </div>

        {/* Participación (solo para actividades existentes) */}
        {!isQueued && grupoId && (
          <div style={{ padding: '0.5rem 0', borderTop: '1px solid var(--color-shadow)' }}>
            {part.completada ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4caf50' }}>
                <FaCheck /> ¡Completada!
              </div>
            ) : part.participando ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaCheck /> Participando
                </span>
                <button 
                  onClick={() => completarParticipacion(actId)}
                  disabled={isLoading}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4caf50',
                    color: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <FaCheck /> Completar
                </button>
              </div>
            ) : (
              <button 
                onClick={() => participar(actId)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaPlay /> Unirme a esta actividad
              </button>
            )}
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
          <button
            onClick={() => isQueued ? editarQueued(index) : editarExistente(a)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid var(--color-shadow)',
              background: 'var(--color-panel)',
              color: 'var(--color-text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontSize: '0.85rem'
            }}
          >
            <FaEdit /> Editar
          </button>
          <button
            onClick={() => isQueued ? quitarQueued(index) : eliminar(actId)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255, 107, 107, 0.1)',
              color: '#ff6b6b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontSize: '0.85rem'
            }}
          >
            <FaTrash /> {isQueued ? 'Quitar' : 'Eliminar'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-main)' }}>Actividades</h3>
      
      {errorMsg && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          color: '#ff6b6b',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: '1px solid rgba(255, 107, 107, 0.3)'
        }}>
          <FaTimes /> {errorMsg}
        </div>
      )}

      {/* Botón o Formulario */}
      <div style={{ marginBottom: '1.5rem' }}>
        {!showForm ? (
          <button
            onClick={() => { setShowForm(true); resetForm(); setShowForm(true); }}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--color-primary)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '500'
            }}
          >
            <FaPlus /> Nueva Actividad
          </button>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: 'var(--color-panel-solid)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--color-shadow)'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-main)' }}>
              {editingId || editingIndex !== null ? 'Editar Actividad' : 'Nueva Actividad'}
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Título */}
              <div>
                <label style={labelStyle}><FaTag /> Título de la actividad</label>
                <input
                  type="text"
                  placeholder="Ej: Sesión de meditación grupal"
                  value={nuevo.titulo}
                  onChange={e => { setErrorMsg(''); setNuevo(n => ({ ...n, titulo: e.target.value })); }}
                  style={inputStyle}
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={labelStyle}><FaAlignLeft /> Descripción</label>
                <textarea
                  placeholder="Describe los objetivos y dinámica de la actividad..."
                  value={nuevo.descripcion}
                  onChange={e => { setErrorMsg(''); setNuevo(n => ({ ...n, descripcion: e.target.value })); }}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              {/* Grid de configuración */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {/* Tipo */}
                <div>
                  <label style={labelStyle}><FaList /> Tipo</label>
                  <select
                    value={nuevo.tipo_actividad}
                    onChange={e => { setErrorMsg(''); setNuevo(n => ({ ...n, tipo_actividad: e.target.value })); }}
                    style={inputStyle}
                  >
                    <option value="tarea">📋 Tarea</option>
                    <option value="juego_grupal">🎮 Juego Grupal</option>
                    <option value="ejercicio_respiracion">🌬️ Ejercicio Respiración</option>
                    <option value="meditacion_guiada">🧘 Meditación Guiada</option>
                    <option value="reflexion">💭 Reflexión</option>
                    <option value="otro">📌 Otro</option>
                  </select>
                </div>

                {/* Fecha Inicio */}
                <div>
                  <label style={labelStyle}><FaCalendarAlt /> Fecha Inicio</label>
                  <input
                    type="date"
                    min={todayStr}
                    max={maxStr}
                    value={nuevo.fecha_inicio}
                    onChange={e => { setErrorMsg(''); setNuevo(n => ({ ...n, fecha_inicio: e.target.value })); }}
                    style={inputStyle}
                  />
                </div>

                {/* Fecha Fin */}
                <div>
                  <label style={labelStyle}><FaCalendarAlt /> Fecha Fin</label>
                  <input
                    type="date"
                    min={todayStr}
                    max={maxStr}
                    value={nuevo.fecha_fin}
                    onChange={e => { setErrorMsg(''); setNuevo(n => ({ ...n, fecha_fin: e.target.value })); }}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="submit" 
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {editingId || editingIndex !== null ? 'Guardar Cambios' : 'Crear Actividad'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid var(--color-shadow)',
                    background: 'var(--color-panel)',
                    color: 'var(--color-text-main)',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Mensaje de modo borrador */}
      {!grupoId && (
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          fontSize: '0.9rem', 
          marginBottom: '1rem',
          padding: '0.75rem',
          background: 'var(--color-panel)',
          borderRadius: '8px',
          border: '1px dashed var(--color-shadow)'
        }}>
          Estás creando un grupo. Las actividades se pueden agregar en borrador y se guardarán al crear el grupo.
        </p>
      )}

      {/* Lista de actividades */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
          Cargando actividades...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* Actividades en cola (modo crear) */}
          {queuedActivities.map((a, i) => renderActivityCard(a, i, true))}
          
          {/* Actividades existentes (modo editar) */}
          {actividades.map((a) => renderActivityCard(a, null, false))}
          
          {/* Mensaje vacío */}
          {queuedActivities.length === 0 && actividades.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-panel)',
              borderRadius: '12px',
              border: '1px dashed var(--color-shadow)'
            }}>
              No hay actividades aún. ¡Crea la primera!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
