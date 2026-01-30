import React from 'react';
import { FaChartBar, FaTimes, FaUsers, FaClipboardList, FaLock, FaGlobe, FaUserTie, FaKey, FaCalendarAlt } from 'react-icons/fa';

/**
 * Modal para mostrar estadísticas de un grupo
 */
export default function GrupoStatsModal({ show, grupo, onClose }) {
  if (!show || !grupo) return null;

  const tasaCompletitud = grupo.total_actividades > 0 
    ? ((grupo.actividades_completadas / grupo.total_actividades) * 100).toFixed(1) 
    : 0;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxWidth: '95vw', maxHeight: '75vh' }}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaChartBar style={{ color: 'var(--color-primary)' }} />
            Estadísticas - {grupo.nombre_grupo || grupo.nombre}
          </h3>
          <button className="admin-modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="admin-modal-body" style={{ overflowY: 'auto' }}>
          {/* Cards de estadísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--color-panel)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                <FaUsers style={{ color: 'var(--color-primary)' }} /> Miembros
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{grupo.total_miembros || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{grupo.miembros_activos || 0} activos</div>
            </div>
            <div style={{ background: 'var(--color-panel)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                <FaClipboardList style={{ color: 'var(--color-primary)' }} /> Actividades
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{grupo.total_actividades || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{grupo.actividades_completadas || 0} completadas</div>
            </div>
          </div>

          {/* Barra de progreso */}
          {grupo.total_actividades > 0 && (
            <div style={{ background: 'var(--color-panel)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Progreso</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)' }}>{tasaCompletitud}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-shadow)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${tasaCompletitud}%`, height: '100%', backgroundColor: 'var(--color-success)', borderRadius: '4px', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Detalles */}
          <div style={{ background: 'var(--color-panel)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
              {grupo.privacidad === 'privado' ? <FaLock style={{ color: 'var(--color-text-secondary)' }} /> : <FaGlobe style={{ color: 'var(--color-success)' }} />}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Privacidad</div>
                <div style={{ fontWeight: 500, textTransform: 'capitalize', color: 'var(--color-text-main)' }}>{grupo.privacidad || 'N/A'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <FaUserTie style={{ color: 'var(--color-primary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Facilitador</div>
                <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{grupo.facilitador_nombre} {grupo.facilitador_apellido}</div>
                {grupo.facilitador_correo && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{grupo.facilitador_correo}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: grupo.fecha_creacion ? '1px solid var(--color-border)' : 'none' }}>
              <FaKey style={{ color: 'var(--color-text-secondary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Código de acceso</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-main)', letterSpacing: '0.05em' }}>{grupo.codigo_acceso || 'N/A'}</div>
              </div>
            </div>
            {grupo.fecha_creacion && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.75rem' }}>
                <FaCalendarAlt style={{ color: 'var(--color-text-secondary)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Creado</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{new Date(grupo.fecha_creacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
