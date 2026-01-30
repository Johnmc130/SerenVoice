import React, { useState, useEffect } from 'react';
import { juegosAPI } from '../../services/apiClient';
import { FiTarget } from 'react-icons/fi';
import { FaAward, FaChartLine, FaClock } from 'react-icons/fa';

const GameStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const data = await juegosAPI.estadisticas();
      if (data && data.success) {
        setStats(data.estadisticas || {});
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="stats-loading">Cargando estadísticas...</div>;
  }

  if (!stats) return null;

  const totalSesiones = stats.total_sesiones || 0;
  const puntuacionTotal = stats.puntuacion_total || 0;
  const tasaMejora = stats.tasa_mejora ?? 0;
  const completadas = stats.sesiones_completadas || 0;

  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-icon icon-blue"><FiTarget size={22} /></div>
        <div className="stat-content">
          <div className="stat-title">Sesiones Totales</div>
          <div className="stat-value">{totalSesiones}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon icon-yellow"><FaAward size={22} /></div>
        <div className="stat-content">
          <div className="stat-title">Puntos Totales</div>
          <div className="stat-value">{Number(puntuacionTotal).toLocaleString()}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon icon-green"><FaChartLine size={22} /></div>
        <div className="stat-content">
          <div className="stat-title">Tasa de Mejora</div>
          <div className="stat-value">{tasaMejora}%</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon icon-purple"><FaClock size={22} /></div>
        <div className="stat-content">
          <div className="stat-title">Completadas</div>
          <div className="stat-value">{completadas}/{totalSesiones}</div>
        </div>
      </div>
    </div>
  );
};

export default GameStats;
