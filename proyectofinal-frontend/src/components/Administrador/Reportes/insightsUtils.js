/**
 * Utilidades para generar interpretaciones automáticas de datos de gráficas
 * Estas funciones analizan los datos y generan insights legibles
 */

/**
 * Genera insights para gráfica de tendencias emocionales
 * @param {Array} data - Datos de tendencias
 * @param {Array} selectedEmotions - Emociones seleccionadas para mostrar
 * @returns {Array<string>} Lista de insights
 */
export function generateTendenciasInsights(data = [], selectedEmotions = []) {
  const insights = [];
  
  if (!data || data.length < 2) {
    return ['No hay suficientes datos para generar análisis de tendencias.'];
  }

  const emotions = selectedEmotions.length > 0 
    ? selectedEmotions 
    : ['ansiedad', 'estres', 'felicidad', 'tristeza', 'miedo', 'enojo', 'neutral', 'sorpresa'];

  // Calcular promedios y tendencias
  const emotionStats = {};
  emotions.forEach(emotion => {
    const values = data.map(d => d[emotion]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      const avgFirst = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
      const avgSecond = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
      const trend = avgSecond - avgFirst;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      emotionStats[emotion] = { avg, trend, max, min };
    }
  });

  // Encontrar emoción dominante
  const dominante = Object.entries(emotionStats).sort((a, b) => b[1].avg - a[1].avg)[0];
  if (dominante) {
    insights.push(`La emoción predominante es "${dominante[0]}" con un promedio de ${dominante[1].avg.toFixed(1)}%.`);
  }

  // Detectar tendencias significativas
  const tendenciasAlza = Object.entries(emotionStats)
    .filter(([, stats]) => stats.trend > 5)
    .sort((a, b) => b[1].trend - a[1].trend);
  
  const tendenciasBaja = Object.entries(emotionStats)
    .filter(([, stats]) => stats.trend < -5)
    .sort((a, b) => a[1].trend - b[1].trend);

  if (tendenciasAlza.length > 0) {
    const emocion = tendenciasAlza[0][0];
    const cambio = tendenciasAlza[0][1].trend.toFixed(1);
    insights.push(`"${emocion}" muestra una tendencia al alza (+${cambio}%) en el periodo.`);
  }

  if (tendenciasBaja.length > 0) {
    const emocion = tendenciasBaja[0][0];
    const cambio = Math.abs(tendenciasBaja[0][1].trend).toFixed(1);
    insights.push(`"${emocion}" muestra una tendencia a la baja (-${cambio}%) en el periodo.`);
  }

  // Detectar alta variabilidad
  const altaVariabilidad = Object.entries(emotionStats)
    .filter(([, stats]) => (stats.max - stats.min) > 30)
    .map(([emotion]) => emotion);
  
  if (altaVariabilidad.length > 0) {
    insights.push(`Alta variabilidad detectada en: ${altaVariabilidad.join(', ')}. Podría indicar eventos externos significativos.`);
  }

  // Detectar niveles de preocupación
  const emocionesPreocupantes = ['ansiedad', 'estres', 'miedo', 'enojo', 'tristeza'];
  const preocupantesAltos = Object.entries(emotionStats)
    .filter(([emotion, stats]) => emocionesPreocupantes.includes(emotion) && stats.avg > 60);
  
  if (preocupantesAltos.length > 0) {
    insights.push(`[ALERTA] Niveles elevados en: ${preocupantesAltos.map(([e]) => e).join(', ')}. Se recomienda revisión de casos individuales.`);
  }

  return insights.length > 0 ? insights : ['Los datos se encuentran dentro de rangos normales.'];
}

/**
 * Genera insights para gráfica de distribución emocional
 * @param {Array} data - Datos de distribución
 * @returns {Array<string>} Lista de insights
 */
export function generateDistribucionInsights(data = []) {
  const insights = [];
  
  if (!data || data.length === 0) {
    return ['No hay datos de distribución disponibles.'];
  }

  const total = data.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  if (total === 0) {
    return ['No se registraron análisis en el periodo seleccionado.'];
  }

  // Ordenar por cantidad
  const sorted = [...data].sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0));
  
  // Emoción más frecuente
  const top = sorted[0];
  if (top) {
    const porcentaje = ((top.cantidad / total) * 100).toFixed(1);
    insights.push(`"${top.emocion}" es la emoción más frecuente, representando el ${porcentaje}% de los análisis.`);
  }

  // Top 3 emociones
  const top3 = sorted.slice(0, 3).map(e => e.emocion);
  const top3Pct = sorted.slice(0, 3).reduce((sum, e) => sum + e.cantidad, 0) / total * 100;
  insights.push(`Las 3 emociones principales (${top3.join(', ')}) representan el ${top3Pct.toFixed(0)}% del total.`);

  // Detectar emociones negativas predominantes
  const negativas = ['ansiedad', 'estres', 'tristeza', 'miedo', 'enojo'];
  const totalNegativas = data
    .filter(d => negativas.includes(d.emocion?.toLowerCase()))
    .reduce((sum, d) => sum + (d.cantidad || 0), 0);
  const pctNegativas = (totalNegativas / total) * 100;

  if (pctNegativas > 60) {
    insights.push(`[ALERTA] El ${pctNegativas.toFixed(0)}% de los análisis muestran emociones que podrían requerir atención.`);
  } else if (pctNegativas < 40) {
    insights.push(`[OK] Distribución saludable: solo el ${pctNegativas.toFixed(0)}% corresponde a emociones de alerta.`);
  }

  // Detectar emociones ausentes
  const emocionesPosibles = ['ansiedad', 'estres', 'felicidad', 'tristeza', 'miedo', 'enojo', 'neutral', 'sorpresa'];
  const presentes = data.map(d => d.emocion?.toLowerCase());
  const ausentes = emocionesPosibles.filter(e => !presentes.includes(e));
  
  if (ausentes.length > 0 && ausentes.length < 4) {
    insights.push(`Emociones sin registros: ${ausentes.join(', ')}.`);
  }

  return insights;
}

