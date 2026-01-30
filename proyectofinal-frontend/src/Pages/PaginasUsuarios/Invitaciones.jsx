import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaEnvelope, FaCheck, FaTimes, FaClock, FaUsers,
  FaCalendarAlt, FaInfoCircle, FaUser, FaArrowLeft,
  FaHistory, FaInbox
} from 'react-icons/fa';
import groupsService from '../../services/groupsService';
import authService from '../../services/authService';
import PageCard from '../../components/Shared/PageCard';
import Spinner from '../../components/Publico/Spinner';
import ConfirmDialog from '../../components/Shared/ConfirmDialog';
import '../../global.css';

/**
 * Página de Invitaciones - Permite a los usuarios ver y gestionar
 * las invitaciones a grupos que han recibido.
 */
export default function Invitaciones() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pendientes');
  const [invitaciones, setInvitaciones] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    type: 'warning', 
    title: '', 
    message: '', 
    onConfirm: null 
  });
  
  const userData = authService.getUser();

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const cargarInvitaciones = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await groupsService.obtenerMisInvitaciones();
      setInvitaciones(data || []);
    } catch (e) {
      console.error('Error al cargar invitaciones:', e);
      setError('Error al cargar las invitaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarHistorial = useCallback(async () => {
    try {
      const data = await groupsService.obtenerHistorialInvitaciones();
      setHistorial(data || []);
    } catch (e) {
      console.error('Error al cargar historial:', e);
    }
  }, []);

  // Usar el ID del usuario para evitar loops infinitos
  // (userData es un objeto nuevo en cada render)
  const userId = userData?.id_usuario;

  useEffect(() => {
    if (userId) {
      cargarInvitaciones();
      cargarHistorial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const aceptarInvitacion = async (invitacion) => {
    setProcessingId(invitacion.id_invitacion);
    try {
      await groupsService.aceptarInvitacion(invitacion.id_invitacion);
      showSuccess(`¡Te has unido al grupo "${invitacion.nombre_grupo}"!`);
      // Recargar invitaciones
      await cargarInvitaciones();
      await cargarHistorial();
    } catch (e) {
      console.error('Error al aceptar invitación:', e);
      setError(e.message || 'Error al aceptar la invitación');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmarRechazarInvitacion = (invitacion) => {
    setConfirmDialog({
      isOpen: true,
      type: 'warning',
      title: 'Rechazar invitación',
      message: `¿Estás seguro de que deseas rechazar la invitación al grupo "${invitacion.nombre_grupo}"?`,
      onConfirm: () => rechazarInvitacion(invitacion)
    });
  };

  const rechazarInvitacion = async (invitacion) => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setProcessingId(invitacion.id_invitacion);
    try {
      await groupsService.rechazarInvitacion(invitacion.id_invitacion);
      showSuccess('Invitación rechazada');
      await cargarInvitaciones();
      await cargarHistorial();
    } catch (e) {
      console.error('Error al rechazar invitación:', e);
      setError(e.message || 'Error al rechazar la invitación');
    } finally {
      setProcessingId(null);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'pendiente': '#ff9800',
      'aceptada': '#4caf50',
      'rechazada': '#ff6b6b',
      'expirada': '#9e9e9e',
      'cancelada': '#795548'
    };
    return colores[estado?.toLowerCase()] || '#9e9e9e';
  };

  const getEstadoIcon = (estado) => {
    const iconos = {
      'pendiente': <FaClock />,
      'aceptada': <FaCheck />,
      'rechazada': <FaTimes />,
      'expirada': <FaClock />,
      'cancelada': <FaTimes />
    };
    return iconos[estado?.toLowerCase()] || <FaInfoCircle />;
  };

  if (!userData) {
    return (
      <PageCard size="md">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ff6b6b' }}>Debes iniciar sesión para ver tus invitaciones</p>
        </div>
      </PageCard>
    );
  }

  if (loading) {
    return <Spinner message="Cargando invitaciones..." />;
  }

  return (
    <div className="page-content">
      <PageCard size="xl">
        {/* Botón Volver - esquina superior */}
        <button
          onClick={() => navigate(-1)}
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
          alignItems: 'center', 
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              color: 'var(--color-text-main)', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <FaEnvelope style={{ color: 'var(--color-primary)' }} />
              Mis Invitaciones
            </h2>
            <p style={{ 
              color: 'var(--color-text-secondary)', 
              margin: '0.5rem 0 0 0',
              fontSize: '0.9rem'
            }}>
              Gestiona las invitaciones a grupos que has recibido
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            color: '#ff6b6b',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 107, 107, 0.3)'
          }}>
            {error}
            <button 
              onClick={() => setError('')}
              style={{ 
                marginLeft: '1rem', 
                background: 'none', 
                border: 'none', 
                color: '#ff6b6b',
                cursor: 'pointer'
              }}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--color-shadow)',
          paddingBottom: '0.5rem'
        }}>
          <button
            onClick={() => setActiveTab('pendientes')}
            className="auth-button"
            style={{
              background: activeTab === 'pendientes' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'pendientes' ? 'white' : 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaInbox />
            Pendientes
            {invitaciones.length > 0 && (
              <span style={{
                background: activeTab === 'pendientes' ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)',
                color: activeTab === 'pendientes' ? 'white' : 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem'
              }}>
                {invitaciones.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('historial')}
            className="auth-button"
            style={{
              background: activeTab === 'historial' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'historial' ? 'white' : 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaHistory />
            Historial
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'pendientes' && (
          <div>
            {invitaciones.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                color: 'var(--color-text-secondary)'
              }}>
                <FaInbox size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>
                  No tienes invitaciones pendientes
                </h3>
                <p style={{ margin: 0 }}>
                  Cuando alguien te invite a un grupo, aparecerá aquí
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {invitaciones.map(inv => (
                  <div
                    key={inv.id_invitacion}
                    style={{
                      background: 'var(--color-panel)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid var(--color-shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}
                  >
                    {/* Info del grupo */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        <FaUsers size={24} />
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ 
                          margin: '0 0 0.5rem 0', 
                          color: 'var(--color-text-main)',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/grupos/${inv.id_grupo}`)}
                        >
                          {inv.nombre_grupo}
                        </h3>
                        
                        {inv.descripcion_grupo && (
                          <p style={{ 
                            margin: '0 0 0.5rem 0', 
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.9rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {inv.descripcion_grupo}
                          </p>
                        )}
                        
                        {/* Info del invitador */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.85rem'
                        }}>
                          <FaUser size={12} />
                          <span>
                            Invitado por <strong style={{ color: 'var(--color-text-main)' }}>
                              {inv.nombre_invitador} {inv.apellido_invitador || ''}
                            </strong>
                          </span>
                        </div>
                        
                        {/* Mensaje de la invitación */}
                        {inv.mensaje && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            background: 'rgba(var(--color-primary-rgb), 0.1)',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            color: 'var(--color-text-main)',
                            fontStyle: 'italic'
                          }}>
                            "{inv.mensaje}"
                          </div>
                        )}
                        
                        {/* Fecha */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          marginTop: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.8rem'
                        }}>
                          <FaCalendarAlt size={12} />
                          <span>Recibida el {formatFecha(inv.fecha_invitacion)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      <button
                        onClick={() => aceptarInvitacion(inv)}
                        disabled={processingId === inv.id_invitacion}
                        className="auth-button"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          background: '#4caf50'
                        }}
                      >
                        {processingId === inv.id_invitacion ? (
                          'Procesando...'
                        ) : (
                          <><FaCheck /> Aceptar</>
                        )}
                      </button>
                      
                      <button
                        onClick={() => confirmarRechazarInvitacion(inv)}
                        disabled={processingId === inv.id_invitacion}
                        className="auth-button"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          background: 'rgba(255, 107, 107, 0.1)',
                          color: '#ff6b6b'
                        }}
                      >
                        <FaTimes /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <div>
            {historial.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                color: 'var(--color-text-secondary)'
              }}>
                <FaHistory size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>
                  No hay historial de invitaciones
                </h3>
                <p style={{ margin: 0 }}>
                  Las invitaciones aceptadas, rechazadas o expiradas aparecerán aquí
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {historial.map(inv => (
                  <div
                    key={inv.id_invitacion}
                    style={{
                      background: 'var(--color-panel)',
                      borderRadius: '8px',
                      padding: '1rem',
                      border: '1px solid var(--color-shadow)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      opacity: 0.8
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      background: `${getEstadoColor(inv.estado)}20`,
                      color: getEstadoColor(inv.estado),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getEstadoIcon(inv.estado)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        color: 'var(--color-text-main)',
                        fontWeight: '500'
                      }}>
                        {inv.nombre_grupo}
                      </div>
                      <div style={{ 
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>{formatFecha(inv.fecha_respuesta || inv.fecha_invitacion)}</span>
                      </div>
                    </div>
                    
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      background: `${getEstadoColor(inv.estado)}20`,
                      color: getEstadoColor(inv.estado),
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {inv.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

      {/* Diálogo de confirmación */}
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
