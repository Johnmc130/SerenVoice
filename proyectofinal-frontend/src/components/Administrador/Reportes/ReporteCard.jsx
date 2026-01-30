import React from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Card especializado para mostrar métricas de reportes
 * @param {Object} props - Props del componente
 * @param {string} props.title - Título de la métrica
 * @param {string|number} props.value - Valor principal a mostrar
 * @param {number} props.change - Cambio porcentual (positivo o negativo)
 * @param {React.Component} props.icon - Icono de Lucide React
 * @param {string} props.trend - Tendencia: 'up' | 'down' | 'neutral'
 * @param {string} props.subtitle - Subtítulo opcional
 */
const ReporteCard = ({ 
  title, 
  value, 
  change = null, 
  icon: Icon, 
  trend = 'neutral',
  subtitle = null 
}) => {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getTrendBgColor = () => {
    if (trend === 'up') return 'bg-green-100 dark:bg-green-900/30';
    if (trend === 'down') return 'bg-red-100 dark:bg-red-900/30';
    return 'bg-gray-100 dark:bg-gray-700';
  };

  const getIconBgColor = () => {
    if (trend === 'up') return 'bg-green-500';
    if (trend === 'down') return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </h3>
            {change !== null && (
              <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                {trend === 'up' && <TrendingUp className="w-4 h-4" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-semibold">
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-full ${getIconBgColor()}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      
      {change !== null && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden`}>
              <div 
                className={`h-full ${getTrendBgColor()} transition-all duration-500`}
                style={{ width: `${Math.min(Math.abs(change), 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReporteCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.number,
  icon: PropTypes.elementType,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  subtitle: PropTypes.string,
};

export default ReporteCard;