/**
 * Genera insights para gráfica de clasificación
 * @param {Array} data - Datos de clasificación
 * @returns {Array<string>} Lista de insights
 */
export function generateClasificacionInsights(data = []) {
  const insights = [];
  
  if (!data || data.length === 0) {
    return ['No hay datos de clasificación disponibles.'];
  }

  const total = data.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  if (total === 0) {
    return ['No se registraron clasificaciones en el periodo.'];
  }

  // Contar por nivel
  const niveles = {};
  data.forEach(item => {
    niveles[item.clasificacion] = item.cantidad || 0;
  });

  // Porcentaje de casos críticos (alto + muy_alto)
  const criticos = (niveles['alto'] || 0) + (niveles['muy_alto'] || 0);
  const pctCriticos = (criticos / total) * 100;

  if (pctCriticos > 30) {
    insights.push(`[ALERTA] El ${pctCriticos.toFixed(0)}% de los casos están en niveles altos o muy altos. Se recomienda acción inmediata.`);
  } else if (pctCriticos > 15) {
    insights.push(`El ${pctCriticos.toFixed(0)}% de los casos requieren seguimiento por niveles elevados.`);
  } else {
    insights.push(`[OK] Solo el ${pctCriticos.toFixed(0)}% de casos en niveles críticos. Buen estado general.`);
  }

  // Nivel más común
  const sorted = Object.entries(niveles).sort((a, b) => b[1] - a[1]);
  if (sorted[0]) {
    const [nivel, cantidad] = sorted[0];
    const pct = ((cantidad / total) * 100).toFixed(0);
    insights.push(`La clasificación más común es "${nivel.replace('_', ' ')}" con ${pct}% de los casos.`);
  }

  // Casos normales
  const normales = niveles['normal'] || 0;
  const pctNormales = (normales / total) * 100;
  if (pctNormales > 50) {
    insights.push(`[OK] Más de la mitad de los usuarios (${pctNormales.toFixed(0)}%) muestran niveles normales.`);
  }

  return insights;
}

/**
 * Genera insights para gráfica de grupos activos
 * @param {Array} data - Datos de actividad de grupos
 * @returns {Array<string>} Lista de insights
 */
export function generateGruposInsights(data = []) {
  const insights = [];
  
  if (!data || data.length === 0) {
    return ['No hay datos de actividad de grupos.'];
  }

  const totalActividades = data.reduce((sum, g) => sum + (g.actividades_completadas || 0), 0);
  const totalMiembros = data.reduce((sum, g) => sum + (g.miembros_activos || 0), 0);

  insights.push(`${data.length} grupos activos con ${totalActividades} actividades completadas en total.`);

  // Grupo más activo
  const sorted = [...data].sort((a, b) => (b.actividades_completadas || 0) - (a.actividades_completadas || 0));
  if (sorted[0]) {
    insights.push(`El grupo más activo es "${sorted[0].nombre_grupo}" con ${sorted[0].actividades_completadas} actividades.`);
  }

  // Tasa de completado promedio
  const tasaCompletado = data.reduce((sum, g) => {
    if (g.total_actividades > 0) {
      return sum + (g.actividades_completadas / g.total_actividades);
    }
    return sum;
  }, 0) / data.length * 100;

  if (tasaCompletado > 70) {
    insights.push(`[OK] Excelente tasa de completado promedio: ${tasaCompletado.toFixed(0)}%.`);
  } else if (tasaCompletado > 40) {
    insights.push(`Tasa de completado promedio: ${tasaCompletado.toFixed(0)}%. Hay margen de mejora.`);
  } else {
    insights.push(`[ALERTA] Baja tasa de completado: ${tasaCompletado.toFixed(0)}%. Considerar incentivos o revisar actividades.`);
  }

  // Promedio de miembros por grupo
  const avgMiembros = totalMiembros / data.length;
  insights.push(`Promedio de ${avgMiembros.toFixed(1)} miembros activos por grupo.`);

  return insights;
}

/**
 * Genera insights para gráfica de efectividad de recomendaciones
 * @param {Array} data - Datos de efectividad
 * @returns {Array<string>} Lista de insights
 */
