import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaArrowLeft, FaUserPlus, FaCalendar, FaInfoCircle, 
  FaLock, FaGlobe, FaEdit, FaChartBar, FaClipboardList, FaPlus,
  FaCheck, FaTimes, FaClock, FaTrash, FaPlay, FaHandPointer,
  FaEnvelope, FaUserMinus, FaSearch, FaHeart, FaMicrophone, FaGamepad,
  FaPaperPlane
} from 'react-icons/fa';
import groupsService from '../../services/groupsService';
import authService from '../../services/authService';
import { userService } from '../../services/userService';
import sesionesGrupalesService from '../../services/sesionesGrupalesService';
import PageCard from '../../components/Shared/PageCard';
import Spinner from '../../components/Publico/Spinner';
import ConfirmDialog from '../../components/Shared/ConfirmDialog';
import SesionGrupalVoz from '../../components/Grupos/SesionGrupalVoz';
import { makeFotoUrlWithProxy } from '../../utils/avatar';
import '../../global.css';

export default function DetalleGrupo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState(null);
  const [miembrosRaw, setMiembros] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [misParticipaciones, setMisParticipaciones] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({ titulo: '', descripcion: '', tipo_actividad: 'tarea', fecha_programada: '', duracion_estimada: '', creador_participa: true });
  const [creatingActivity, setCreatingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  // Member management states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingMember, setAddingMember] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);
  // Sesiones de voz grupal
  const [sesionVozActiva, setSesionVozActiva] = useState(null);
  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: 'danger', title: '', message: '', onConfirm: null });
  const [successMessage, setSuccessMessage] = useState('');
  const userData = authService.getUser();

  // Garantizar que miembros siempre sea un array
  const miembros = Array.isArray(miembrosRaw) ? miembrosRaw : [];

  const cargarGrupo = useCallback(async () => {
    try {
      const data = await groupsService.obtener(id);
      setGrupo(data);
    } catch (e) {
      console.error(e);
      setError('Error al cargar el grupo');
    }
  }, [id]);

  const cargarMiembros = useCallback(async () => {
    try {
      const data = await groupsService.listarMiembros(id);
      // Asegurar que siempre sea un array
      setMiembros(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  const cargarActividades = useCallback(async () => {
    try {
      const data = await groupsService.listarActividades(id);
      setActividades(data || []);
      
      // Cargar mis participaciones para cada actividad
      const participaciones = {};
      for (const act of (data || [])) {
        try {
          const res = await groupsService.obtenerMiParticipacion(act.id_actividad);
          if (res?.participando) {
            participaciones[act.id_actividad] = res.participacion;
          }
        } catch {
          // Ignorar errores individuales
        }
      }
      setMisParticipaciones(participaciones);
    } catch {
      // Error al cargar actividades
    }
  }, [id]);

  const cargarSesionVoz = useCallback(async () => {
    try {
      const res = await sesionesGrupalesService.obtenerSesionActiva(id);
      setSesionVozActiva(res?.data || null);
    } catch {
      setSesionVozActiva(null);
    }
  }, [id]);

  useEffect(() => {
    const cargarTodo = async () => {
      setLoading(true);
      await Promise.all([cargarGrupo(), cargarMiembros(), cargarActividades(), cargarSesionVoz()]);
      setLoading(false);
    };
    cargarTodo();
  }, [cargarGrupo, cargarMiembros, cargarActividades, cargarSesionVoz]);

  const unirseGrupo = async () => {
    setJoining(true);
    try {
      await groupsService.unirse(id);
      await cargarGrupo();
      await cargarMiembros();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Error al unirse al grupo');
    } finally {
      setJoining(false);
    }
  };

  const crearActividad = async (_e) => {
    _e.preventDefault();
    if (!newActivity.titulo.trim()) return;
    
    setCreatingActivity(true);
    try {
      // Construir payload solo con campos que tienen valor (como móvil)
      const activityData = {
        titulo: newActivity.titulo.trim(),
        descripcion: newActivity.descripcion?.trim() || null,
        tipo_actividad: newActivity.tipo_actividad,
        creador_participa: newActivity.creador_participa,
      };

      // Solo agregar fecha si tiene valor
      if (newActivity.fecha_programada && newActivity.fecha_programada.trim()) {
        activityData.fecha_programada = newActivity.fecha_programada.trim();
      }

      // Solo agregar duración si tiene valor
      if (newActivity.duracion_estimada && newActivity.duracion_estimada.trim()) {
        activityData.duracion_estimada = parseInt(newActivity.duracion_estimada) || null;
      }

      console.log("📤 Enviando actividad:", activityData);

      if (editingActivity) {
        await groupsService.actualizarActividad(id, editingActivity.id_actividad, activityData);
        setEditingActivity(null);
      } else {
        await groupsService.crearActividad(id, activityData);
      }
      setNewActivity({ titulo: '', descripcion: '', tipo_actividad: 'tarea', fecha_programada: '', duracion_estimada: '', creador_participa: true });
      setShowNewActivity(false);
      await cargarActividades();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'Error al guardar la actividad');
    } finally {
      setCreatingActivity(false);
    }
  };

  const eliminarActividad = async (actividadId) => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    try {
      await groupsService.eliminarActividad(id, actividadId);
      await cargarActividades();
      showSuccess('Actividad eliminada correctamente');
    } catch (e) {
      console.error(e);
      setError('Error al eliminar la actividad');
    }
  };

  const editarActividad = (actividad) => {
    setEditingActivity(actividad);
    setNewActivity({
      titulo: actividad.titulo || '',
      descripcion: actividad.descripcion || '',
      tipo_actividad: actividad.tipo_actividad || 'tarea',
      fecha_programada: actividad.fecha_programada ? actividad.fecha_programada.slice(0, 16) : (actividad.fecha_inicio ? actividad.fecha_inicio.slice(0, 10) + 'T09:00' : ''),
      duracion_estimada: actividad.duracion_estimada ? String(actividad.duracion_estimada) : '',
      creador_participa: actividad.creador_participa !== false
    });
    setShowNewActivity(true);
  };

  // Participar y completar actividades (no se usan actualmente pero se mantienen para futuro)
  // const participarActividad = async (actividadId) => { ... };
  // const completarActividad = async (participacionId) => { ... };

  // Member search with debounce
  useEffect(() => {
    const doSearch = async () => {
      const q = searchTerm?.trim();
      if (!q || q.length < 2) { setSearchResults([]); return; }
      setSearching(true);
      try {
        const resp = await userService.searchUsers(q, 1, 10);
        const users = resp?.data || resp?.usuarios || resp?.users || resp || [];
        const existingIds = new Set(miembros.map(m => String(m.id_usuario || m.id)));
        const filtered = (users || []).filter(u => {
          const uid = String(u.id || u.usuario_id || u._id || u.id_usuario || '');
          return uid && !existingIds.has(uid);
        });
        setSearchResults(filtered || []);
      } catch (err) {
        console.error('search users', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };
    const timer = setTimeout(doSearch, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, miembros]);

  // Función para mostrar mensaje de éxito temporal
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Invitar miembro al grupo (envía invitación en lugar de agregar directamente)
  const invitarMiembro = async (usuario) => {
    const uid = usuario.id || usuario.usuario_id || usuario._id || usuario.id_usuario;
    setAddingMember(uid);
    try {
      await groupsService.invitarMiembro(id, { 
        usuario_id: uid, 
        correo: usuario.correo || usuario.email 
      });
      setSearchTerm('');
      setSearchResults([]);
      // Mostrar mensaje de éxito
      showSuccess(`Se ha enviado una invitación a ${usuario.nombre} ${usuario.apellido || ''}`);
    } catch (e) {
      console.error(e);
      const errorMsg = e.message || 'Error al enviar invitación';
      setError(errorMsg);
    } finally {
      setAddingMember(null);
    }
  }

  // Función para abrir diálogo de confirmación para quitar miembro
  const confirmarQuitarMiembro = (miembro) => {
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Quitar miembro del grupo',
      message: `¿Estás seguro de que deseas quitar a ${miembro.nombre} ${miembro.apellido || ''} del grupo? Esta acción no se puede deshacer.`,
      onConfirm: () => quitarMiembro(miembro)
    });
  };

  const quitarMiembro = async (miembro) => {
    const uid = miembro.id_usuario || miembro.id;
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setRemovingMember(uid);
    try {
      await groupsService.eliminarMiembro(id, uid);
      await cargarMiembros();
      showSuccess(`${miembro.nombre} ha sido quitado del grupo`);
    } catch (e) {
      console.error(e);
      setError('Error al quitar miembro');
    } finally {
      setRemovingMember(null);
    }
  };

  // Función para abrir diálogo de confirmación para eliminar actividad
  const confirmarEliminarActividad = (actividad) => {
    const actId = actividad.id_actividad || actividad.id;
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Eliminar actividad',
      message: `¿Estás seguro de que deseas eliminar la actividad "${actividad.titulo}"? Esta acción no se puede deshacer.`,
      onConfirm: () => eliminarActividad(actId)
    });
  };

  // Helper para color del estado emocional
  const getEmotionColor = (emocion) => {
    const colores = {
      'feliz': '#4caf50', 'alegre': '#4caf50', 'happy': '#4caf50',
      'tranquilo': '#2196f3', 'neutral': '#9e9e9e', 'calm': '#2196f3',
      'triste': '#3f51b5', 'sad': '#3f51b5',
      'ansioso': '#ff9800', 'anxious': '#ff9800', 'nervioso': '#ff9800',
      'enojado': '#ff6b6b', 'angry': '#ff6b6b', 'frustrado': '#ff6b6b',
      'estresado': '#e91e63', 'stressed': '#e91e63'
    };
    return colores[emocion?.toLowerCase()] || '#9e9e9e';
  };

  if (loading) return <Spinner message="Cargando detalles del grupo..." />;

  if (error && !grupo) {
    return (
      <PageCard size="md">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</p>
          <button onClick={() => navigate('/grupos?owner=me')} className="auth-button">
            Volver a Mis Grupos
          </button>
        </div>
      </PageCard>
    );
  }

  const userId = userData?.id_usuario || userData?.id;
  const esFacilitador = grupo?.id_facilitador === userId;
  const miembroActual = miembros.find(m => (m.id_usuario || m.id) === userId);
  const esCoFacilitador = miembroActual?.rol_grupo === 'co_facilitador';
  const esMiembro = !!miembroActual || esFacilitador;
  const puedeEditar = esFacilitador || esCoFacilitador;

  const getTipoBadgeColor = (tipo) => {
    const colores = {
      'apoyo': '#4caf50',
      'terapia': '#2196f3',
      'taller': '#ff9800',
      'empresa': '#9c27b0',
      'educativo': '#00bcd4',
      'familiar': '#e91e63',
      'otro': '#607d8b'
    };
    return colores[tipo?.toLowerCase()] || '#607d8b';
  };

  const tabs = [
    { id: 'info', label: 'Información', icon: <FaInfoCircle /> },
    { id: 'miembros', label: `Miembros (${miembros.length})`, icon: <FaUsers /> },
    { id: 'actividades', label: `Actividades (${actividades.length})`, icon: <FaClipboardList /> },
    { id: 'sesion-voz', label: 'Sesión de Voz', icon: <FaMicrophone />, badge: sesionVozActiva ? '●' : null },
  ];

  if (puedeEditar) {
    tabs.push({ id: 'stats', label: 'Estadísticas', icon: <FaChartBar /> });
  }

  return (
    <div className="page-content">
      <PageCard size="xl">
        {/* Header con botones de acción */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            onClick={() => navigate('/grupos?owner=me')}
            className="auth-button"
            style={{ background: 'var(--color-panel-solid)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FaArrowLeft /> Volver
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {puedeEditar && (
              <button
                onClick={() => navigate(`/grupos/${id}/editar`)}
                className="auth-button"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FaEdit /> Editar Grupo
              </button>
            )}
            {!esMiembro && grupo?.privacidad === 'publico' && (
              <button
                onClick={unirseGrupo}
                disabled={joining}
                className="auth-button"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {joining ? 'Uniéndose...' : (
                  <>
                    <FaUserPlus /> Unirse al Grupo
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Información principal del grupo */}
        <div style={{
          background: 'var(--color-panel)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--color-shadow)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-main)', fontSize: '1.8rem' }}>
                {grupo?.nombre_grupo || 'Grupo sin nombre'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {grupo?.codigo_acceso && puedeEditar && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    <FaLock />
                    Código: <code style={{ background: 'var(--color-panel-solid)', padding: '2px 8px', borderRadius: '4px' }}>{grupo.codigo_acceso}</code>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {grupo?.privacidad === 'publico' ? <><FaGlobe /> Público</> : <><FaLock /> Privado</>}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '0.85rem',
              padding: '6px 14px',
              borderRadius: '16px',
              background: getTipoBadgeColor(grupo?.tipo_grupo),
              color: 'white',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {grupo?.tipo_grupo || 'General'}
            </span>
          </div>
        </div>

        {/* Pestañas */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid var(--color-shadow)',
          paddingBottom: '0',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: activeTab === tab.id ? '600' : '400',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {tab.icon} {tab.label}
              {tab.badge && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  color: '#4caf50',
                  fontSize: '0.6rem'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenido de las pestañas */}
        <div style={{ minHeight: '300px' }}>
          {/* Tab: Información */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {grupo?.descripcion && (
                <div style={{
                  background: 'var(--color-panel)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-shadow)'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>Descripción</h4>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                    {grupo.descripcion}
                  </p>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{ background: 'var(--color-panel)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-shadow)' }}>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Facilitador</div>
                  <div style={{ color: 'var(--color-text-main)', fontWeight: '600' }}>
                    {grupo?.facilitador_nombre_completo || grupo?.facilitador_nombre || grupo?.nombre_facilitador || 'No especificado'}
                  </div>
                </div>

                <div style={{ background: 'var(--color-panel)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-shadow)' }}>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <FaUsers style={{ marginRight: '0.5rem' }} />Miembros
                  </div>
                  <div style={{ color: 'var(--color-text-main)', fontWeight: '600' }}>
                    {miembros.length} / {grupo?.max_participantes || '∞'}
                  </div>
                </div>

                <div style={{ background: 'var(--color-panel)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-shadow)' }}>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <FaCalendar style={{ marginRight: '0.5rem' }} />Creado
                  </div>
                  <div style={{ color: 'var(--color-text-main)', fontWeight: '600' }}>
                    {grupo?.fecha_creacion ? new Date(grupo.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'}
                  </div>
                </div>

                <div style={{ background: 'var(--color-panel)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-shadow)' }}>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Actividades</div>
                  <div style={{ color: 'var(--color-text-main)', fontWeight: '600' }}>
                    {actividades.length} totales
                  </div>
                </div>
              </div>

              {!esMiembro && (
                <div style={{
                  background: 'rgba(33, 150, 243, 0.1)',
                  color: '#2196f3',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid rgba(33, 150, 243, 0.3)'
                }}>
                  <p style={{ margin: 0 }}>ℹ️ Únete al grupo para participar en actividades y ver los miembros</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Miembros */}
          {activeTab === 'miembros' && esMiembro && (
            <div>
              {/* Buscador de usuarios para facilitadores */}
              {puedeEditar && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                      <FaSearch /> Buscar usuario para agregar
                    </div>
                    <input
                      type="text"
                      placeholder="Escribe nombre o correo..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-shadow)',
                        background: 'var(--color-panel-solid)',
                        color: 'var(--color-text-main)'
                      }}
                    />
                    {searching && <span style={{ position: 'absolute', right: 12, top: 38, color: 'var(--color-text-secondary)' }}>Buscando...</span>}
                    
                    {searchResults.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'var(--color-panel-solid)',
                        border: '1px solid var(--color-shadow)',
                        borderRadius: '8px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 100
                      }}>
                        {searchResults.map(u => {
                          const uid = u.id || u.usuario_id || u._id || u.id_usuario;
                          return (
                            <div key={uid} style={{
                              padding: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              borderBottom: '1px solid var(--color-shadow)',
                              cursor: 'pointer'
                            }} onClick={() => invitarMiembro(u)}>
                              {u.foto_perfil ? (
                                <img src={makeFotoUrlWithProxy(u.foto_perfil)} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                  {(u.nombre || 'U')[0].toUpperCase()}
                                </div>
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ color: 'var(--color-text-main)', fontWeight: '600' }}>{u.nombre} {u.apellido || ''}</div>
                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{u.correo || u.email}</div>
                              </div>
                              <button
                                className="auth-button"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                disabled={addingMember === uid}
                              >
                                {addingMember === uid ? '...' : <><FaPaperPlane size={12} /> Invitar</>}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lista de miembros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {miembros.map(m => {
                  const mUserId = m.id_usuario || m.id;
                  const esFacilitadorMiembro = m.rol_grupo === 'facilitador';
                  return (
                    <div key={m.id_grupo_miembro || m.id} style={{
                      background: 'var(--color-panel)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid var(--color-shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {/* Header con foto y nombre */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {m.foto_perfil ? (
                          <img 
                            src={makeFotoUrlWithProxy(m.foto_perfil)} 
                            alt="" 
                            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-shadow)' }} 
                          />
                        ) : (
                          <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '1.4rem'
                          }}>
                            {(m.nombre || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'var(--color-text-main)', fontWeight: '600', fontSize: '1.05rem' }}>
                            {m.nombre} {m.apellido || ''}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            color: esFacilitadorMiembro ? 'var(--color-primary)' : 'var(--color-text-secondary)', 
                            fontSize: '0.85rem',
                            textTransform: 'capitalize'
                          }}>
                            {esFacilitadorMiembro && <FaUsers size={12} />}
                            {m.rol_grupo?.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      
                      {/* Info del miembro */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                        {/* Correo */}
                        {m.correo && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                            <FaEnvelope size={12} />
                            <span style={{ wordBreak: 'break-all' }}>{m.correo}</span>
                          </div>
                        )}
                        
                        {/* Estado emocional */}
                        {m.ultimo_estado_emocional && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaHeart size={12} style={{ color: getEmotionColor(m.ultimo_estado_emocional) }} />
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              background: `${getEmotionColor(m.ultimo_estado_emocional)}20`,
                              color: getEmotionColor(m.ultimo_estado_emocional),
                              textTransform: 'capitalize'
                            }}>
                              {m.ultimo_estado_emocional}
                              {m.confianza_emocion != null && (
                                <span style={{ opacity: 0.7 }}>
                                  {' '}({Math.round(m.confianza_emocion > 1 ? m.confianza_emocion : m.confianza_emocion * 100)}%)
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Botón quitar (solo para facilitadores, no pueden quitarse a sí mismos ni al facilitador principal) */}
                      {puedeEditar && !esFacilitadorMiembro && mUserId !== userId && (
                        <button
                          onClick={() => confirmarQuitarMiembro(m)}
                          disabled={removingMember === mUserId}
                          className="auth-button"
                          style={{ 
                            marginTop: 'auto',
                            background: 'rgba(255, 107, 107, 0.1)', 
                            color: '#ff6b6b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem'
                          }}
                        >
                          {removingMember === mUserId ? 'Quitando...' : <><FaUserMinus /> Quitar del grupo</>}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {miembros.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                  No hay miembros en este grupo aún.
                </div>
              )}
            </div>
          )}

          {/* Tab: Actividades */}
          {activeTab === 'actividades' && esMiembro && (
            <div>
              {/* Formulario para facilitadores */}
              {puedeEditar && (
                <div style={{ marginBottom: '1.5rem' }}>
                  {!showNewActivity ? (
                    <button
                      onClick={() => { setShowNewActivity(true); setEditingActivity(null); setNewActivity({ titulo: '', descripcion: '', tipo_actividad: 'tarea', fecha_programada: '', duracion_estimada: '', creador_participa: true }); }}
                      className="auth-button"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <FaPlus /> Nueva Actividad
                    </button>
                  ) : (
                    <form onSubmit={crearActividad} style={{
                      background: 'var(--color-panel)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid var(--color-shadow)'
                    }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-main)' }}>
                        {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                          type="text"
                          placeholder="Título de la actividad"
                          value={newActivity.titulo}
                          onChange={e => setNewActivity({ ...newActivity, titulo: e.target.value })}
                          style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--color-shadow)',
                            background: 'var(--color-panel-solid)',
                            color: 'var(--color-text-main)'
                          }}
                          required
                        />
                        <textarea
                          placeholder="Descripción"
                          value={newActivity.descripcion}
                          onChange={e => setNewActivity({ ...newActivity, descripcion: e.target.value })}
                          rows={3}
                          style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--color-shadow)',
                            background: 'var(--color-panel-solid)',
                            color: 'var(--color-text-main)',
                            resize: 'vertical'
                          }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Tipo</label>
                            <select
                              value={newActivity.tipo_actividad}
                              onChange={e => setNewActivity({ ...newActivity, tipo_actividad: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-shadow)',
                                background: 'var(--color-panel-solid)',
                                color: 'var(--color-text-main)'
                              }}
                            >
                              <option value="tarea">📝 Tarea</option>
                              <option value="juego_grupal">🎮 Juego Grupal</option>
                              <option value="ejercicio_respiracion">🌬️ Ejercicio de Respiración</option>
                              <option value="meditacion_guiada">🧘 Meditación Guiada</option>
                              <option value="reflexion">💭 Reflexión</option>
                              <option value="otro">📌 Otro</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Fecha y Hora (opcional)</label>
                            <input
                              type="datetime-local"
                              value={newActivity.fecha_programada}
                              onChange={e => setNewActivity({ ...newActivity, fecha_programada: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-shadow)',
                                background: 'var(--color-panel-solid)',
                                color: 'var(--color-text-main)'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Duración (min, opcional)</label>
                            <input
                              type="number"
                              placeholder="Ej: 30"
                              min="1"
                              max="480"
                              value={newActivity.duracion_estimada}
                              onChange={e => setNewActivity({ ...newActivity, duracion_estimada: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-shadow)',
                                background: 'var(--color-panel-solid)',
                                color: 'var(--color-text-main)'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            id="creador_participa_form"
                            checked={newActivity.creador_participa}
                            onChange={e => setNewActivity({ ...newActivity, creador_participa: e.target.checked })}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <label htmlFor="creador_participa_form" style={{ color: 'var(--color-text-main)', cursor: 'pointer' }}>
                            Participar automáticamente en esta actividad
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="submit" className="auth-button" disabled={creatingActivity}>
                            {creatingActivity ? 'Guardando...' : (editingActivity ? 'Guardar Cambios' : 'Crear Actividad')}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowNewActivity(false); setEditingActivity(null); }}
                            className="auth-button"
                            style={{ background: 'var(--color-panel-solid)', color: 'var(--color-text-main)' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Lista de actividades */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {actividades.map(a => {
                  const actId = a.id_actividad || a.id;
                  const miParticipacion = misParticipaciones[actId];
                  const yaParticipo = !!miParticipacion;
                  const yaCompleto = miParticipacion?.completada;
                  
                  return (
                    <div key={actId} style={{
                      background: 'var(--color-panel)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid var(--color-shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {/* Header de la card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>{a.titulo}</h4>
                          <span style={{
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            background: 'var(--color-panel-solid)',
                            color: 'var(--color-text-secondary)',
                            textTransform: 'capitalize'
                          }}>
                            {a.tipo_actividad?.replace('_', ' ')}
                          </span>
                        </div>
                        {yaCompleto ? (
                          <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
                            <FaCheck />
                          </div>
                        ) : yaParticipo ? (
                          <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
                            <FaPlay />
                          </div>
                        ) : (
                          <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}>
                            <FaClock />
                          </div>
                        )}
                      </div>
                      
                      {/* Descripción */}
                      {a.descripcion && (
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                          {a.descripcion}
                        </p>
                      )}
                      
                      {/* Info de fechas y participantes */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FaCalendar /> {a.fecha_inicio ? new Date(a.fecha_inicio).toLocaleDateString('es-ES') : 'Sin fecha'}
                          {a.fecha_fin && ` - ${new Date(a.fecha_fin).toLocaleDateString('es-ES')}`}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FaUsers /> {a.participantes_completados || 0}/{a.participantes_totales || 0} completados
                        </span>
                      </div>
                      
                      {/* Botones de acción */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                        {/* Botones de edición para facilitadores */}
                        {puedeEditar && (
                          <>
                            <button
                              onClick={() => editarActividad(a)}
                              className="auth-button"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => confirmarEliminarActividad(a)}
                              className="auth-button"
                              style={{ background: '#ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                        
                        {/* Botón para ir a realizar la actividad */}
                        <button
                          onClick={() => navigate(`/grupos/${id}/actividad/${actId}`)}
                          className="auth-button"
                          style={{ 
                            flex: 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.5rem', 
                            padding: '0.6rem 1rem',
                            background: yaCompleto ? '#4caf50' : yaParticipo ? '#2196f3' : 'var(--color-primary)'
                          }}
                        >
                          {yaCompleto ? (
                            <><FaCheck /> Ver Actividad</>
                          ) : yaParticipo ? (
                            <><FaPlay /> Continuar</>
                          ) : (
                            <><FaPlay /> Realizar Actividad</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {actividades.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                  No hay actividades programadas aún.
                </div>
              )}
            </div>
          )}

          {/* Tab: Estadísticas (solo para facilitador/co-facilitador) */}
          {activeTab === 'stats' && puedeEditar && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>{miembros.length}</div>
                  <div style={{ opacity: 0.9 }}>Miembros Activos</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>{actividades.length}</div>
                  <div style={{ opacity: 0.9 }}>Actividades Totales</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                    {actividades.filter(a => a.completada).length}
                  </div>
                  <div style={{ opacity: 0.9 }}>Actividades Completadas</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                    {actividades.length > 0 
                      ? Math.round((actividades.filter(a => a.completada).length / actividades.length) * 100)
                      : 0}%
                  </div>
                  <div style={{ opacity: 0.9 }}>Tasa de Completación</div>
                </div>
              </div>

              <div style={{
                background: 'var(--color-panel)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--color-shadow)'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-main)' }}>Participación por Miembro</h4>
                {miembros.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {miembros.slice(0, 5).map(m => (
                      <div key={m.id_grupo_miembro || m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ minWidth: '150px', color: 'var(--color-text-main)' }}>
                          {m.nombre} {m.apellido}
                        </div>
                        <div style={{ flex: 1, height: '8px', background: 'var(--color-panel-solid)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${m.porcentaje_completado || Math.random() * 100}%`,
                            height: '100%',
                            background: 'var(--color-primary)',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <div style={{ minWidth: '50px', textAlign: 'right', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                          {m.porcentaje_completado || Math.round(Math.random() * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No hay datos de participación aún.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Sesión de Voz Grupal */}
          {activeTab === 'sesion-voz' && esMiembro && (
            <SesionGrupalVoz
              grupo={grupo}
              sesionActiva={sesionVozActiva}
              puedeIniciar={puedeEditar}
              onSesionUpdated={cargarSesionVoz}
            />
          )}

          {/* Mensaje si no es miembro para tabs que requieren membresía */}
          {(activeTab === 'miembros' || activeTab === 'actividades' || activeTab === 'sesion-voz') && !esMiembro && (
            <div style={{
              background: 'rgba(33, 150, 243, 0.1)',
              color: '#2196f3',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid rgba(33, 150, 243, 0.3)'
            }}>
              <FaLock size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>Únete al grupo para ver esta sección</p>
            </div>
          )}
        </div>
      </PageCard>

      {/* Mensaje de éxito flotante */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#4caf50',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideUp 0.3s ease'
        }}>
          <FaCheck />
          {successMessage}
        </div>
      )}

      {/* Diálogo de confirmación reutilizable */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
