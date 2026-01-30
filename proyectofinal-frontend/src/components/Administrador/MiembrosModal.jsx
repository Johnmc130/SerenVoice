import React, { useState, useMemo } from 'react';
import { FaUsers, FaTimes, FaUserMinus, FaEnvelope, FaCalendarAlt, FaSearch, FaUserShield, FaUser, FaEye, FaChevronDown } from 'react-icons/fa';

const ROLES = [
  { value: 'facilitador', label: 'Facilitador', icon: <FaUserShield />, color: '#ff6b6b' },
  { value: 'co_facilitador', label: 'Co-facilitador', icon: <FaUserShield />, color: '#ff9800' },
  { value: 'participante', label: 'Participante', icon: <FaUser />, color: 'var(--color-primary)' },
  { value: 'observador', label: 'Observador', icon: <FaEye />, color: 'var(--color-text-secondary)' }
];

/**
 * Modal para mostrar y gestionar miembros de un grupo
 */
export default function MiembrosModal({ 
  show, 
  grupo, 
  miembros = [], 
  loading, 
  onClose, 
  onEliminarMiembro,
  onCambiarRol 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('todos');
  const [editingRol, setEditingRol] = useState(null);

  // Filtrar miembros por búsqueda y rol (hooks antes del return condicional)
  const filteredMiembros = useMemo(() => {
    if (!miembros || miembros.length === 0) return [];
    return miembros.filter(m => {
      const matchSearch = searchTerm === '' || 
        `${m.nombre} ${m.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email || m.correo || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRol = filterRol === 'todos' || 
        (m.rol_grupo || m.rol || 'participante') === filterRol;
      
      return matchSearch && matchRol;
    });
  }, [miembros, searchTerm, filterRol]);

  // Estadísticas por rol
  const rolStats = useMemo(() => {
    const stats = { facilitador: 0, co_facilitador: 0, participante: 0, observador: 0 };
    if (!miembros || miembros.length === 0) return stats;
    miembros.forEach(m => {
      const rol = m.rol_grupo || m.rol || 'participante';
      if (stats[rol] !== undefined) stats[rol]++;
    });
    return stats;
  }, [miembros]);

  const getRolInfo = (rol) => ROLES.find(r => r.value === rol) || ROLES[2];

  const handleRolChange = async (miembro, nuevoRol) => {
    if (onCambiarRol) {
      await onCambiarRol(miembro.id_usuario || miembro.id, nuevoRol);
    }
    setEditingRol(null);
  };

  // Early return después de los hooks
  if (!show || !grupo) return null;

  return (
    <div 
      className="admin-modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div 
        className="admin-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: '650px', 
          maxWidth: '95vw', 
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-panel-solid)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px var(--color-shadow)',
          overflow: 'hidden'
        }}
      >
        {/* Header con gradiente */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #4ac4c6 100%)',
          padding: '1.25rem 1.5rem',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaUsers />
              Miembros - {grupo.nombre_grupo || grupo.nombre}
            </h3>
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#fff'
              }}
            >
              <FaTimes />
            </button>
          </div>
          
          {/* Barra de búsqueda y filtro */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ 
              flex: 1, 
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <FaSearch style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem'
              }} />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="todos" style={{ color: '#333' }}>Todos los roles</option>
              {ROLES.map(r => (
                <option key={r.value} value={r.value} style={{ color: '#333' }}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Body */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1rem 1.5rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              <div className="admin-loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p>Cargando miembros...</p>
            </div>
          ) : filteredMiembros.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              <FaUsers style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.25rem', color: 'var(--color-text-main)' }}>
                {searchTerm || filterRol !== 'todos' ? 'Sin resultados' : 'Sin miembros'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {searchTerm || filterRol !== 'todos' 
                  ? 'No se encontraron miembros con los filtros aplicados.' 
                  : 'Este grupo no tiene miembros registrados.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredMiembros.map((m) => {
                const rolInfo = getRolInfo(m.rol_grupo || m.rol || 'participante');
                const isEditing = editingRol === (m.id_usuario || m.id);
                
                return (
                  <div 
                    key={m.id_usuario || m.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '0.75rem 1rem',
                      background: 'var(--color-panel)',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      transition: 'box-shadow 0.2s'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: rolInfo.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      {m.foto_perfil ? (
                        <img 
                          src={m.foto_perfil} 
                          alt={m.nombre}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        (m.nombre || 'U')[0].toUpperCase()
                      )}
                    </div>
                    
                    {/* Info */}
                    <div style={{ flex: 1, marginLeft: '0.75rem', minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
                        {m.nombre} {m.apellido}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        fontSize: '0.8rem', 
                        color: 'var(--color-text-secondary)' 
                      }}>
                        <FaEnvelope style={{ fontSize: '0.7rem' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.email || m.correo}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                        {/* Selector de rol */}
                        {isEditing ? (
                          <select
                            autoFocus
                            defaultValue={m.rol_grupo || m.rol || 'participante'}
                            onChange={(e) => handleRolChange(m, e.target.value)}
                            onBlur={() => setEditingRol(null)}
                            style={{
                              padding: '0.2rem 0.4rem',
                              borderRadius: '8px',
                              border: '1px solid var(--color-primary)',
                              background: 'var(--color-panel-solid)',
                              color: 'var(--color-text-main)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            {ROLES.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => onCambiarRol && setEditingRol(m.id_usuario || m.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '12px',
                              backgroundColor: `${rolInfo.color}20`,
                              color: rolInfo.color,
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              textTransform: 'capitalize',
                              border: 'none',
                              cursor: onCambiarRol ? 'pointer' : 'default',
                              transition: 'background 0.2s'
                            }}
                            title={onCambiarRol ? 'Clic para cambiar rol' : ''}
                          >
                            {rolInfo.icon}
                            {rolInfo.label}
                            {onCambiarRol && <FaChevronDown style={{ fontSize: '0.6rem', marginLeft: '0.15rem' }} />}
                          </button>
                        )}
                        
                        {m.fecha_ingreso && (
                          <span style={{ 
                            color: 'var(--color-text-secondary)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.2rem',
                            fontSize: '0.75rem'
                          }}>
                            <FaCalendarAlt style={{ fontSize: '0.65rem' }} />
                            {new Date(m.fecha_ingreso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Botón eliminar */}
                    <button
                      onClick={() => onEliminarMiembro(m.id_usuario || m.id)}
                      title="Eliminar miembro"
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        color: '#ff6b6b',
                        border: '1px solid #ff6b6b',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        marginLeft: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#ff6b6b';
                        e.target.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#ff6b6b';
                      }}
                    >
                      <FaUserMinus />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con estadísticas */}
        <div style={{
          padding: '0.75rem 1.5rem',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-panel)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {/* Desglose por roles */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {ROLES.map(r => (
              rolStats[r.value] > 0 && (
                <span 
                  key={r.value}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: r.color,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '8px',
                    background: `${r.color}15`
                  }}
                >
                  {r.icon}
                  <strong>{rolStats[r.value]}</strong>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{r.label}</span>
                </span>
              )
            ))}
          </div>
          
          {/* Total y botón cerrar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Total: <strong style={{ color: 'var(--color-text-main)' }}>{miembros.length}</strong>
              {filteredMiembros.length !== miembros.length && (
                <span> (mostrando {filteredMiembros.length})</span>
              )}
            </span>
            <button 
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
