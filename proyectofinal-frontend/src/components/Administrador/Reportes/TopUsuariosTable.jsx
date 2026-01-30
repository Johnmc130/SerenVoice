import React, { useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Users, ExternalLink, ArrowUpDown } from 'lucide-react';
import ChartWrapper from './ChartWrapper';
import { generateTopUsuariosInsights } from './insightsUtils';

/**
 * Componente de tabla para mostrar usuarios con mayores niveles de ansiedad/estrés
 * Con filtros LOCALES que no recargan la página
 */
const TopUsuariosTable = memo(({ data = [] }) => {
  // Estado LOCAL de filtros
  const [filters, setFilters] = useState({
    metric: 'ansiedad',
    topN: 10,
    sortOrder: 'desc',
    nivelMinimo: 0,
  });

  // Procesar y filtrar datos localmente
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let result = [...data];
    
    // Filtrar por nivel mínimo
    if (filters.nivelMinimo > 0) {
      result = result.filter(u => {
        const valor = filters.metric === 'ansiedad' ? u.promedio_ansiedad : u.promedio_estres;
        return (valor || 0) >= filters.nivelMinimo;
      });
    }
    
    // Ordenar
    result.sort((a, b) => {
      const aValue = filters.metric === 'ansiedad' ? a.promedio_ansiedad : a.promedio_estres;
      const bValue = filters.metric === 'ansiedad' ? b.promedio_ansiedad : b.promedio_estres;
      return filters.sortOrder === 'desc' ? (bValue || 0) - (aValue || 0) : (aValue || 0) - (bValue || 0);
    });
    
    return result.slice(0, filters.topN);
  }, [data, filters]);

  // Generar insights
  const insights = useMemo(() => {
    return generateTopUsuariosInsights(data, filters.metric);
  }, [data, filters.metric]);

  const toggleSort = useCallback(() => {
    setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' }));
  }, []);

  const getNivelColor = (nivel) => {
    if (nivel >= 80) return 'text-red-600 dark:text-red-400 font-bold';
    if (nivel >= 60) return 'text-orange-600 dark:text-orange-400 font-semibold';
    if (nivel >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getNivelBadge = (nivel) => {
    if (nivel >= 80) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (nivel >= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    if (nivel >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  };

  const getClasificacion = (nivel) => {
    if (nivel >= 80) return 'Muy Alto';
    if (nivel >= 60) return 'Alto';
    if (nivel >= 40) return 'Moderado';
    if (nivel >= 20) return 'Leve';
    return 'Normal';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
    });
  };

  // Componente de filtros
  const filtersComponent = (
    <div className="flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Métrica
        </label>
        <select
          value={filters.metric}
          onChange={(e) => setFilters(prev => ({ ...prev, metric: e.target.value }))}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
        >
          <option value="ansiedad">Ansiedad</option>
          <option value="estres">Estrés</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Cantidad
        </label>
        <select
          value={filters.topN}
          onChange={(e) => setFilters(prev => ({ ...prev, topN: Number(e.target.value) }))}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={15}>Top 15</option>
          <option value={20}>Top 20</option>
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
          <option value={20}>≥ 20% (Leve+)</option>
          <option value={40}>≥ 40% (Moderado+)</option>
          <option value={60}>≥ 60% (Alto+)</option>
          <option value={80}>≥ 80% (Muy Alto)</option>
        </select>
      </div>
      <button
        type="button"
        onClick={toggleSort}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <ArrowUpDown className="w-4 h-4" />
        {filters.sortOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
      </button>
    </div>
  );

  const metricLabel = filters.metric === 'ansiedad' ? 'Ansiedad' : 'Estrés';

  if (!data || data.length === 0) {
    return (
      <ChartWrapper
        title={`Top Usuarios - Mayor ${metricLabel}`}
        description="Usuarios con niveles más elevados que requieren seguimiento"
        filters={filtersComponent}
        insights={['No hay datos de usuarios disponibles.']}
        helpText="Esta tabla muestra los usuarios con mayores niveles de la métrica seleccionada, permitiendo identificar quiénes necesitan mayor atención."
      >
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay datos de usuarios disponibles
            </p>
          </div>
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title={`Top ${filters.topN} Usuarios - Mayor ${metricLabel}`}
      description={`${processedData.length} usuarios encontrados`}
      filters={filtersComponent}
      insights={insights}
      helpText="Identifica usuarios que podrían necesitar intervención basándose en sus niveles promedio. Cambia la métrica entre ansiedad y estrés para diferentes perspectivas."
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Correo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Promedio {metricLabel}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Clasificación
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Análisis
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Último
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {processedData.map((usuario, index) => {
              const valor = filters.metric === 'ansiedad' ? usuario.promedio_ansiedad : usuario.promedio_estres;
              return (
                <tr 
                  key={usuario.id_usuario}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {usuario.nombre} {usuario.apellido}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400 max-w-[150px] truncate">
                      {usuario.correo}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-lg font-bold ${getNivelColor(valor)}`}>
                      {valor ? valor.toFixed(1) : 'N/A'}%
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNivelBadge(valor)}`}>
                      {getClasificacion(valor)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {usuario.total_analisis || 0}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatFecha(usuario.ultimo_analisis)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <a
                      href={`/admin/usuarios/${usuario.id_usuario}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      aria-label={`Ver perfil de ${usuario.nombre} ${usuario.apellido}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {processedData.length === 0 && data.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay usuarios que coincidan con los filtros seleccionados
        </div>
      )}
    </ChartWrapper>
  );
});

TopUsuariosTable.displayName = 'TopUsuariosTable';

TopUsuariosTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id_usuario: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired,
      apellido: PropTypes.string.isRequired,
      correo: PropTypes.string.isRequired,
      promedio_ansiedad: PropTypes.number,
      promedio_estres: PropTypes.number,
      total_analisis: PropTypes.number,
      ultimo_analisis: PropTypes.string,
    })
  ),
};

export default TopUsuariosTable;
