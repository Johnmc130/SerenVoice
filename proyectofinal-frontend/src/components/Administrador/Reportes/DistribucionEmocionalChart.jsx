import React, { useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import ChartWrapper from './ChartWrapper';
import ChartFilters, { ALL_EMOTIONS } from './ChartFilters';
import { generateDistribucionInsights } from './insightsUtils';

const EMOTION_COLORS = {
  ansiedad: '#ef4444',
  estres: '#f97316',
  tristeza: '#6366f1',
  miedo: '#8b5cf6',
  enojo: '#dc2626',
  felicidad: '#10b981',
  neutral: '#6b7280',
  sorpresa: '#f59e0b',
};

/**
 * Componente de gráfica de pastel para distribución de emociones dominantes
 * Con filtros LOCALES que no recargan la página
 */
const DistribucionEmocionalChart = memo(({ data = [] }) => {
  // Estado LOCAL de filtros
  const [filters, setFilters] = useState({
    emotions: [...ALL_EMOTIONS],
    showPercentage: true,
  });

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Filtrar datos según emociones seleccionadas (sin llamada a API)
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter(item => 
      filters.emotions.includes(item.emocion?.toLowerCase())
    );
  }, [data, filters.emotions]);

  // Recalcular porcentajes para datos filtrados
  const processedData = useMemo(() => {
    if (filteredData.length === 0) return [];
    const total = filteredData.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    return filteredData.map(item => ({
      ...item,
      porcentaje: total > 0 ? ((item.cantidad / total) * 100).toFixed(1) : 0
    }));
  }, [filteredData]);

  // Generar insights
  const insights = useMemo(() => {
    return generateDistribucionInsights(data);
  }, [data]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
            {item.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Cantidad: {item.value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Porcentaje: {item.payload.porcentaje}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (!filters.showPercentage || percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const filtersComponent = (
    <ChartFilters
      variant="distribucion"
      value={filters}
      onChange={handleFilterChange}
    />
  );

  if (!processedData || processedData.length === 0) {
    return (
      <ChartWrapper
        title="Distribución de Emociones Dominantes"
        description="Proporción de cada emoción en los análisis realizados"
        filters={filtersComponent}
        insights={['No hay datos de emociones disponibles para el periodo.']}
        helpText="Esta gráfica muestra qué emociones predominan en los análisis. Selecciona las emociones que deseas visualizar."
      >
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500 dark:text-gray-400">
            No hay datos de emociones disponibles
          </p>
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Distribución de Emociones Dominantes"
      description="Proporción de cada emoción en los análisis realizados"
      filters={filtersComponent}
      insights={insights}
      helpText="Esta gráfica muestra la distribución porcentual de las emociones detectadas. Filtra por emociones específicas para un análisis más detallado."
    >
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="cantidad"
            nameKey="emocion"
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={EMOTION_COLORS[entry.emocion?.toLowerCase()] || EMOTION_COLORS.neutral} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});

DistribucionEmocionalChart.displayName = 'DistribucionEmocionalChart';

DistribucionEmocionalChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      emocion: PropTypes.string.isRequired,
      cantidad: PropTypes.number.isRequired,
      porcentaje: PropTypes.number,
    })
  ),
};

export default DistribucionEmocionalChart;