export function generateEfectividadInsights(data = []) {
  const insights = [];
  
  if (!data || data.length === 0) {
    return ['No hay datos de efectividad de recomendaciones.'];
  }

  const totalGeneradas = data.reduce((sum, r) => sum + (r.generadas || 0), 0);
  const totalUtiles = data.reduce((sum, r) => sum + (r.utiles || 0), 0);

  if (totalGeneradas === 0) {
    return ['No se generaron recomendaciones en el periodo.'];
  }

  const efectividadGlobal = (totalUtiles / totalGeneradas) * 100;
  
  if (efectividadGlobal > 70) {
    insights.push(`[OK] Excelente efectividad global: ${efectividadGlobal.toFixed(0)}% de las recomendaciones fueron útiles.`);
  } else if (efectividadGlobal > 40) {
    insights.push(`Efectividad global: ${efectividadGlobal.toFixed(0)}%. El sistema de recomendaciones funciona adecuadamente.`);
  } else {
    insights.push(`[ALERTA] Baja efectividad: solo ${efectividadGlobal.toFixed(0)}% útiles. Revisar algoritmo de recomendaciones.`);
  }

  // Tipo más efectivo
  const conEfectividad = data.map(r => ({
    ...r,
    efectividad: r.generadas > 0 ? (r.utiles / r.generadas) * 100 : 0
  })).sort((a, b) => b.efectividad - a.efectividad);

  if (conEfectividad[0] && conEfectividad[0].efectividad > 0) {
    insights.push(`Las recomendaciones de tipo "${conEfectividad[0].tipo}" son las más efectivas (${conEfectividad[0].efectividad.toFixed(0)}%).`);
  }

  // Tipo menos efectivo (con datos)
  const menosEfectivo = conEfectividad.filter(r => r.generadas > 5).sort((a, b) => a.efectividad - b.efectividad)[0];
  if (menosEfectivo && menosEfectivo.efectividad < 30) {
    insights.push(`Las de tipo "${menosEfectivo.tipo}" tienen menor efectividad (${menosEfectivo.efectividad.toFixed(0)}%). Considerar ajustes.`);
  }

  insights.push(`Total: ${totalGeneradas} recomendaciones generadas, ${totalUtiles} reportadas como útiles.`);

  return insights;
}

/**
 * Genera insights para tabla de alertas críticas
 * @param {Array} data - Datos de alertas
 * @returns {Array<string>} Lista de insights
 */
export function generateAlertasInsights(data = []) {
  const insights = [];
  
  if (!data || data.length === 0) {
    return ['[OK] No hay alertas críticas pendientes en el periodo.'];
  }

  insights.push(`${data.length} alertas críticas requieren atención.`);

  // Contar por tipo o severidad si existe
  const porTipo = {};
  data.forEach(alerta => {
    const tipo = alerta.tipo || alerta.severidad || 'general';
    porTipo[tipo] = (porTipo[tipo] || 0) + 1;
  });

  const tiposOrdenados = Object.entries(porTipo).sort((a, b) => b[1] - a[1]);
  if (tiposOrdenados.length > 1) {
    insights.push(`Tipo más frecuente: ${tiposOrdenados[0][0]} (${tiposOrdenados[0][1]} casos).`);
  }

  // Alertas recientes (últimas 24h)
  const ahora = new Date();
  const recientes = data.filter(a => {
    const fecha = new Date(a.fecha || a.created_at);
    return (ahora - fecha) < 24 * 60 * 60 * 1000;
  });
  
  if (recientes.length > 0) {
    insights.push(`[ALERTA] ${recientes.length} alertas en las últimas 24 horas.`);
  }

  return insights;
}

/**
 * Genera insights para tabla de top usuarios
 * @param {Array} data - Datos de usuarios
 * @param {string} metric - Métrica ordenada
 * @returns {Array<string>} Lista de insights
 */
export function generateTopUsuariosInsights(data = [], metric = 'ansiedad') {
  const insights = [];
  
  if (!data || data.length === 0) {
    return ['No hay datos de usuarios para el periodo.'];
  }

  insights.push(`${data.length} usuarios con análisis en el periodo seleccionado.`);

  // Promedio de la métrica
  const valores = data.map(u => u[metric] || u.promedio_ansiedad || 0).filter(v => typeof v === 'number');
  if (valores.length > 0) {
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    insights.push(`Promedio de ${metric}: ${promedio.toFixed(1)}%.`);

    // Usuarios en riesgo
    const enRiesgo = valores.filter(v => v > 70).length;
    if (enRiesgo > 0) {
      insights.push(`[ALERTA] ${enRiesgo} usuarios con niveles superiores al 70% requieren seguimiento.`);
    }
  }

  // Usuario más activo
  const masActivo = [...data].sort((a, b) => (b.total_analisis || 0) - (a.total_analisis || 0))[0];
  if (masActivo && masActivo.total_analisis > 0) {
    insights.push(`Usuario más activo con ${masActivo.total_analisis} análisis realizados.`);
  }

  return insights;
}
