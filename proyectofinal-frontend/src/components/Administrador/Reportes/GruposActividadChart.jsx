import React, { useContext, useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThemeContext } from '../../../context/themeContextDef';
import ChartWrapper from './ChartWrapper';
import { generateGruposInsights } from './insightsUtils';

/**
 * Componente de gráfica de barras para actividad de grupos
 * Con filtros LOCALES que no recargan la página
 */
const GruposActividadChart = memo(({ data = [] }) => {
  const { isDark } = useContext(ThemeContext);

  // Estado LOCAL de filtros
  const [filters, setFilters] = useState({
    topN: 10,
    sortBy: 'actividades_completadas',
    showMetrics: true,
  });

  const handleTopNChange = useCallback((e) => {
    setFilters(prev => ({ ...prev, topN: Number(e.target.value) }));
  }, []);

  const handleSortChange = useCallback((e) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value }));
  }, []);

  // Procesar y ordenar datos según filtros
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    const sorted = [...data].sort((a, b) => {
      const valA = a[filters.sortBy] || 0;
      const valB = b[filters.sortBy] || 0;
      return valB - valA;
    });
    
    return sorted.slice(0, filters.topN);
  }, [data, filters.topN, filters.sortBy]);

  // Generar insights
  const insights = useMemo(() => {
    return generateGruposInsights(data);
  }, [data]);

  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {item.nombre_grupo}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Actividades completadas: <span className="font-semibold">{item.actividades_completadas}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Total actividades: <span className="font-semibold">{item.total_actividades}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Miembros activos: <span className="font-semibold">{item.miembros_activos}</span>
          </p>
          {item.total_actividades > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 font-medium">
              Tasa completado: {((item.actividades_completadas / item.total_actividades) * 100).toFixed(0)}%
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
          Cantidad a mostrar
        </label>
        <select
          value={filters.topN}
          onChange={handleTopNChange}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={15}>Top 15</option>
          <option value={20}>Top 20</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Ordenar por
        </label>
        <select
          value={filters.sortBy}
          onChange={handleSortChange}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        >
          <option value="actividades_completadas">Actividades completadas</option>
          <option value="total_actividades">Total actividades</option>
          <option value="miembros_activos">Miembros activos</option>
        </select>
      </div>
      <label className="inline-flex items-center gap-2 cursor-pointer pb-1">
        <input
          type="checkbox"
          checked={filters.showMetrics}
          onChange={(e) => setFilters(prev => ({ ...prev, showMetrics: e.target.checked }))}
          className="w-4 h-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Mostrar métricas en tooltip
        </span>
      </label>
    </div>
  );

  if (!processedData || processedData.length === 0) {
    return (
      <ChartWrapper
        title="Grupos Más Activos"
        description="Ranking de grupos según actividad completada"
        filters={filtersComponent}
        insights={['No hay datos de actividad de grupos disponibles.']}
        helpText="Esta gráfica muestra los grupos con mayor actividad. Puedes cambiar la cantidad de grupos a mostrar y el criterio de ordenamiento."
      >
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 dark:text-gray-400">
            No hay datos de actividad de grupos disponibles
          </p>
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title={`Grupos Más Activos (Top ${filters.topN})`}
      description="Ranking de grupos según actividad completada"
      filters={filtersComponent}
      insights={insights}
      helpText="Visualiza qué grupos tienen mayor participación. Usa los filtros para ajustar la cantidad mostrada y el criterio de ordenamiento."
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={processedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis 
            type="number"
            stroke={axisColor}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            type="category"
            dataKey="nombre_grupo" 
            stroke={axisColor}
            style={{ fontSize: '11px' }}
            width={120}
            tickFormatter={(value) => value?.length > 15 ? value.substring(0, 15) + '...' : value}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={() => filters.sortBy === 'actividades_completadas' ? 'Actividades completadas' : 
                           filters.sortBy === 'total_actividades' ? 'Total actividades' : 'Miembros activos'}
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Bar 
            dataKey={filters.sortBy}
            fill="#3b82f6"
            radius={[0, 8, 8, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});

GruposActividadChart.displayName = 'GruposActividadChart';

GruposActividadChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      nombre_grupo: PropTypes.string.isRequired,
      actividades_completadas: PropTypes.number.isRequired,
      total_actividades: PropTypes.number,
      miembros_activos: PropTypes.number,
    })
  ),
};

export default GruposActividadChart;
