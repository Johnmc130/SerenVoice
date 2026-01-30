// proyectofinal-frontend/src/Pages/PaginasUsuarios/ConfiguracionNotificaciones.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificacionesService from '../../services/notificacionesService';
import { 
  FaBell, FaEnvelope, FaMobileAlt, FaClock, FaPause, FaPlay, FaSave, FaArrowLeft,
  FaCog, FaUsers, FaClipboardList, FaLightbulb, FaExclamationTriangle, FaRegClock
} from 'react-icons/fa';
import '../../styles/ConfiguracionNotificaciones.css';

const ConfiguracionNotificaciones = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preferences, setPreferences] = useState({
    // Invitaciones a grupos
    invitacion_grupo_app: true,
    invitacion_grupo_email: true,
    invitacion_grupo_push: true,
    
    // Actividades de grupo
    actividad_grupo_app: true,
    actividad_grupo_email: false,
    actividad_grupo_push: true,
    
    // Recomendaciones
    recomendacion_app: true,
    recomendacion_email: true,
    recomendacion_push: false,
    
    // Alertas críticas
    alerta_critica_app: true,
    alerta_critica_email: true,
    alerta_critica_push: true,
    
    // Recordatorios
    recordatorio_app: true,
    recordatorio_email: false,
    recordatorio_push: true,
    
    // Configuración de horario
    horario_inicio: '08:00:00',
    horario_fin: '22:00:00',
    pausar_notificaciones: false,
    fecha_pausa_hasta: null
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await notificacionesService.getPreferences();
      
      if (response.success && response.data) {
        setPreferences(prev => ({
          ...prev,
          ...response.data
        }));
      }
    } catch (error) {
      console.error('Error al cargar preferencias:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar las preferencias de notificaciones'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleTimeChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await notificacionesService.updatePreferences(preferences);
      
      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Preferencias guardadas correctamente'
        });
        
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({
          type: 'error',
          text: 'Error al guardar las preferencias'
        });
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar las preferencias'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePauseNotifications = async (horas) => {
    try {
      const response = await notificacionesService.pauseNotifications(horas);
      
      if (response.success) {
        setMessage({
          type: 'success',
          text: horas 
            ? `Notificaciones pausadas por ${horas} horas`
            : 'Notificaciones pausadas'
        });
        
        setPreferences(prev => ({
          ...prev,
          pausar_notificaciones: true
        }));
      }
    } catch (error) {
      console.error('Error al pausar notificaciones:', error);
      setMessage({
        type: 'error',
        text: 'Error al pausar notificaciones'
      });
    }
  };

  const handleResumeNotifications = async () => {
    try {
      const response = await notificacionesService.resumeNotifications();
      
      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Notificaciones reanudadas'
        });
        
        setPreferences(prev => ({
          ...prev,
          pausar_notificaciones: false,
          fecha_pausa_hasta: null
        }));
      }
    } catch (error) {
      console.error('Error al reanudar notificaciones:', error);
      setMessage({
        type: 'error',
        text: 'Error al reanudar notificaciones'
      });
    }
  };

  const renderNotificationRow = (label, type, icon) => (
    <div className="notification-row" key={type}>
      <div className="notification-label">
        <span className="notification-icon">{icon}</span>
        <span>{label}</span>
      </div>
      
      <div className="notification-channels">
        <label className="channel-toggle">
          <input
            type="checkbox"
            checked={preferences[`${type}_app`]}
            onChange={() => handleToggle(`${type}_app`)}
          />
          <span className="toggle-slider"></span>
          <FaBell className="channel-icon" />
        </label>

        <label className="channel-toggle">
          <input
            type="checkbox"
            checked={preferences[`${type}_email`]}
            onChange={() => handleToggle(`${type}_email`)}
          />
          <span className="toggle-slider"></span>
          <FaEnvelope className="channel-icon" />
        </label>

        <label className="channel-toggle">
          <input
            type="checkbox"
            checked={preferences[`${type}_push`]}
            onChange={() => handleToggle(`${type}_push`)}
          />
          <span className="toggle-slider"></span>
          <FaMobileAlt className="channel-icon" />
        </label>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando preferencias...</p>
      </div>
    );
  }

  return (
    <div className="config-notificaciones-content page-content">
      <div className="card card-xl" style={{ background: 'var(--color-panel)', borderRadius: '16px', padding: '2rem', position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Botón Volver - esquina superior izquierda */}
        <button
          onClick={() => navigate(-1)}
          className="btn-volver"
          style={{
            position: 'absolute',
            top: '1.5rem',
            left: '1.5rem',
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: "var(--color-panel-solid, var(--color-panel))",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            cursor: "pointer",
            color: "var(--color-text-main)",
            fontSize: "0.9rem",
            transition: "all 0.2s ease",
            zIndex: 10
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "var(--color-primary)";
            e.currentTarget.style.color = "white";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "var(--color-panel-solid, var(--color-panel))";
            e.currentTarget.style.color = "var(--color-text-main)";
          }}
        >
          <FaArrowLeft /> Volver
        </button>

        <div className="config-notificaciones-container" style={{ marginTop: '2rem' }}>
        <div className="config-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaCog style={{ color: 'var(--color-primary)' }} /> Configuración de Notificaciones
          </h1>
          <p>Personaliza cómo y cuándo recibes notificaciones</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Control rápido - Pausar/Reanudar */}
        <div className="quick-controls-section">
          <h2>Control Rápido</h2>
          <div className="quick-controls">
            {preferences.pausar_notificaciones ? (
              <button
                onClick={handleResumeNotifications}
                className="control-btn resume-btn"
              >
                <FaPlay /> Reanudar Notificaciones
              </button>
            ) : (
              <>
                <button
                  onClick={() => handlePauseNotifications(1)}
                  className="control-btn pause-btn"
                >
                  <FaPause /> Pausar 1 hora
                </button>
                <button
                  onClick={() => handlePauseNotifications(4)}
                  className="control-btn pause-btn"
                >
                  <FaPause /> Pausar 4 horas
                </button>
                <button
                  onClick={() => handlePauseNotifications(24)}
                  className="control-btn pause-btn"
                >
                  <FaPause /> Pausar 24 horas
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabla de preferencias */}
        <div className="preferences-section">
          <h2>Tipos de Notificaciones</h2>
          
          <div className="channel-headers">
            <div></div>
            <div className="channel-header">
              <FaBell />
              <span>App</span>
            </div>
            <div className="channel-header">
              <FaEnvelope />
              <span>Email</span>
            </div>
            <div className="channel-header">
              <FaMobileAlt />
              <span>Push</span>
            </div>
          </div>

          <div className="notifications-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {renderNotificationRow('Invitaciones a Grupos', 'invitacion_grupo', <FaUsers style={{ color: 'var(--color-primary)' }} />)}
            {renderNotificationRow('Actividades de Grupo', 'actividad_grupo', <FaClipboardList style={{ color: 'var(--color-primary)' }} />)}
            {renderNotificationRow('Recomendaciones', 'recomendacion', <FaLightbulb style={{ color: '#FFC107' }} />)}
            {renderNotificationRow('Alertas Críticas', 'alerta_critica', <FaExclamationTriangle style={{ color: '#ff6b6b' }} />)}
            {renderNotificationRow('Recordatorios', 'recordatorio', <FaRegClock style={{ color: 'var(--color-primary)' }} />)}
          </div>
        </div>

        {/* Horario de notificaciones */}
        <div className="schedule-section">
          <h2>
            <FaClock /> Horario de Notificaciones
          </h2>
          <p className="schedule-description">
            Define el horario en el que deseas recibir notificaciones. 
            Fuera de este horario, solo recibirás alertas críticas.
          </p>

          <div className="time-inputs">
            <div className="time-input-group">
              <label>Hora de inicio</label>
              <input
                type="time"
                value={preferences.horario_inicio?.substring(0, 5) || '08:00'}
                onChange={(e) => handleTimeChange('horario_inicio', e.target.value + ':00')}
                className="time-input"
              />
            </div>

            <div className="time-input-group">
              <label>Hora de fin</label>
              <input
                type="time"
                value={preferences.horario_fin?.substring(0, 5) || '22:00'}
                onChange={(e) => handleTimeChange('horario_fin', e.target.value + ':00')}
                className="time-input"
              />
            </div>
          </div>
        </div>

        {/* Botón de guardar */}
        <div className="save-section">
          <button
            onClick={handleSave}
            disabled={saving}
            className="save-btn"
          >
            {saving ? (
              <>
                <div className="btn-spinner"></div>
                Guardando...
              </>
            ) : (
              <>
                <FaSave /> Guardar Preferencias
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionNotificaciones;
