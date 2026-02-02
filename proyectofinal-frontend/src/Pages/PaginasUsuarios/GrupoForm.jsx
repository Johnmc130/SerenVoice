import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import groupsService from '../../services/groupsService';
import authService from '../../services/authService';
import GroupMembersPanel from '../../components/Grupos/GroupMembersPanel';
import GroupActivitiesPanel from '../../components/Grupos/GroupActivitiesPanel';
import { 
  FaUserFriends, 
  FaSave, 
  FaArrowLeft, 
  FaInfoCircle, 
  FaClipboardList, 
  FaUsers,
  FaTag,
  FaAlignLeft,
  FaKey,
  FaLock,
  FaGlobe,
  FaSpinner,
  FaCheckCircle,
  FaPlusCircle,
  FaUser
} from 'react-icons/fa';
import PageCard from '../../components/Shared/PageCard';
import '../../global.css';

export default function GrupoForm(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    nombre: '', 
    descripcion: '', 
    codigo_acceso: '', 
    tipo_grupo: 'apoyo', 
    privacidad: 'privado', 
    max_participantes: '' 
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [currentId, setCurrentId] = useState(id && id !== 'nuevo' ? id : null);
  const [queuedMembers, setQueuedMembers] = useState([]);
  const [queuedActivities, setQueuedActivities] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const userData = authService.getUser();
  const isEditing = id && id !== 'nuevo';

  // Memoized handlers for queue operations
  const handleQueueAddActivity = useCallback((a) => setQueuedActivities(q => [...q, a]), []);
  const handleQueueUpdateActivities = useCallback((newQ) => setQueuedActivities(newQ), []);
  const handleQueueAddMember = useCallback((m) => setQueuedMembers(q => [...q, m]), []);
  const handleQueueUpdateMembers = useCallback((newQ) => setQueuedMembers(newQ), []);

  useEffect(() => {
    if (isEditing){
      setLoadingData(true);
      (async ()=>{
        try{
          const data = await groupsService.obtener(id);
          setForm({
            nombre: data.nombre || data.name || data.nombre_grupo || '',
            descripcion: data.descripcion || data.description || '',
            codigo_acceso: data.codigo_acceso || '',
            tipo_grupo: data.tipo_grupo || 'apoyo',
            privacidad: data.privacidad || 'privado',
            max_participantes: data.max_participantes || ''
          });
          setCurrentId(id);
        }catch(e){
          console.error(e);
          setErrorMessage('Error al cargar los datos del grupo');
        } finally {
          setLoadingData(false);
        }
      })();
    }
  }, [id, isEditing]);

  const handleChange = (e) => setForm(f=>({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try{
      const payload = {
        nombre_grupo: form.nombre,
        descripcion: form.descripcion,
        codigo_acceso: form.codigo_acceso || undefined,
        tipo_grupo: form.tipo_grupo,
        privacidad: form.privacidad,
        max_participantes: form.max_participantes || undefined
      };
      if (isEditing) {
        await groupsService.actualizar(id, payload);
        setSuccessMessage('Grupo actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // Crear grupo y luego agregar miembros/actividades en cola
        const nowIso = new Date().toISOString();
        payload.fecha_creacion = nowIso;
        payload.fechaCreacion = nowIso;
        const res = await groupsService.crear(payload);
        const createdId = res && (res.id_grupo || res.id || res._id);
        if (createdId) {
          // Enviar invitaciones a los miembros en cola (no agregar directamente)
          try {
            for (const m of queuedMembers) {
              await groupsService.invitarMiembro(createdId, m);
            }
            for (const a of queuedActivities) {
              await groupsService.crearActividad(createdId, a);
            }
          } catch(e) { console.error('Error al enviar invitaciones o crear actividades:', e); }
          
          setQueuedMembers([]);
          setQueuedActivities([]);
          setCurrentId(createdId);
          navigate(`/grupos/${createdId}`);
          return;
        }
        navigate('/grupos');
      }
    }catch(e){
      console.error(e);
      setErrorMessage('Error al guardar el grupo');
    }
    finally{setLoading(false)}
  };

  const getTipoColor = (tipo) => {
    const colores = {
      'apoyo': '#4caf50',
      'terapia': '#2196f3',
      'taller': '#ff9800',
      'empresa': '#9c27b0',
      'educativo': '#00bcd4',
      'familiar': '#e91e63',
      'otro': '#607d8b'
    };
    return colores[tipo] || '#607d8b';
  };

  const tabs = [
    { id: 'info', label: 'Información', icon: <FaInfoCircle /> },
    { id: 'actividades', label: `Actividades${queuedActivities.length > 0 ? ` (${queuedActivities.length})` : ''}`, icon: <FaClipboardList /> },
    { id: 'miembros', label: `Miembros${queuedMembers.length > 0 ? ` (${queuedMembers.length})` : ''}`, icon: <FaUsers /> },
  ];

  // Redirigir si no hay usuario autenticado
  if (!userData) return <Navigate to="/login" replace />;

  return (
    <div className="grupo-form-content page-content">
      <PageCard size="xl">
        {/* Botón Volver - encima del título */}
        <button
          onClick={() => navigate('/grupos?owner=me')}
          className="btn-volver"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: "var(--color-panel)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            cursor: "pointer",
            color: "var(--color-text-main)",
            fontSize: "0.9rem",
            marginBottom: "1rem",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "var(--color-primary)";
            e.currentTarget.style.color = "white";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "var(--color-panel)";
            e.currentTarget.style.color = "var(--color-text-main)";
          }}
        >
          <FaArrowLeft /> Volver
        </button>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isEditing ? <FaUserFriends /> : <FaPlusCircle />}
              {isEditing ? 'Editar Grupo' : 'Crear Nuevo Grupo'}
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              {isEditing ? 'Modifica la información del grupo' : 'Configura los detalles de tu nuevo grupo'}
            </p>
          </div>

          {/* Botón Guardar en header */}
          <button 
            type="button" 
            disabled={loading} 
            onClick={submit} 
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <>
                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> 
                Guardando...
              </>
            ) : (
              <>
                <FaSave /> {isEditing ? 'Guardar Cambios' : 'Crear Grupo'}
              </>
            )}
          </button>
        </div>

        {/* Mensajes de éxito/error */}
        {successMessage && (
          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            color: '#4caf50',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            <FaCheckCircle /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            color: '#ff6b6b',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid rgba(255, 107, 107, 0.3)'
          }}>
            ✕ {errorMessage}
          </div>
        )}

        {loadingData ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            <FaSpinner className="spin" size={32} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
            <p>Cargando datos del grupo...</p>
          </div>
        ) : (
          <>
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
                  type="button"
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
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Contenido de las pestañas */}
            <div style={{ minHeight: '400px' }}>
              {/* Tab: Información */}
              {activeTab === 'info' && (
                <div style={{
                  background: 'var(--color-panel)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid var(--color-shadow)'
                }}>
                  <form onSubmit={submit}>
                    {/* Nombre del grupo */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        color: 'var(--color-text-main)',
                        fontWeight: '500',
                        fontSize: '0.95rem'
                      }}>
                        <FaTag style={{ color: 'var(--color-primary)' }} /> Nombre del grupo *
                      </label>
                      <input 
                        name="nombre" 
                        value={form.nombre} 
                        onChange={handleChange} 
                        required 
                        placeholder="Ej: Grupo de apoyo emocional"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid var(--color-shadow)',
                          background: 'var(--color-panel-solid)',
                          color: 'var(--color-text-main)',
                          fontSize: '0.95rem',
                          transition: 'border-color 0.2s ease'
                        }}
                      />
                    </div>

                    {/* Descripción */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        color: 'var(--color-text-main)',
                        fontWeight: '500',
                        fontSize: '0.95rem'
                      }}>
                        <FaAlignLeft style={{ color: 'var(--color-primary)' }} /> Descripción
                      </label>
                      <textarea 
                        name="descripcion" 
                        value={form.descripcion} 
                        onChange={handleChange} 
                        placeholder="Describe el propósito y objetivos del grupo..."
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid var(--color-shadow)',
                          background: 'var(--color-panel-solid)',
                          color: 'var(--color-text-main)',
                          fontSize: '0.95rem',
                          resize: 'vertical',
                          minHeight: '100px'
                        }}
                      />
                    </div>

                    {/* Fila de configuración */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '1rem',
                      marginBottom: '1.25rem'
                    }}>
                      {/* Tipo de grupo */}
                      <div>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          color: 'var(--color-text-main)',
                          fontWeight: '500',
                          fontSize: '0.95rem'
                        }}>
                          <FaTag style={{ color: getTipoColor(form.tipo_grupo) }} /> Tipo de grupo
                        </label>
                        <select 
                          name="tipo_grupo" 
                          value={form.tipo_grupo} 
                          onChange={handleChange}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--color-shadow)',
                            background: 'var(--color-panel-solid)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.95rem',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="terapia">💆 Terapia</option>
                          <option value="apoyo">🤝 Apoyo</option>
                          <option value="social">👥 Social</option>
                        </select>
                      </div>

                      {/* Privacidad */}
                      <div>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          color: 'var(--color-text-main)',
                          fontWeight: '500',
                          fontSize: '0.95rem'
                        }}>
                          {form.privacidad === 'publico' ? 
                            <FaGlobe style={{ color: '#4caf50' }} /> : 
                            <FaLock style={{ color: '#ff9800' }} />
                          } Privacidad
                        </label>
                        <select 
                          name="privacidad" 
                          value={form.privacidad} 
                          onChange={handleChange}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--color-shadow)',
                            background: 'var(--color-panel-solid)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.95rem',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="privado">🔒 Privado</option>
                          <option value="publico">🌐 Público</option>
                        </select>
                      </div>

                      {/* Máximo de participantes */}
                      <div>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          color: 'var(--color-text-main)',
                          fontWeight: '500',
                          fontSize: '0.95rem'
                        }}>
                          <FaUsers style={{ color: 'var(--color-primary)' }} /> Máx. participantes
                        </label>
                        <input 
                          type="number" 
                          name="max_participantes" 
                          value={form.max_participantes} 
                          onChange={handleChange} 
                          min={1}
                          placeholder="Sin límite"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--color-shadow)',
                            background: 'var(--color-panel-solid)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    </div>

                    {/* Código de acceso (solo si es privado) */}
                    {form.privacidad !== 'publico' && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          color: 'var(--color-text-main)',
                          fontWeight: '500',
                          fontSize: '0.95rem'
                        }}>
                          <FaKey style={{ color: '#ff9800' }} /> Código de acceso
                        </label>
                        <input 
                          name="codigo_acceso" 
                          value={form.codigo_acceso} 
                          onChange={handleChange} 
                          placeholder="Se generará automáticamente si se deja vacío"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--color-shadow)',
                            background: 'var(--color-panel-solid)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.95rem'
                          }}
                        />
                        <p style={{ 
                          margin: '0.5rem 0 0', 
                          fontSize: '0.8rem', 
                          color: 'var(--color-text-secondary)' 
                        }}>
                          Los miembros necesitarán este código para unirse al grupo.
                        </p>
                      </div>
                    )}

                    {/* Facilitador (solo lectura) */}
                    <div>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        color: 'var(--color-text-main)',
                        fontWeight: '500',
                        fontSize: '0.95rem'
                      }}>
                        <FaUser style={{ color: 'var(--color-primary)' }} /> Facilitador
                      </label>
                      <input 
                        value={userData ? (userData.nombre || userData.name || userData.usuario || '') : ''} 
                        readOnly 
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid var(--color-shadow)',
                          background: 'var(--color-panel)',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.95rem',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                  </form>
                </div>
              )}

              {/* Tab: Actividades */}
              {activeTab === 'actividades' && (
                <div style={{
                  background: 'var(--color-panel)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid var(--color-shadow)'
                }}>
                  <GroupActivitiesPanel 
                    grupoId={currentId} 
                    onQueueAdd={handleQueueAddActivity} 
                    onQueueUpdate={handleQueueUpdateActivities} 
                    queuedActivities={queuedActivities} 
                  />
                </div>
              )}

              {/* Tab: Miembros */}
              {activeTab === 'miembros' && (
                <div style={{
                  background: 'var(--color-panel)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid var(--color-shadow)'
                }}>
                  <GroupMembersPanel 
                    grupoId={currentId} 
                    onQueueAdd={handleQueueAddMember} 
                    queuedMembers={queuedMembers} 
                    onQueueUpdate={handleQueueUpdateMembers} 
                  />
                </div>
              )}
            </div>

            {/* Botones de acción en footer */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--color-shadow)'
            }}>
              <button 
                type="button" 
                onClick={() => navigate('/grupos?owner=me')} 
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  border: '1px solid var(--color-shadow)',
                  background: 'var(--color-panel-solid)',
                  color: 'var(--color-text-main)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaArrowLeft /> Cancelar
              </button>
              <button 
                type="button" 
                disabled={loading} 
                onClick={submit} 
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? (
                  <>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> 
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaSave /> {isEditing ? 'Guardar Cambios' : 'Crear Grupo'}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </PageCard>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
