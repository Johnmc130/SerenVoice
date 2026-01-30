import React, { useContext, useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ThemeContext } from '../../../context/themeContextDef';
import ChartWrapper from './ChartWrapper';
import { generateEfectividadInsights } from './insightsUtils';

/**
 * Componente de gráfica de barras para efectividad de recomendaciones
 * Con filtros LOCALES que no recargan la página
 */
const EfectividadRecomendacionesChart = memo(({ data = [] }) => {
  const { isDark } = useContext(ThemeContext);

  // Estado LOCAL de filtros
  const [filters, setFilters] = useState({
    showEffectiveness: true,
    sortBy: 'generadas',
    minData: 0,
  });

  const handleSortChange = useCallback((e) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value }));
  }, []);

  const handleMinDataChange = useCallback((e) => {
    setFilters(prev => ({ ...prev, minData: Number(e.target.value) }));
  }, []);

  // Procesar datos según filtros
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let result = data
      .filter(item => (item.generadas || 0) >= filters.minData)
      .map(item => ({
        ...item,
        efectividad: item.generadas > 0 ? ((item.utiles / item.generadas) * 100).toFixed(1) : 0
      }));
    
    if (filters.sortBy === 'efectividad') {
      result.sort((a, b) => parseFloat(b.efectividad) - parseFloat(a.efectividad));
    } else if (filters.sortBy === 'utiles') {
      result.sort((a, b) => (b.utiles || 0) - (a.utiles || 0));
    } else {
      result.sort((a, b) => (b.generadas || 0) - (a.generadas || 0));
    }
    
    return result;
  }, [data, filters.sortBy, filters.minData]);

  // Generar insights
  const insights = useMemo(() => {
    return generateEfectividadInsights(data);
  }, [data]);

  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
          {filters.showEffectiveness && item && (
            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              Efectividad: {item.efectividad}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Componente de filtros
  const filtersComponent = (
    <div className="flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Ordenar por
        </label>
        <select
          value={filters.sortBy}
          onChange={handleSortChange}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        >
          <option value="generadas">Mayor cantidad generadas</option>
          <option value="utiles">Mayor cantidad útiles</option>
          <option value="efectividad">Mayor efectividad</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Mínimo de datos
        </label>
        <select
          value={filters.minData}
          onChange={handleMinDataChange}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        >
          <option value={0}>Sin mínimo</option>
          <option value={5}>Al menos 5</option>
          <option value={10}>Al menos 10</option>
          <option value={20}>Al menos 20</option>
        </select>
      </div>
      <label className="inline-flex items-center gap-2 cursor-pointer pb-1">
        <input
          type="checkbox"
          checked={filters.showEffectiveness}
          onChange={(e) => setFilters(prev => ({ ...prev, showEffectiveness: e.target.checked }))}
          className="w-4 h-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Mostrar % efectividad
        </span>
      </label>
    </div>
  );

  if (!processedData || processedData.length === 0) {
    return (
      <ChartWrapper
        title="Efectividad de Recomendaciones"
        description="Comparación entre recomendaciones generadas y útiles"
        filters={filtersComponent}
        insights={['No hay datos de recomendaciones disponibles.']}
        helpText="Esta gráfica compara cuántas recomendaciones se generaron vs. cuántas fueron reportadas como útiles por los usuarios."
      >
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500 dark:text-gray-400">
            No hay datos de recomendaciones disponibles
          </p>
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Efectividad de Recomendaciones"
      description="Comparación entre recomendaciones generadas y reportadas como útiles"
      filters={filtersComponent}
      insights={insights}
      helpText="Analiza qué tipos de recomendaciones son más efectivas. Las barras azules muestran las generadas y las verdes las reportadas como útiles."
    >
      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          data={processedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="tipo" 
            stroke={axisColor}
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke={axisColor}
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="rect"
          />
          <Bar 
            dataKey="generadas" 
            name="Generadas"
            fill="#3b82f6" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
          <Bar 
            dataKey="utiles" 
            name="Reportadas como útiles"
            fill="#10b981" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Indicadores de efectividad */}
      {filters.showEffectiveness && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {processedData.slice(0, 5).map((item, index) => (
            <div 
              key={index}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                parseFloat(item.efectividad) >= 70 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : parseFloat(item.efectividad) >= 40
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {item.tipo}: {item.efectividad}%
            </div>
          ))}
        </div>
      )}
    </ChartWrapper>
  );
});

EfectividadRecomendacionesChart.displayName = 'EfectividadRecomendacionesChart';

EfectividadRecomendacionesChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      tipo: PropTypes.string.isRequired,
      generadas: PropTypes.number.isRequired,
      utiles: PropTypes.number.isRequired,
    })
  ),
};

export default EfectividadRecomendacionesChart;
