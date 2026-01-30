import React from 'react';
import { makeFotoUrlWithProxy } from '../../utils/avatar';
import { FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaMapMarkerAlt, FaCalendar, FaChartLine, FaUserShield, FaUserTimes } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

export default function UserCard({ user, isDark, currentUserId, onViewStats, onEditRoles, onToggleStatus }) {
  return (
    <div
      key={user.id}
      className={`card user-card ${user.id === currentUserId ? 'me' : ''}`}
      style={{
        padding: '1.5rem',
        opacity: user.activo ? 1 : 0.6,
        position: 'relative'
      }}
    >
      {user.id === currentUserId && (
        <div className="me-badge">TÚ</div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {(() => {
            const fotoUrl = makeFotoUrlWithProxy(user.foto_perfil);
            return fotoUrl ? (
              <img
                src={fotoUrl}
                alt={`${user.nombre} ${user.apellido}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <FaUser size={35} color="var(--color-primary)" />
            );
          })()}
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user.nombre} {user.apellido}
            {user.auth_provider === 'google' && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#fff',
                color: isDark ? '#fff' : '#333',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: '500',
                border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #ddd'
              }}>
                <FcGoogle size={12} /> Google
              </span>
            )}
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <FaEnvelope size={12} /> {user.email}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        {user.telefono && (
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}><FaPhone size={10} style={{ marginRight: '0.25rem' }} />Teléfono</div>
            <div style={{ fontWeight: '500' }}>{user.telefono}</div>
          </div>
        )}

        {user.fecha_nacimiento && (
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}><FaBirthdayCake size={10} style={{ marginRight: '0.25rem' }} />F. Nacimiento</div>
            <div style={{ fontWeight: '500' }}>{new Date(user.fecha_nacimiento).toLocaleDateString()}</div>
          </div>
        )}

        {user.genero && (
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}><FaUser size={10} style={{ marginRight: '0.25rem' }} />Género</div>
            <div style={{ fontWeight: '500' }}>{user.genero}</div>
          </div>
        )}

        {user.pais && (
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}><FaMapMarkerAlt size={10} style={{ marginRight: '0.25rem' }} />País</div>
            <div style={{ fontWeight: '500' }}>{user.pais}</div>
          </div>
        )}

        {user.ultimoAcceso && (
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}><FaCalendar size={10} style={{ marginRight: '0.25rem' }} />Último acceso</div>
            <div style={{ fontWeight: '500', fontSize: '0.8rem' }}>{user.ultimoAcceso}</div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Roles:</strong>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {user.roles && user.roles.length > 0 ? (
            user.roles.map(role => (
              <span key={role} className={`role-badge role-${role}`}>{role}</span>
            ))
          ) : (
            <span className="role-empty">Sin rol asignado</span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: user.activo ? '#4caf5020' : '#ff6b6b20', color: user.activo ? '#4caf50' : '#ff6b6b', fontWeight: '500' }}>{user.activo ? '✓ Activo' : '✗ Inactivo'}</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <button onClick={() => onViewStats(user)} title="Ver estadísticas" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><FaChartLine /> Stats</button>

        <button onClick={() => onEditRoles(user)} title={user.id === currentUserId ? 'No puedes editar tus propios roles' : 'Editar roles'} disabled={user.id === currentUserId} style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: user.id === currentUserId ? 0.5 : 1, cursor: user.id === currentUserId ? 'not-allowed' : 'pointer' }}><FaUserShield /> Roles</button>

        <button
          onClick={() => onToggleStatus(user.id, user.activo)}
          title={user.id === currentUserId ? 'No puedes desactivar tu propia cuenta' : (user.activo ? 'Desactivar usuario' : 'Activar usuario')}
          disabled={user.id === currentUserId}
          style={{
            fontSize: '0.85rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: user.activo ? '#ff6b6b' : '#4caf50',
            color: '#fff',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: user.id === currentUserId ? 0.6 : 1,
            cursor: user.id === currentUserId ? 'not-allowed' : 'pointer'
          }}
        ><FaUserTimes /> {user.activo ? 'Desactivar' : 'Activar'}</button>
      </div>
    </div>
  );
}
