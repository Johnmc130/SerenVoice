import React, { useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, RadialBarChart, RadialBar } from 'recharts';
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

const EMOTION_GRADIENTS = {
  ansiedad: ['#ef4444', '#f87171'],
  estres: ['#f97316', '#fb923c'],
  tristeza: ['#6366f1', '#818cf8'],
  miedo: ['#8b5cf6', '#a78bfa'],
  enojo: ['#dc2626', '#f87171'],
  felicidad: ['#10b981', '#34d399'],
  neutral: ['#6b7280', '#9ca3af'],
  sorpresa: ['#f59e0b', '#fbbf24'],
};

const EMOTION_ICONS = {
  ansiedad: '😰',
  estres: '😓',
  tristeza: '😢',
  miedo: '😨',
  enojo: '😠',
  felicidad: '😊',
  neutral: '😐',
  sorpresa: '😲',
};

/**
 * Componente de gráfica de pastel para distribución de emociones dominantes
 * Con filtros LOCALES que no recargan la página
 * Diseño mejorado con cards de emociones y gráfica donut moderna
 */
const DistribucionEmocionalChart = memo(({ data = [] }) => {
  // Estado LOCAL de filtros
  const [filters, setFilters] = useState({
    emotions: [...ALL_EMOTIONS],
    showPercentage: true,
  });
  const [selectedEmotion, setSelectedEmotion] = useState(null);

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
    return filteredData
      .map(item => ({
        ...item,
        porcentaje: total > 0 ? ((item.cantidad / total) * 100) : 0,
        porcentajeStr: total > 0 ? ((item.cantidad / total) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [filteredData]);

  // Calcular totales
  const totals = useMemo(() => {
    const total = processedData.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    const dominant = processedData[0] || null;
    return { total, dominant };
  }, [processedData]);

  // Generar insights
  const insights = useMemo(() => {
    return generateDistribucionInsights(data);
  }, [data]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const emotion = item.name?.toLowerCase();
      return (
        <div 
          className="p-4 rounded-xl shadow-2xl border-0 backdrop-blur-sm"
          style={{ 
            background: `linear-gradient(135deg, ${EMOTION_COLORS[emotion]}20, ${EMOTION_COLORS[emotion]}10)`,
            border: `2px solid ${EMOTION_COLORS[emotion]}50`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{EMOTION_ICONS[emotion] || '😐'}</span>
            <p className="text-base font-bold text-gray-900 dark:text-white capitalize">
              {item.name}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-700 dark:text-gray-200 flex justify-between gap-4">
              <span>Análisis:</span>
              <span className="font-semibold">{item.value.toLocaleString()}</span>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 flex justify-between gap-4">
              <span>Porcentaje:</span>
              <span className="font-semibold">{item.payload.porcentajeStr}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (!filters.showPercentage || percent < 0.08) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Renderizar leyenda personalizada con cards
  const CustomLegend = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 px-2">
      {processedData.slice(0, 8).map((item, index) => {
        const emotion = item.emocion?.toLowerCase();
        const isSelected = selectedEmotion === emotion;
        return (
          <button
            key={`legend-${index}`}
            type="button"
            onClick={() => setSelectedEmotion(isSelected ? null : emotion)}
            className={`
              flex items-center gap-2 p-2 rounded-lg transition-all duration-200 cursor-pointer
              ${isSelected 
                ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 scale-105' 
                : 'hover:scale-102 hover:shadow-md'
              }
            `}
            style={{ 
              background: `linear-gradient(135deg, ${EMOTION_COLORS[emotion]}15, ${EMOTION_COLORS[emotion]}05)`,
              borderLeft: `3px solid ${EMOTION_COLORS[emotion]}`,
              ringColor: EMOTION_COLORS[emotion]
            }}
          >
            <span className="text-lg">{EMOTION_ICONS[emotion] || '😐'}</span>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize truncate">
                {item.emocion}
              </span>
              <span 
                className="text-sm font-bold"
                style={{ color: EMOTION_COLORS[emotion] }}
              >
                {item.porcentajeStr}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );

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
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <div className="text-6xl opacity-50">📊</div>
          <p className="text-gray-500 dark:text-gray-400 text-center">
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
      <div className="flex flex-col">
        {/* Resumen superior */}
        <div className="flex justify-center gap-6 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totals.total.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total análisis
            </p>
          </div>
          {totals.dominant && (
            <div className="text-center px-4 border-l border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">{EMOTION_ICONS[totals.dominant.emocion?.toLowerCase()] || '😐'}</span>
                <p 
                  className="text-lg font-bold capitalize"
                  style={{ color: EMOTION_COLORS[totals.dominant.emocion?.toLowerCase()] || '#6b7280' }}
                >
                  {totals.dominant.emocion}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Emoción dominante ({totals.dominant.porcentajeStr}%)
              </p>
            </div>
          )}
        </div>

        {/* Gráfica Donut */}
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <defs>
              {Object.entries(EMOTION_GRADIENTS).map(([emotion, colors]) => (
                <linearGradient key={emotion} id={`gradient-${emotion}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={colors[0]} />
                  <stop offset="100%" stopColor={colors[1]} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              innerRadius={60}
              outerRadius={110}
              paddingAngle={2}
              dataKey="cantidad"
              nameKey="emocion"
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {processedData.map((entry, index) => {
                const emotion = entry.emocion?.toLowerCase();
                const isSelected = selectedEmotion === emotion;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient-${emotion})`}
                    stroke={isSelected ? EMOTION_COLORS[emotion] : 'transparent'}
                    strokeWidth={isSelected ? 3 : 0}
                    style={{
                      filter: selectedEmotion && !isSelected ? 'opacity(0.4)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setSelectedEmotion(isSelected ? null : emotion)}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Leyenda personalizada con cards */}
        <CustomLegend />
      </div>
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
