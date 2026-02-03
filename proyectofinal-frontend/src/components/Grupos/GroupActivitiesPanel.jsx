import React, { useEffect, useState, useCallback } from 'react';
import { FaTag, FaAlignLeft, FaList, FaCalendarAlt, FaPlus, FaCheck, FaPlay, FaEdit, FaTrash, FaTimes, FaChartBar, FaUsers, FaClock, FaUserCheck } from 'react-icons/fa';
import groupsService from '../../services/groupsService';

export default function GroupActivitiesPanel({ grupoId, onQueueAdd, onQueueUpdate, queuedActivities = [] }){
  const [actividades, setActividades] = useState([]);
  const [nuevo, setNuevo] = useState({ 
    titulo:'', 
    descripcion:'', 
    tipo_actividad:'tarea', 
    fecha_programada:'',
    duracion_estimada: '',
    creador_participa: true 
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [participaciones, setParticipaciones] = useState({});
  const [loadingParticipacion, setLoadingParticipacion] = useState({});
  const [showResultadoModal, setShowResultadoModal] = useState(false);
  const [resultadoGrupal, setResultadoGrupal] = useState(null);
  const [loadingResultado, setLoadingResultado] = useState(false);

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
      if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
        const d = new Date(str);
        return d.toLocaleString('es-ES', { 
          dateStyle: 'short', 
          timeStyle: 'short' 
        });
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
  const toDateTimeInputString = (d) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const normalizeForDateInput = (v) => {
    if (!v) return '';
    try { 
      const s = v.toString(); 
      // Si ya está en formato datetime-local
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0,16);
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10) + 'T09:00';
      const d = new Date(s); 
      if (!isNaN(d)) return toDateTimeInputString(d);
      return '';
    } catch { return '' }
  };
  const todayDate = new Date();
  const todayStr = toDateInputString(new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()));
  const maxDate = new Date(todayDate);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxStr = toDateInputString(new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()));

  // Validación flexible como móvil: solo título obligatorio
  const validateDates = (obj) => {
    const titulo = (obj.titulo || obj.title || '').toString().trim();
    if (!titulo) return { ok:false, msg: 'El título es obligatorio' };

    // Validar fecha si se proporciona
    const fechaProgramada = obj.fecha_programada || null;
    if (fechaProgramada) {
      const parse = (s) => { if (!s) return null; try { return new Date(s); } catch { return null; } };
      const df = parse(fechaProgramada);
      if (df && !isNaN(df)) {
        const today = new Date();
        today.setHours(0,0,0,0);
        if (df < today) return { ok:false, msg: 'La fecha no puede ser anterior a hoy' };
      }
    }

    return { ok:true };
  };

  const resetForm = () => {
    setNuevo({ 
      titulo:'', 
      descripcion:'', 
      tipo_actividad:'tarea', 
      fecha_programada:'',
      duracion_estimada: '',
      creador_participa: true 
    });
    setEditingIndex(null);
    setEditingId(null);
    setShowForm(false);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validateDates(nuevo);
    if (!v.ok) { setErrorMsg(v.msg); return; }

    // Construir payload solo con campos que tienen valor (como móvil)
    const activityData = {
      titulo: nuevo.titulo.trim(),
      descripcion: nuevo.descripcion?.trim() || null,
      tipo_actividad: nuevo.tipo_actividad,
      creador_participa: nuevo.creador_participa,
    };

    // Solo agregar fecha si tiene valor
    if (nuevo.fecha_programada && nuevo.fecha_programada.trim()) {
      activityData.fecha_programada = nuevo.fecha_programada.trim();
    }

    // Solo agregar duración si tiene valor
    if (nuevo.duracion_estimada && nuevo.duracion_estimada.trim()) {
      activityData.duracion_estimada = parseInt(nuevo.duracion_estimada) || null;
    }

    if (!grupoId) {
      // Modo borrador para crear grupo
      if (onQueueAdd) {
        const nowIso = new Date().toISOString();
        const queued = { ...activityData, fecha_creacion: nowIso, fechaCreacion: nowIso };
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
      console.log("📤 Enviando actividad:", activityData);
      if (editingId) {
        await groupsService.actualizarActividad(grupoId, editingId, activityData);
      } else {
        await groupsService.crearActividad(grupoId, activityData);
      }
      resetForm();
      cargar();
    }catch(e){
      console.error('[GroupActivitiesPanel] crear', e);
      setErrorMsg(e.response?.data?.error || e.message || 'Error al crear actividad');
    }
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
      fecha_programada: normalizeForDateInput(a.fecha_programada || a.fechaProgramada),
      duracion_estimada: a.duracion_estimada ? String(a.duracion_estimada) : '',
      creador_participa: a.creador_participa !== false,
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
      fecha_programada: normalizeForDateInput(a.fecha_programada || a.fechaProgramada || a.fecha_inicio),
      duracion_estimada: a.duracion_estimada ? String(a.duracion_estimada) : '',
      creador_participa: a.creador_participa !== false,
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

  // Ver resultado grupal
  const verResultadoGrupal = async (actividadId) => {
    setLoadingResultado(true);
    try {
      const res = await groupsService.obtenerResultadoGrupal(actividadId);
      if (res.success && res.data) {
        setResultadoGrupal(res.data);
        setShowResultadoModal(true);
      } else {
        setErrorMsg(res.error || 'No hay resultados disponibles aún');
      }
    } catch (e) {
      console.error('[GroupActivitiesPanel] verResultado', e);
      setErrorMsg('Resultado no disponible aún. Espera a que todos completen.');
    } finally {
      setLoadingResultado(false);
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
    const descripcion = a.descripcion || a.description || '';
    const tipo = a.tipo_actividad || a.type || 'tarea';
    const fechaProgramada = formatDate(a.fecha_programada || a.fechaProgramada || a.fecha_inicio);
    const duracion = a.duracion_estimada ? `${a.duracion_estimada} min` : '—';
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
            {descripcion && (
              <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{descripcion}</p>
            )}
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

        {/* Fecha y Duración */}
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
            <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FaCalendarAlt style={{ fontSize: '0.75rem' }} /> Programada:
            </span>
            <div style={{ color: 'var(--color-text-main)', fontWeight: '500' }}>{fechaProgramada}</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FaClock style={{ fontSize: '0.75rem' }} /> Duración:
            </span>
            <div style={{ color: 'var(--color-text-main)', fontWeight: '500' }}>{duracion}</div>
          </div>
        </div>

        {/* Participación (solo para actividades existentes) */}
        {!isQueued && grupoId && (
          <div style={{ padding: '0.5rem 0', borderTop: '1px solid var(--color-shadow)' }}>
            {part.completada ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaCheck /> ¡Completada!
                </span>
                <button 
                  onClick={() => verResultadoGrupal(actId)}
                  disabled={loadingResultado}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: 'white',
                    cursor: loadingResultado ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <FaChartBar /> Ver Resultados
                </button>
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
                <label style={labelStyle}><FaAlignLeft /> Descripción (opcional)</label>
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
                    <option value="reflexion">💭 Reflexión</option>
                    <option value="otro">📌 Otro</option>
                  </select>
                </div>

                {/* Fecha Programada */}
                <div>
                  <label style={labelStyle}><FaCalendarAlt /> Fecha y Hora (opcional)</label>
                  <input
                    type="datetime-local"
                    min={todayStr + 'T00:00'}
                    max={maxStr + 'T23:59'}
                    value={nuevo.fecha_programada}
                    onChange={e => { setErrorMsg(''); setNuevo(n => ({ ...n, fecha_programada: e.target.value })); }}
                    style={inputStyle}
                  />
                </div>

                {/* Duración Estimada */}
                <div>
                  <label style={labelStyle}><FaClock /> Duración (min, opcional)</label>
                  <input
                    type="number"
                    placeholder="Ej: 30"
                    min="1"
                    max="480"
                    value={nuevo.duracion_estimada}
                    onChange={e => { setErrorMsg(''); setNuevo(n => ({ ...n, duracion_estimada: e.target.value })); }}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Creador participa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="creador_participa"
                  checked={nuevo.creador_participa}
                  onChange={e => setNuevo(n => ({ ...n, creador_participa: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="creador_participa" style={{ 
                  color: 'var(--color-text-main)', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaUserCheck /> Participar automáticamente en esta actividad
                </label>
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

      {/* Modal de Resultado Grupal */}
      {showResultadoModal && resultadoGrupal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--color-panel-solid)',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)' }}>
                <FaChartBar style={{ color: 'var(--color-primary)' }} /> Resultado Grupal
              </h3>
              <button 
                onClick={() => setShowResultadoModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1.25rem'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Emoción Dominante */}
            <div style={{
              background: 'var(--color-panel)',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                {resultadoGrupal.emocion_dominante === 'felicidad' ? '😊' :
                 resultadoGrupal.emocion_dominante === 'tristeza' ? '😢' :
                 resultadoGrupal.emocion_dominante === 'ansiedad' ? '😰' :
                 resultadoGrupal.emocion_dominante === 'calma' ? '😌' :
                 resultadoGrupal.emocion_dominante === 'enojo' ? '😠' : '🎭'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-main)' }}>
                {resultadoGrupal.emocion_dominante || 'Sin determinar'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Emoción Dominante del Grupo
              </div>
            </div>

            {/* Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'rgba(244, 67, 54, 0.1)',
                padding: '1rem',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f44336' }}>
                  {Number(resultadoGrupal.nivel_estres_promedio || 0).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Estrés Promedio</div>
              </div>
              <div style={{
                background: 'rgba(255, 152, 0, 0.1)',
                padding: '1rem',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff9800' }}>
                  {Number(resultadoGrupal.nivel_ansiedad_promedio || 0).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Ansiedad Promedio</div>
              </div>
            </div>

            {/* Participantes */}
            <div style={{
              background: 'var(--color-panel)',
              padding: '1rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <FaUsers style={{ color: 'var(--color-primary)' }} />
              <span style={{ color: 'var(--color-text-main)' }}>
                {resultadoGrupal.total_participantes || 0} participantes completaron
              </span>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => setShowResultadoModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '1rem',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--color-primary)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
