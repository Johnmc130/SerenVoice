import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';

const ALL_EMOTIONS = ['ansiedad', 'estres', 'felicidad', 'tristeza', 'miedo', 'enojo', 'neutral', 'sorpresa'];

const EMOTION_COLORS = {
  ansiedad: '#ef4444',
  estres: '#f97316',
  felicidad: '#10b981',
  tristeza: '#6366f1',
  miedo: '#8b5cf6',
  enojo: '#dc2626',
  neutral: '#6b7280',
  sorpresa: '#f59e0b',
};

/**
 * Filtros compactos para gráficas individuales
 * Maneja estado LOCAL - no dispara recargas de página
 * 
 * @param {Object} props
 * @param {string} props.variant - Tipo de filtros a mostrar: 'emotions' | 'metric' | 'topN' | 'full'
 * @param {Object} props.value - Estado actual de los filtros
 * @param {Function} props.onChange - Callback cuando cambian los filtros (recibe nuevo estado)
 */
const ChartFilters = memo(({ 
  variant = 'emotions',
  value = {},
  onChange,
}) => {
  // Valores por defecto
  const emotions = value.emotions || ALL_EMOTIONS;
  const metric = value.metric || 'promedio';
  const topN = value.topN || 10;
  const showPercentage = value.showPercentage ?? true;
  const smoothing = value.smoothing ?? false;

  // Handlers que NO disparan efectos globales
  const handleEmotionToggle = useCallback((emotion) => {
    const newEmotions = emotions.includes(emotion)
      ? emotions.filter(e => e !== emotion)
      : [...emotions, emotion];
    
    onChange?.({ ...value, emotions: newEmotions });
  }, [emotions, value, onChange]);

  const handleSelectAll = useCallback((e) => {
    e.preventDefault();
    onChange?.({ ...value, emotions: [...ALL_EMOTIONS] });
  }, [value, onChange]);

  const handleClearAll = useCallback((e) => {
    e.preventDefault();
    onChange?.({ ...value, emotions: [] });
  }, [value, onChange]);

  const handleMetricChange = useCallback((e) => {
    onChange?.({ ...value, metric: e.target.value });
  }, [value, onChange]);

  const handleTopNChange = useCallback((e) => {
    onChange?.({ ...value, topN: Number(e.target.value) });
  }, [value, onChange]);

  const handlePercentageToggle = useCallback((e) => {
    onChange?.({ ...value, showPercentage: e.target.checked });
  }, [value, onChange]);

  const handleSmoothingToggle = useCallback((e) => {
    onChange?.({ ...value, smoothing: e.target.checked });
  }, [value, onChange]);

  // Renderizar solo los filtros necesarios según variant
  const renderEmotionsFilter = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Emociones a mostrar
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Todas
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Ninguna
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ALL_EMOTIONS.map((emotion) => (
          <label
            key={emotion}
            className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs ${
              emotions.includes(emotion)
                ? 'bg-gray-100 dark:bg-gray-700 ring-2'
                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            style={{
              ringColor: emotions.includes(emotion) ? EMOTION_COLORS[emotion] : 'transparent',
            }}
          >
            <input
              type="checkbox"
              checked={emotions.includes(emotion)}
              onChange={() => handleEmotionToggle(emotion)}
              className="sr-only"
            />
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: EMOTION_COLORS[emotion] }}
            />
            <span className="capitalize text-gray-700 dark:text-gray-300 truncate">
              {emotion}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderMetricFilter = () => (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        Métrica
      </label>
      <select
        value={metric}
        onChange={handleMetricChange}
        className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="promedio">Promedio</option>
        <option value="maximo">Máximo</option>
        <option value="minimo">Mínimo</option>
        <option value="cantidad">Cantidad</option>
      </select>
    </div>
  );

  const renderTopNFilter = () => (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        Cantidad a mostrar
      </label>
      <select
        value={topN}
        onChange={handleTopNChange}
        className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value={5}>Top 5</option>
        <option value={10}>Top 10</option>
        <option value={15}>Top 15</option>
        <option value={20}>Top 20</option>
      </select>
    </div>
  );

  const renderToggleFilters = () => (
    <div className="flex flex-wrap gap-4">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showPercentage}
          onChange={handlePercentageToggle}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Mostrar porcentajes
        </span>
      </label>
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={smoothing}
          onChange={handleSmoothingToggle}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Suavizado (media móvil)
        </span>
      </label>
    </div>
  );

  // Variantes de renderizado
  switch (variant) {
    case 'emotions':
      return renderEmotionsFilter();
    
    case 'metric':
      return (
        <div className="flex gap-4">
          {renderMetricFilter()}
          {renderToggleFilters()}
        </div>
      );
    
    case 'topN':
      return (
        <div className="flex gap-4 items-end">
          {renderTopNFilter()}
        </div>
      );
    
    case 'tendencias':
      return (
        <div className="space-y-4">
          {renderEmotionsFilter()}
          <div className="flex flex-wrap gap-4 items-end">
            {renderMetricFilter()}
            {renderToggleFilters()}
          </div>
        </div>
      );
    
    case 'distribucion':
      return (
        <div className="space-y-4">
          {renderEmotionsFilter()}
          <div className="flex gap-4">
            {renderToggleFilters()}
          </div>
        </div>
      );
    
    case 'full':
    default:
      return (
        <div className="space-y-4">
          {renderEmotionsFilter()}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {renderMetricFilter()}
            {renderTopNFilter()}
          </div>
          {renderToggleFilters()}
        </div>
      );
  }
});

ChartFilters.displayName = 'ChartFilters';

ChartFilters.propTypes = {
  variant: PropTypes.oneOf(['emotions', 'metric', 'topN', 'tendencias', 'distribucion', 'full']),
  value: PropTypes.shape({
    emotions: PropTypes.arrayOf(PropTypes.string),
    metric: PropTypes.string,
    topN: PropTypes.number,
    showPercentage: PropTypes.bool,
    smoothing: PropTypes.bool,
  }),
  onChange: PropTypes.func,
};

export default ChartFilters;

export { ALL_EMOTIONS, EMOTION_COLORS };
