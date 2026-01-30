import React, { useState, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Eye, Filter } from 'lucide-react';
import ChartWrapper from './ChartWrapper';
import { generateAlertasInsights } from './insightsUtils';

/**
 * Componente de tabla para mostrar alertas críticas recientes
 * Con filtros LOCALES que no recargan la página
 */
const AlertasTable = memo(({ data = [], onViewDetails }) => {
  // Estado LOCAL de filtros
  const [filters, setFilters] = useState({
    tipoAlerta: 'todos',
    nivelMinimo: 0,
    ordenarPor: 'fecha',
  });

  // Filtrar y ordenar datos localmente
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let result = [...data];
    
    // Filtrar por tipo
    if (filters.tipoAlerta !== 'todos') {
      result = result.filter(a => a.tipo_alerta === filters.tipoAlerta);
    }
    
    // Filtrar por nivel mínimo
    if (filters.nivelMinimo > 0) {
      result = result.filter(a => (a.nivel_ansiedad || 0) >= filters.nivelMinimo);
    }
    
    // Ordenar
    if (filters.ordenarPor === 'fecha') {
      result.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    } else if (filters.ordenarPor === 'nivel') {
      result.sort((a, b) => (b.nivel_ansiedad || 0) - (a.nivel_ansiedad || 0));
    }
    
    return result;
  }, [data, filters]);

  // Generar insights
  const insights = useMemo(() => {
    return generateAlertasInsights(data);
  }, [data]);

  // Obtener tipos únicos de alertas
  const tiposUnicos = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...new Set(data.map(a => a.tipo_alerta).filter(Boolean))];
  }, [data]);

  const getTipoAlertaBadge = (tipo) => {
    const styles = {
      'riesgo_alto': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'patron_anormal': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'empeoramiento': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'inactividad': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[tipo] || styles.inactividad}`}>
        {tipo?.replace('_', ' ')}
      </span>
    );
  };

  const getNivelColor = (nivel) => {
    if (nivel >= 80) return 'text-red-600 dark:text-red-400 font-bold';
    if (nivel >= 60) return 'text-orange-600 dark:text-orange-400 font-semibold';
    if (nivel >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Componente de filtros
  const filtersComponent = (
    <div className="flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Tipo de alerta
        </label>
        <select
          value={filters.tipoAlerta}
          onChange={(e) => setFilters(prev => ({ ...prev, tipoAlerta: e.target.value }))}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
        >
          <option value="todos">Todos los tipos</option>
          {tiposUnicos.map(tipo => (
            <option key={tipo} value={tipo}>{tipo?.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Nivel mínimo
        </label>
        <select
          value={filters.nivelMinimo}
          onChange={(e) => setFilters(prev => ({ ...prev, nivelMinimo: Number(e.target.value) }))}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
        >
          <option value={0}>Sin mínimo</option>
          <option value={40}>≥ 40% (Moderado+)</option>
          <option value={60}>≥ 60% (Alto+)</option>
          <option value={80}>≥ 80% (Muy Alto)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Ordenar por
        </label>
        <select
          value={filters.ordenarPor}
          onChange={(e) => setFilters(prev => ({ ...prev, ordenarPor: e.target.value }))}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
        >
          <option value="fecha">Más recientes</option>
          <option value="nivel">Mayor nivel</option>
        </select>
      </div>
    </div>
  );

  if (!data || data.length === 0) {
    return (
      <ChartWrapper
        title="Alertas Críticas Recientes"
        description="Usuarios que requieren atención inmediata"
        filters={filtersComponent}
        insights={['[OK] No hay alertas críticas en este momento.']}
        helpText="Esta tabla muestra las alertas generadas por el sistema cuando se detectan patrones de preocupación en los análisis de usuarios."
      >
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay alertas críticas en este momento
            </p>
          </div>
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Alertas Críticas Recientes"
      description={`${filteredData.length} alertas encontradas`}
      filters={filtersComponent}
      insights={insights}
      helpText="Muestra usuarios con patrones de ansiedad o estrés que requieren seguimiento. Usa los filtros para enfocarte en tipos específicos o niveles de severidad."
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo de Alerta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nivel Ansiedad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map((alerta) => (
              <tr 
                key={alerta.id_alerta}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {alerta.nombre} {alerta.apellido}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getTipoAlertaBadge(alerta.tipo_alerta)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-gray-300 max-w-xs truncate">
                    {alerta.descripcion || alerta.titulo}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatFecha(alerta.fecha)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${getNivelColor(alerta.nivel_ansiedad)}`}>
                    {alerta.nivel_ansiedad ? `${alerta.nivel_ansiedad}%` : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    type="button"
                    onClick={() => onViewDetails && onViewDetails(alerta)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    aria-label={`Ver detalles de alerta de ${alerta.nombre} ${alerta.apellido}`}
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredData.length === 0 && data.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay alertas que coincidan con los filtros seleccionados
        </div>
      )}
    </ChartWrapper>
  );
});

AlertasTable.displayName = 'AlertasTable';

AlertasTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id_alerta: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired,
      apellido: PropTypes.string.isRequired,
      tipo_alerta: PropTypes.string.isRequired,
      titulo: PropTypes.string,
      descripcion: PropTypes.string,
      fecha: PropTypes.string.isRequired,
      nivel_ansiedad: PropTypes.number,
    })
  ),
  onViewDetails: PropTypes.func,
};

export default AlertasTable;
