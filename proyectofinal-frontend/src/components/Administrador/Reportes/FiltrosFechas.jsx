import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Calendar, X } from 'lucide-react';

/**
 * Componente de filtros de fecha reutilizable
 * @param {Object} props - Props del componente
 * @param {Function} props.onFiltroChange - Callback cuando cambian los filtros
 * @param {Object} props.filtrosIniciales - Valores iniciales de los filtros
 */
const FiltrosFechas = ({ onFiltroChange, filtrosIniciales = {} }) => {
  const [periodo, setPeriodo] = useState(filtrosIniciales.periodo || '30d');
  const [fechaInicio, setFechaInicio] = useState(filtrosIniciales.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(filtrosIniciales.fecha_fin || '');
  const [mostrarPersonalizado, setMostrarPersonalizado] = useState(false);

  const periodos = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 90 días' },
    { value: 'custom', label: 'Personalizado' },
  ];

  const calcularFechas = (periodoSeleccionado) => {
    const hoy = new Date();
    let inicio = new Date();
    
    switch (periodoSeleccionado) {
      case '7d':
        inicio.setDate(hoy.getDate() - 7);
        break;
      case '30d':
        inicio.setDate(hoy.getDate() - 30);
        break;
      case '90d':
        inicio.setDate(hoy.getDate() - 90);
        break;
      default:
        return null;
    }
    
    return {
      fecha_inicio: inicio.toISOString().split('T')[0],
      fecha_fin: hoy.toISOString().split('T')[0],
    };
  };

  const handlePeriodoChange = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    
    if (nuevoPeriodo === 'custom') {
      setMostrarPersonalizado(true);
      return;
    }
    
    setMostrarPersonalizado(false);
    const fechas = calcularFechas(nuevoPeriodo);
    
    if (fechas && onFiltroChange) {
      onFiltroChange({
        periodo: nuevoPeriodo,
        ...fechas,
      });
    }
  };

  const handleFechaPersonalizadaChange = (tipo, valor) => {
    if (tipo === 'inicio') {
      setFechaInicio(valor);
    } else {
      setFechaFin(valor);
    }
  };

  const aplicarFechasPersonalizadas = () => {
    if (fechaInicio && fechaFin && onFiltroChange) {
      onFiltroChange({
        periodo: 'custom',
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
    }
  };

  const limpiarFiltros = () => {
    setPeriodo('30d');
    setFechaInicio('');
    setFechaFin('');
    setMostrarPersonalizado(false);
    
    const fechas = calcularFechas('30d');
    if (fechas && onFiltroChange) {
      onFiltroChange({
        periodo: '30d',
        ...fechas,
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Periodo de Análisis
        </h3>
      </div>

      <div className="space-y-4">
        {/* Botones de periodo predefinido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {periodos.map((p) => (
            <button
              type="button"
              key={p.value}
              onClick={() => handlePeriodoChange(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodo === p.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Selector de fechas personalizadas */}
        {mostrarPersonalizado && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rango personalizado
              </span>
              <button
                type="button"
                onClick={() => {
                  setMostrarPersonalizado(false);
                  setPeriodo('30d');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Cerrar rango personalizado"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => handleFechaPersonalizadaChange('inicio', e.target.value)}
                  max={fechaFin || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => handleFechaPersonalizadaChange('fin', e.target.value)}
                  min={fechaInicio}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={aplicarFechasPersonalizadas}
              disabled={!fechaInicio || !fechaFin}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Aplicar fechas
            </button>
          </div>
        )}

        {/* Botón limpiar filtros */}
        {periodo !== '30d' && (
          <button
              type="button"
              onClick={limpiarFiltros}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Limpiar filtros
            </button>
        )}
      </div>
    </div>
  );
};

FiltrosFechas.propTypes = {
  onFiltroChange: PropTypes.func.isRequired,
  filtrosIniciales: PropTypes.shape({
    periodo: PropTypes.string,
    fecha_inicio: PropTypes.string,
    fecha_fin: PropTypes.string,
  }),
};

export default FiltrosFechas;
