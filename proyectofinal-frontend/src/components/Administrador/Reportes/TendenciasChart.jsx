import React, { useContext, useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThemeContext } from '../../../context/themeContextDef';
import ChartWrapper from './ChartWrapper';
import ChartFilters, { EMOTION_COLORS, ALL_EMOTIONS } from './ChartFilters';
import { generateTendenciasInsights } from './insightsUtils';

/**
 * Componente de gráfica de líneas para mostrar tendencias emocionales
 * Con filtros LOCALES que no recargan la página
 */
const TendenciasChart = memo(({ data = [], periodo = '30d' }) => {
  const { isDark } = useContext(ThemeContext);

  // Estado LOCAL de filtros - cambios aquí NO recargan la página
  const [filters, setFilters] = useState({
    emotions: [...ALL_EMOTIONS],
    smoothing: false,
    showPercentage: true,
  });

  // Handler para cambios de filtro - solo actualiza estado local
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Procesar datos según filtros (sin llamada a API)
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let result = [...data];
    
    // Aplicar suavizado si está activo
    if (filters.smoothing && result.length > 2) {
      result = result.map((item, index, arr) => {
        if (index === 0 || index === arr.length - 1) return item;
        
        const smoothed = { ...item };
        filters.emotions.forEach(emotion => {
          if (typeof item[emotion] === 'number') {
            const prev = arr[index - 1][emotion] || 0;
            const curr = item[emotion] || 0;
            const next = arr[index + 1][emotion] || 0;
            smoothed[emotion] = (prev + curr + next) / 3;
          }
        });
        return smoothed;
      });
    }
    
    return result;
  }, [data, filters.smoothing, filters.emotions]);

  // Generar insights basados en datos actuales
  const insights = useMemo(() => {
    return generateTendenciasInsights(data, filters.emotions);
  }, [data, filters.emotions]);

  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {filters.showPercentage ? `${entry.value.toFixed(1)}%` : entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const periodoTexto = periodo === '7d' ? '7 días' : periodo === '30d' ? '30 días' : '90 días';

  // Componente de filtros para pasar al wrapper
  const filtersComponent = (
    <ChartFilters
      variant="tendencias"
      value={filters}
      onChange={handleFilterChange}
    />
  );

  // Contenido cuando no hay datos
  if (!processedData || processedData.length === 0) {
    return (
      <ChartWrapper
        title={`Tendencias Emocionales - Últimos ${periodoTexto}`}
        description="Evolución de las emociones detectadas en el tiempo"
        filters={filtersComponent}
        insights={['No hay datos disponibles para el periodo seleccionado.']}
        helpText="Esta gráfica muestra cómo evolucionan las diferentes emociones detectadas a lo largo del tiempo. Usa los filtros para enfocarte en emociones específicas."
      >
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500 dark:text-gray-400">
            No hay datos disponibles para el periodo seleccionado
          </p>
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title={`Tendencias Emocionales - Últimos ${periodoTexto}`}
      description="Evolución de las emociones detectadas en el tiempo"
      filters={filtersComponent}
      insights={insights}
      helpText="Esta gráfica muestra cómo evolucionan las diferentes emociones detectadas a lo largo del tiempo. Usa los filtros para enfocarte en emociones específicas o activar el suavizado para ver tendencias más claras."
    >
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="fecha" 
            stroke={axisColor}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke={axisColor}
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            tickFormatter={val => filters.showPercentage ? `${val}%` : val}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          {filters.emotions.map((emotion) => (
            <Line
              key={emotion}
              type={filters.smoothing ? 'monotone' : 'linear'}
              dataKey={emotion}
              name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              stroke={EMOTION_COLORS[emotion]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});

TendenciasChart.displayName = 'TendenciasChart';

TendenciasChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      fecha: PropTypes.string.isRequired,
      estres: PropTypes.number,
      ansiedad: PropTypes.number,
      felicidad: PropTypes.number,
      tristeza: PropTypes.number,
      miedo: PropTypes.number,
      enojo: PropTypes.number,
      neutral: PropTypes.number,
      sorpresa: PropTypes.number,
    })
  ),
  periodo: PropTypes.oneOf(['7d', '30d', '90d']),
};

export default TendenciasChart;
