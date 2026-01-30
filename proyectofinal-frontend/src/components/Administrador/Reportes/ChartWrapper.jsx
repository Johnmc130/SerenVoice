import React, { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp, Filter, Lightbulb, HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Renderiza un insight con icono apropiado según el marcador
 */
const InsightItem = ({ insight }) => {
  const isAlert = insight.startsWith('[ALERTA]');
  const isOk = insight.startsWith('[OK]');
  
  let Icon = null;
  let iconClass = 'text-amber-400 dark:text-amber-500';
  let textClass = 'text-amber-700 dark:text-amber-400';
  let cleanText = insight;
  
  if (isAlert) {
    Icon = AlertTriangle;
    iconClass = 'text-red-500 dark:text-red-400';
    textClass = 'text-red-700 dark:text-red-400';
    cleanText = insight.replace('[ALERTA] ', '');
  } else if (isOk) {
    Icon = CheckCircle;
    iconClass = 'text-green-500 dark:text-green-400';
    textClass = 'text-green-700 dark:text-green-400';
    cleanText = insight.replace('[OK] ', '');
  }
  
  return (
    <li className={`text-sm ${textClass} flex items-start gap-2`}>
      {Icon ? (
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconClass}`} />
      ) : (
        <span className="text-amber-400 dark:text-amber-500">•</span>
      )}
      <span>{cleanText}</span>
    </li>
  );
};

/**
 * Wrapper reutilizable para gráficas con filtros individuales e interpretación de datos
 * NO recarga la página al cambiar filtros - solo actualiza el estado local
 */
const ChartWrapper = memo(({
  title,
  description,
  children,
  insights = [],
  filters = null,
  helpText = null,
  loading = false,
  className = '',
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const toggleFilters = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFilters(prev => !prev);
  }, []);

  const toggleInsights = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowInsights(prev => !prev);
  }, []);

  const toggleHelp = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowHelp(prev => !prev);
  }, []);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {title}
              {helpText && (
                <button
                  type="button"
                  onClick={toggleHelp}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Mostrar ayuda"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          
          {/* Botones de control */}
          <div className="flex items-center gap-2 ml-4">
            {filters && (
              <button
                type="button"
                onClick={toggleFilters}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  showFilters
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
                aria-label={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              >
                <Filter className="w-4 h-4" />
                Filtros
                {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
            
            {insights.length > 0 && (
              <button
                type="button"
                onClick={toggleInsights}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  showInsights
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
                aria-label={showInsights ? 'Ocultar insights' : 'Mostrar insights'}
              >
                <Lightbulb className="w-4 h-4" />
                Insights
              </button>
            )}
          </div>
        </div>

        {/* Texto de ayuda expandible */}
        {showHelp && helpText && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {helpText}
            </p>
          </div>
        )}
      </div>

      {/* Panel de filtros (colapsable) */}
      {showFilters && filters && (
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          {filters}
        </div>
      )}

      {/* Contenido principal (gráfica) */}
      <div className="p-5">
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Panel de insights/interpretación (colapsable) */}
      {showInsights && insights.length > 0 && (
        <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-t border-amber-100 dark:border-amber-800/30">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                Interpretación de datos
              </h4>
              <ul className="space-y-1.5">
                {insights.map((insight, index) => (
                  <InsightItem key={index} insight={insight} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ChartWrapper.displayName = 'ChartWrapper';

ChartWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  insights: PropTypes.arrayOf(PropTypes.string),
  filters: PropTypes.node,
  helpText: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default ChartWrapper;
