import React from 'react';
import { FaMicrophone, FaChartLine, FaHeartbeat, FaRegClock, FaUsers, FaBell } from 'react-icons/fa';

const StatItem = ({ icon, label, value, percent }) => (
  <div className="stat-item card inner-card">
    <div className="stat-top">
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
    {typeof percent === 'number' && (
      <div className="stat-bar">
        <div className="stat-bar-fill" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
    )}
  </div>
);

const StatsModal = ({ user, estadisticas, onClose }) => {
  const est = estadisticas || {};
  const stress = Number(est.promedioEstres || 0);
  const anxiety = Number(est.promedioAnsiedad || 0);

  return (
    <div className="stats-modal-backdrop" onClick={onClose}>
      <div className="card stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stats-header">
          <h3>Estadísticas — {user?.nombre} {user?.apellido}</h3>
          <button className="close-btn" onClick={onClose}>Cerrar</button>
        </div>

        {!estadisticas ? (
          <p>Cargando estadísticas...</p>
        ) : (
          <div className="stats-grid">
            <StatItem icon={<FaMicrophone />} label="Total de Audios" value={est.totalAudios || 0} />
            <StatItem icon={<FaChartLine />} label="Total de Análisis" value={est.totalAnalisis || 0} />
            <StatItem icon={<FaHeartbeat />} label="Promedio Estrés" value={`${stress.toFixed(2)}%`} percent={stress} />
            <StatItem icon={<FaHeartbeat />} label="Promedio Ansiedad" value={`${anxiety.toFixed(2)}%`} percent={anxiety} />
            <StatItem icon={<FaRegClock />} label="Último Análisis" value={est.ultimoAnalisis || 'N/A'} />
            <StatItem icon={<FaUsers />} label="Grupos" value={est.totalGrupos || 0} />
            <StatItem icon={<FaBell />} label="Alertas Activas" value={est.alertasActivas || 0} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsModal;
