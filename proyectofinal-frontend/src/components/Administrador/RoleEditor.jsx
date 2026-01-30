import React from 'react';
import { FaUserShield } from 'react-icons/fa';

export default function RoleEditor({ user, onClose, assignRole, removeRole, currentUserId }) {
  const availableRoles = ["admin", "usuario"];

  if (!user) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto', padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Gestionar Roles de {user.nombre} {user.apellido}</h3>

        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Roles actuales:</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {user.roles && user.roles.length > 0 ? (
              user.roles.map(role => (
                <div key={role} style={{ padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.9rem', backgroundColor: role === 'admin' ? '#ff980020' : role === 'profesional' ? '#2196f320' : '#4caf5020', color: role === 'admin' ? '#ff9800' : role === 'profesional' ? '#2196f3' : '#4caf50', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {role}
                  <button
                    onClick={() => {
                      if (user.id === currentUserId) return;
                      removeRole(user.id, role);
                      onClose();
                    }}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: user.id === currentUserId ? 'not-allowed' : 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}
                    title="Eliminar rol"
                    disabled={user.id === currentUserId}
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Sin roles asignados</span>
            )}
          </div>

          <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Agregar rol:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {availableRoles.map(role => {
              const hasRole = user.roles?.includes(role);
              return (
                <button
                  key={role}
                  onClick={() => {
                    if (!hasRole && user.id !== currentUserId) assignRole(user.id, role);
                    onClose();
                  }}
                  disabled={hasRole || user.id === currentUserId}
                  style={{ padding: '0.75rem', backgroundColor: hasRole ? 'var(--color-background-secondary)' : 'var(--color-primary)', color: hasRole ? 'var(--color-text-secondary)' : '#fff', cursor: hasRole || user.id === currentUserId ? 'not-allowed' : 'pointer', opacity: hasRole || user.id === currentUserId ? 0.6 : 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FaUserShield /> {role.charAt(0).toUpperCase() + role.slice(1)} {hasRole && ' (ya asignado)'}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={onClose} style={{ marginTop: '1.5rem', width: '100%' }}>Cerrar</button>
      </div>
    </div>
  );
}
