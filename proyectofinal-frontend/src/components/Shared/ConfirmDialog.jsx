// proyectofinal-frontend/src/components/Shared/ConfirmDialog.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FaExclamationTriangle, FaTrash, FaCheck, FaTimes, FaQuestion } from 'react-icons/fa';
import '../../global.css';

/**
 * ConfirmDialog - Componente de diálogo de confirmación reutilizable
 * 
 * Uso para eliminaciones y acciones importantes que requieren confirmación.
 * 
 * @example
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Eliminar usuario"
 *   message="¿Estás seguro de que deseas eliminar este usuario?"
 *   confirmText="Eliminar"
 *   type="danger"
 * />
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Confirmar acción?',
  message = '¿Estás seguro de que deseas continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger', // 'danger', 'warning', 'info', 'success'
  loading = false,
  icon = null,
  children = null
}) => {
  if (!isOpen) return null;

  // Configuración de colores según tipo
  const typeConfig = {
    danger: {
      color: '#ff6b6b',
      bgColor: 'rgba(255, 107, 107, 0.1)',
      borderColor: 'rgba(255, 107, 107, 0.3)',
      icon: <FaTrash />,
      buttonBg: '#ff6b6b'
    },
    warning: {
      color: '#ff9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
      borderColor: 'rgba(255, 152, 0, 0.3)',
      icon: <FaExclamationTriangle />,
      buttonBg: '#ff9800'
    },
    info: {
      color: '#2196f3',
      bgColor: 'rgba(33, 150, 243, 0.1)',
      borderColor: 'rgba(33, 150, 243, 0.3)',
      icon: <FaQuestion />,
      buttonBg: '#2196f3'
    },
    success: {
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
      borderColor: 'rgba(76, 175, 80, 0.3)',
      icon: <FaCheck />,
      buttonBg: '#4caf50'
    }
  };

  const config = typeConfig[type] || typeConfig.danger;
  const displayIcon = icon || config.icon;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm();
  };

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="confirm-dialog-content"
        style={{
          background: 'var(--color-panel-solid)',
          borderRadius: '16px',
          padding: '0',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideIn 0.2s ease-out',
          overflow: 'hidden'
        }}
      >
        {/* Icono superior */}
        <div
          style={{
            background: config.bgColor,
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            borderBottom: `1px solid ${config.borderColor}`
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: config.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem'
            }}
          >
            {displayIcon}
          </div>
        </div>

        {/* Contenido */}
        <div style={{ padding: '1.5rem' }}>
          <h3
            style={{
              margin: '0 0 0.75rem 0',
              color: 'var(--color-text-main)',
              fontSize: '1.25rem',
              fontWeight: '600',
              textAlign: 'center'
            }}
          >
            {title}
          </h3>
          
          <p
            style={{
              margin: '0 0 1rem 0',
              color: 'var(--color-text-secondary)',
              fontSize: '0.95rem',
              textAlign: 'center',
              lineHeight: '1.5'
            }}
          >
            {message}
          </p>

          {/* Contenido adicional opcional */}
          {children && (
            <div style={{ marginBottom: '1rem' }}>
              {children}
            </div>
          )}
        </div>

        {/* Botones */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            padding: '0 1.5rem 1.5rem',
            justifyContent: 'center'
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              border: '1px solid var(--color-shadow)',
              borderRadius: '8px',
              background: 'var(--color-panel)',
              color: 'var(--color-text-main)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.6 : 1
            }}
          >
            <FaTimes /> {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              background: config.buttonBg,
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <span className="spinner-small" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Procesando...
              </>
            ) : (
              <>
                {displayIcon} {confirmText}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(['danger', 'warning', 'info', 'success']),
  loading: PropTypes.bool,
  icon: PropTypes.node,
  children: PropTypes.node
};

export default ConfirmDialog;
