// proyectofinal-frontend/src/Pages/PaginasUsuarios/Notificaciones.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import notificacionesService from '../../services/notificacionesService';
import PageCard from '../../components/Shared/PageCard';
import ConfirmDialog from '../../components/Shared/ConfirmDialog';
import {
  FaBell,
  FaCheckDouble,
  FaTrash,
  FaArchive,
  FaCog,
  FaFilter,
  FaArrowLeft
} from 'react-icons/fa';
import '../../styles/Notificaciones.css';

const Notificaciones = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notificaciones, setNotificaciones] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedTab, setSelectedTab] = useState('todas'); // todas, urgentes
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: 'danger', title: '', message: '', onConfirm: null });

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      if (selectedTab === 'urgentes') {
        response = await notificacionesService.getUrgentNotifications();
      } else {
        const onlyUnread = filter === 'unread';
        response = await notificacionesService.getNotificaciones(100, onlyUnread);
      }

      let notifs = response.data || [];

      // Aplicar filtro adicional si es necesario
      if (filter === 'read') {
        notifs = notifs.filter(n => n.leida);
      }

      setNotificaciones(notifs);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedTab]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.leida) {
        await notificacionesService.markAsRead(notif.id_notificacion);
        // Actualizar localmente
        setNotificaciones(prev =>
          prev.map(n =>
            n.id_notificacion === notif.id_notificacion
              ? { ...n, leida: 1 }
              : n
          )
        );
      }

      if (notif.url_accion) {
        navigate(notif.url_accion);
      }
    } catch (error) {
      console.error('Error al procesar notificación:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificacionesService.markAllAsRead();
      setNotificaciones(prev =>
        prev.map(n => ({ ...n, leida: 1 }))
      );
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleArchive = async (e, id) => {
    e.stopPropagation();
    try {
      await notificacionesService.archiveNotificacion(id);
      setNotificaciones(prev =>
        prev.filter(n => n.id_notificacion !== id)
      );
    } catch (error) {
      console.error('Error al archivar:', error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Eliminar notificación',
      message: `¿Estás seguro de eliminar esta notificación?`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await notificacionesService.deleteNotificacion(id);
          setNotificaciones(prev =>
            prev.filter(n => n.id_notificacion !== id)
          );
        } catch (error) {
          console.error('Error al eliminar:', error);
        }
      }
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente':
        return '#ff4757';
      case 'alta':
        return '#ffa502';
      case 'media':
        return '#3742fa';
      case 'baja':
        return '#747d8c';
      default:
        return '#747d8c';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'urgente':
        return 'Urgente';
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Media';
      case 'baja':
        return 'Baja';
      default:
        return '';
    }
  };

  const filteredNotifications = notificaciones;
  const unreadCount = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="notificaciones-content page-content">
        <PageCard size="xl">
        {/* Botón Volver */}
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

        <div className="notificaciones-header">
          <div className="header-title">
            <h1>📬 Notificaciones</h1>
            <p className="subtitle">
              {unreadCount > 0 
                ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
                : 'Todas las notificaciones están al día'}
            </p>
          </div>

          <button
            onClick={() => navigate('/notificaciones/configuracion')}
            className="config-btn"
          >
            <FaCog /> Configurar
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab ${selectedTab === 'todas' ? 'active' : ''}`}
            onClick={() => setSelectedTab('todas')}
          >
            <FaBell /> Todas
            {selectedTab === 'todas' && unreadCount > 0 && (
              <span className="tab-badge">{unreadCount}</span>
            )}
          </button>
          <button
            className={`tab ${selectedTab === 'urgentes' ? 'active' : ''}`}
            onClick={() => setSelectedTab('urgentes')}
          >
            🚨 Urgentes
          </button>
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todas
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              <FaFilter /> No leídas
            </button>
            <button
              className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              Leídas
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="mark-all-btn"
            >
              <FaCheckDouble /> Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Cargando notificaciones...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <FaBell className="empty-icon" />
            <h3>No hay notificaciones</h3>
            <p>
              {filter === 'unread'
                ? 'No tienes notificaciones sin leer'
                : filter === 'read'
                ? 'No tienes notificaciones leídas'
                : selectedTab === 'urgentes'
                ? 'No tienes notificaciones urgentes'
                : 'Aún no has recibido ninguna notificación'}
            </p>
          </div>
        ) : (
          <div className="notifications-grid">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id_notificacion}
                className={`notif-card ${notif.leida ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="notif-header">
                  <div className="notif-icon-large">{notif.icono || '🔔'}</div>
                  <div className="notif-meta">
                    <span
                      className="priority-badge"
                      style={{ background: getPriorityColor(notif.prioridad) }}
                    >
                      {getPriorityLabel(notif.prioridad)}
                    </span>
                    <span className="notif-time">
                      {notif.tiempo_transcurrido}
                    </span>
                  </div>
                </div>

                <div className="notif-body">
                  <h3>{notif.titulo}</h3>
                  <p>{notif.mensaje}</p>
                </div>

                <div className="notif-actions">
                  {!notif.leida && (
                    <div className="unread-dot"></div>
                  )}
                  
                  <button
                    onClick={(e) => handleArchive(e, notif.id_notificacion)}
                    className="action-btn archive-btn"
                    title="Archivar"
                  >
                    <FaArchive />
                  </button>

                  <button
                    onClick={(e) => handleDelete(e, notif.id_notificacion)}
                    className="action-btn delete-btn"
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </PageCard>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Notificaciones;
