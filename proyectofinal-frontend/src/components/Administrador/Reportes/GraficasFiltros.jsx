import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ALL_EMOTIONS = ['ansiedad','estres','felicidad','tristeza','miedo','enojo','neutral','sorpresa'];

const GraficasFiltros = ({ onChange, initial = {} }) => {
  const [emotions, setEmotions] = useState(initial.emotions || ALL_EMOTIONS);
  const [metric, setMetric] = useState(initial.metric || 'promedio_ansiedad');
  const [granularity, setGranularity] = useState(initial.granularity || 'auto');
  const [topN, setTopN] = useState(initial.topN || 10);
  const [threshold, setThreshold] = useState(initial.threshold || 0);
  const [compare, setCompare] = useState(initial.compare || false);
  const [normalize, setNormalize] = useState(initial.normalize || false);
  const [smoothing, setSmoothing] = useState(initial.smoothing || false);

  useEffect(() => {
    if (onChange) {
      onChange({
        emotions,
        metric,
        granularity,
        topN,
        threshold,
        compare,
        normalize,
        smoothing,
      });
    }
  }, [emotions, metric, granularity, topN, threshold, compare, normalize, smoothing, onChange]);

  const toggleEmotion = (e) => {
    const val = e.target.value;
    setEmotions((prev) => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const selectAll = () => setEmotions([...ALL_EMOTIONS]);
  const clearAll = () => setEmotions([]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Controles de Gráficas</h4>
        <div className="flex gap-2">
          <button type="button" onClick={(ev) => { ev.preventDefault(); selectAll(); }} className="px-2 py-1 bg-gray-100 rounded text-sm">Todos</button>
          <button type="button" onClick={(ev) => { ev.preventDefault(); clearAll(); }} className="px-2 py-1 bg-gray-100 rounded text-sm">Ninguno</button>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Emociones</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ALL_EMOTIONS.map((emo) => (
            <label key={emo} className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" value={emo} checked={emotions.includes(emo)} onChange={toggleEmotion} />
              <span className="capitalize">{emo}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Métrica</label>
          <select value={metric} onChange={(e) => setMetric(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border">
            <option value="promedio_ansiedad">Promedio Ansiedad</option>
            <option value="promedio_estres">Promedio Estrés</option>
            <option value="cantidad">Cantidad</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Granularidad</label>
          <select value={granularity} onChange={(e) => setGranularity(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border">
            <option value="auto">Automática</option>
            <option value="diario">Diario</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Top N (tablas)</label>
          <select value={topN} onChange={(e) => setTopN(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border">
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Umbral (nivel)</label>
          <input type="range" min="0" max="100" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
          <div className="text-xs text-gray-500">{threshold}%</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
          Comparar periodo
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={normalize} onChange={(e) => setNormalize(e.target.checked)} />
          Mostrar %
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={smoothing} onChange={(e) => setSmoothing(e.target.checked)} />
          Media móvil (suavizado)
        </label>
      </div>
    </div>
  );
};

GraficasFiltros.propTypes = {
  onChange: PropTypes.func,
  initial: PropTypes.object,
};

export default GraficasFiltros;
