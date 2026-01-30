import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Download, FileText, FileSpreadsheet, X, Loader2 } from 'lucide-react';

/**
 * Botón con menú dropdown para exportar reportes
 * @param {Object} props - Props del componente
 * @param {Function} props.onExport - Callback para ejecutar exportación
 * @param {Object} props.filtros - Filtros actuales a incluir en la exportación
 * @param {boolean} props.disabled - Si el botón está deshabilitado
 */
const ExportButton = ({ onExport, filtros = {}, disabled = false }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formato, setFormato] = useState('pdf');
  const [tipoReporte, setTipoReporte] = useState('completo');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const formatos = [
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
  ];

  const tiposReporte = [
    { value: 'completo', label: 'Reporte Completo', description: 'Incluye todas las gráficas y tablas' },
    { value: 'resumen', label: 'Resumen Ejecutivo', description: 'Solo métricas principales y tendencias' },
    { value: 'alertas', label: 'Alertas Críticas', description: 'Enfocado en alertas y usuarios de riesgo' },
    { value: 'grupos', label: 'Actividad de Grupos', description: 'Estadísticas de grupos terapéuticos' },
  ];

  const handleFormatoClick = (formatoSeleccionado) => {
    setFormato(formatoSeleccionado);
    setShowMenu(false);
    setShowModal(true);
  };

  const handleExportar = async () => {
    setLoading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await onExport({
        formato,
        tipo: tipoReporte,
        filtros,
      });
      
      setProgress(100);
      
      setTimeout(() => {
        setShowModal(false);
        setLoading(false);
        setProgress(0);
      }, 500);
    } catch {
      clearInterval(progressInterval);
      setLoading(false);
      setProgress(0);
    }
  };

  const handleCloseModal = () => {
    if (!loading) {
      setShowModal(false);
      setTipoReporte('completo');
    }
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
          aria-label="Exportar reporte"
        >
          <Download className="w-4 h-4" />
          Exportar Reporte
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
            <div className="py-2">
              {formatos.map((fmt) => {
                const IconComponent = fmt.icon;
                return (
                  <button
                    type="button"
                    key={fmt.value}
                    onClick={() => handleFormatoClick(fmt.value)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <IconComponent className="w-4 h-4" />
                    Exportar como {fmt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
          aria-hidden="true"
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar Exportación
              </h3>
              {!loading && (
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato de exportación
                </label>
                <div className="flex gap-2">
                  {formatos.map((fmt) => {
                    const IconComponent = fmt.icon;
                    return (
                      <button
                        type="button"
                        key={fmt.value}
                        onClick={() => setFormato(fmt.value)}
                        disabled={loading}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          formato === fmt.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de reporte
                </label>
                <div className="space-y-2">
                  {tiposReporte.map((tipo) => (
                    <label
                      key={tipo.value}
                      className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        tipoReporte === tipo.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="tipoReporte"
                        value={tipo.value}
                        checked={tipoReporte === tipo.value}
                        onChange={(e) => setTipoReporte(e.target.value)}
                        disabled={loading}
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tipo.label}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {tipo.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {loading && (
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Generando reporte...
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExportar}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Exportar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ExportButton.propTypes = {
  onExport: PropTypes.func.isRequired,
  filtros: PropTypes.object,
  disabled: PropTypes.bool,
};

export default ExportButton;
