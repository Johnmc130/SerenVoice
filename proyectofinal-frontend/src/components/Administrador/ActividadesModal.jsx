import React from 'react';
import { FaClipboardList, FaTimes, FaTrash, FaCheck, FaClock, FaCalendarAlt, FaTag } from 'react-icons/fa';

/**
 * Modal para mostrar y gestionar actividades de un grupo
 */
export default function ActividadesModal({ 
  show, 
  grupo, 
  actividades, 
  loading, 
  onClose, 
  onEliminarActividad 
}) {
  if (!show || !grupo) return null;

  const completadas = actividades.filter(a => a.completada).length;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxWidth: '95vw', maxHeight: '75vh' }}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaClipboardList style={{ color: 'var(--color-primary)' }} />
            Actividades - {grupo.nombre_grupo || grupo.nombre}
          </h3>
          <button className="admin-modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="admin-modal-body" style={{ overflowY: 'auto' }}>
          {loading ? (
            <div className="admin-loading" style={{ padding: '2rem' }}>
              <div className="admin-loading-spinner"></div>
              <p>Cargando actividades...</p>
            </div>
          ) : actividades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              <FaClipboardList style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.25rem', color: 'var(--color-text-main)' }}>Sin actividades</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Este grupo no tiene actividades registradas.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {actividades.map((a) => (
                <div 
                  key={a.id_actividad || a.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    padding: '0.75rem 1rem',
                    background: 'var(--color-panel)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    borderLeft: `3px solid ${a.completada ? 'var(--color-success)' : 'var(--color-primary)'}`
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: a.completada ? 'rgba(76, 175, 80, 0.1)' : 'var(--nav-item-hover-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: a.completada ? 'var(--color-success)' : 'var(--color-primary)',
                    flexShrink: 0
                  }}>
                    {a.completada ? <FaCheck /> : <FaClock />}
                  </div>
                  
                  <div style={{ flex: 1, marginLeft: '0.75rem', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{a.titulo || a.nombre}</span>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        backgroundColor: a.completada ? 'rgba(76, 175, 80, 0.1)' : 'var(--nav-item-hover-bg)',
                        color: a.completada ? 'var(--color-success)' : 'var(--color-primary)'
                      }}>
                        {a.completada ? 'Completada' : 'Pendiente'}
                      </span>
                    </div>
                    
                    {a.descripcion && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0', lineHeight: 1.4 }}>
                        {a.descripcion.length > 100 ? a.descripcion.substring(0, 100) + '...' : a.descripcion}
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      {a.tipo && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FaTag style={{ fontSize: '0.65rem' }} /> {a.tipo}
                        </span>
                      )}
                      {a.fecha_creacion && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FaCalendarAlt style={{ fontSize: '0.65rem' }} />
                          {new Date(a.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {a.fecha_limite && (
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          color: new Date(a.fecha_limite) < new Date() && !a.completada ? 'var(--color-error)' : 'inherit'
                        }}>
                          <FaClock style={{ fontSize: '0.65rem' }} />
                          Límite: {new Date(a.fecha_limite).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onEliminarActividad(a.id_actividad || a.id)}
                    title="Eliminar actividad"
                    className="admin-btn"
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      color: 'var(--color-error)',
                      border: '1px solid var(--color-error)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      marginLeft: '0.5rem',
                      flexShrink: 0
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-modal-footer">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginRight: 'auto' }}>
            <strong>{completadas}</strong> de <strong>{actividades.length}</strong> completadas
          </span>
          <button className="admin-btn admin-btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
