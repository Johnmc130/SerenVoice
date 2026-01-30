import React, { useContext, useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ThemeContext } from '../../../context/themeContextDef';
import ChartWrapper from './ChartWrapper';
import { generateClasificacionInsights } from './insightsUtils';

const CLASSIFICATION_COLORS = {
  normal: '#10b981',
  leve: '#84cc16',
  moderado: '#f59e0b',
  alto: '#f97316',
  muy_alto: '#ef4444',
};

const ALL_CLASSIFICATIONS = ['normal', 'leve', 'moderado', 'alto', 'muy_alto'];

/**
 * Componente de gráfica de barras para clasificaciones de ansiedad
 * Con filtros LOCALES que no recargan la página
 */
const ClasificacionChart = memo(({ data = [] }) => {
  const { isDark } = useContext(ThemeContext);

  // Estado LOCAL de filtros
  const [filters, setFilters] = useState({
    classifications: [...ALL_CLASSIFICATIONS],
    showPercentage: true,
  });

  const handleFilterChange = useCallback((classifications) => {
    setFilters(prev => ({ ...prev, classifications }));
  }, []);

  // Filtrar datos según clasificaciones seleccionadas
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter(item => 
      filters.classifications.includes(item.clasificacion?.toLowerCase())
    );
  }, [data, filters.classifications]);

  // Generar insights
  const insights = useMemo(() => {
    return generateClasificacionInsights(data);
  }, [data]);

  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const total = data.reduce((sum, d) => sum + (d.cantidad || 0), 0);
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
            {item.payload.clasificacion?.replace('_', ' ')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Casos: {item.value}
          </p>
          {filters.showPercentage && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Porcentaje: {pct}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Componente de filtros personalizado para clasificaciones
  const filtersComponent = (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Niveles a mostrar
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handleFilterChange([...ALL_CLASSIFICATIONS])}
            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange([])}
            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Ninguno
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_CLASSIFICATIONS.map((classification) => (
          <label
            key={classification}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-xs ${
              filters.classifications.includes(classification)
                ? 'ring-2 bg-gray-100 dark:bg-gray-700'
                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            style={{
              ringColor: filters.classifications.includes(classification) ? CLASSIFICATION_COLORS[classification] : 'transparent',
            }}
          >
            <input
              type="checkbox"
              checked={filters.classifications.includes(classification)}
              onChange={() => {
                const newClassifications = filters.classifications.includes(classification)
                  ? filters.classifications.filter(c => c !== classification)
                  : [...filters.classifications, classification];
                handleFilterChange(newClassifications);
              }}
              className="sr-only"
            />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CLASSIFICATION_COLORS[classification] }}
            />
            <span className="capitalize text-gray-700 dark:text-gray-300">
              {classification.replace('_', ' ')}
            </span>
          </label>
        ))}
      </div>
      <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.showPercentage}
          onChange={(e) => setFilters(prev => ({ ...prev, showPercentage: e.target.checked }))}
          className="w-4 h-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Mostrar porcentajes
        </span>
      </label>
    </div>
  );

  if (!filteredData || filteredData.length === 0) {
    return (
      <ChartWrapper
        title="Distribución por Clasificación"
        description="Niveles de ansiedad detectados en los análisis"
        filters={filtersComponent}
        insights={['No hay datos de clasificación disponibles.']}
        helpText="Esta gráfica muestra cómo se distribuyen los análisis según el nivel de ansiedad detectado (normal, leve, moderado, alto, muy alto)."
      >
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500 dark:text-gray-400">
            No hay datos de clasificación disponibles
          </p>
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Distribución por Clasificación"
      description="Niveles de ansiedad detectados en los análisis"
      filters={filtersComponent}
      insights={insights}
      helpText="Esta gráfica muestra la distribución de análisis por nivel de severidad. Los colores van de verde (normal) a rojo (muy alto) para facilitar la identificación de casos críticos."
    >
      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          data={filteredData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="clasificacion" 
            stroke={axisColor}
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => value?.replace('_', ' ')}
          />
          <YAxis 
            stroke={axisColor}
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={() => 'Número de casos'}
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Bar 
            dataKey="cantidad" 
            radius={[8, 8, 0, 0]}
            maxBarSize={80}
          >
            {filteredData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CLASSIFICATION_COLORS[entry.clasificacion] || '#6b7280'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Leyenda de colores */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {Object.entries(CLASSIFICATION_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
              {key.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </ChartWrapper>
  );
});

ClasificacionChart.displayName = 'ClasificacionChart';

ClasificacionChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      clasificacion: PropTypes.string.isRequired,
      cantidad: PropTypes.number.isRequired,
    })
  ),
};

export default ClasificacionChart;
