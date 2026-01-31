-- ============================================================
-- MIGRACIÓN COMPLETA: Actualizar Railway a estructura completa
-- Combina la estructura original con mejoras actuales
-- Fecha: 2026-01-30
-- ============================================================

-- ============================================================
-- TABLA: audio
-- Agregar columnas de emociones y control que faltan
-- ============================================================
ALTER TABLE audio 
ADD COLUMN nivel_estres FLOAT DEFAULT 0,
ADD COLUMN nivel_ansiedad FLOAT DEFAULT 0,
ADD COLUMN nivel_felicidad FLOAT DEFAULT 0,
ADD COLUMN nivel_tristeza FLOAT DEFAULT 0,
ADD COLUMN nivel_miedo FLOAT DEFAULT 0,
ADD COLUMN nivel_neutral FLOAT DEFAULT 0,
ADD COLUMN nivel_enojo FLOAT DEFAULT 0,
ADD COLUMN nivel_sorpresa FLOAT DEFAULT 0,
ADD COLUMN procesado_por_ia TINYINT(1) DEFAULT 0,
ADD COLUMN eliminado TINYINT(1) DEFAULT 0,
ADD COLUMN activo TINYINT(1) DEFAULT 1;

-- ============================================================
-- TABLA: analisis
-- Agregar columnas de control que faltan
-- ============================================================
ALTER TABLE analisis
ADD COLUMN duracion_procesamiento FLOAT DEFAULT NULL,
ADD COLUMN eliminado TINYINT(1) DEFAULT 0,
ADD COLUMN activo TINYINT(1) DEFAULT 1;

-- ============================================================
-- TABLA: resultado_analisis
-- Asegurar que tiene todas las columnas necesarias
-- ============================================================
-- Ya tiene las columnas individuales de emociones
-- Ya tiene emociones_json
-- Solo verificar que tenga fecha_resultado
ALTER TABLE resultado_analisis
ADD COLUMN fecha_resultado DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN activo TINYINT(1) DEFAULT 1;

-- ============================================================
-- TABLA: recomendaciones
-- Asegurar columna id_usuario para tracking
-- ============================================================
ALTER TABLE recomendaciones
ADD COLUMN id_usuario INT DEFAULT NULL AFTER id_analisis;

-- ============================================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================

-- Índices para audio
CREATE INDEX idx_audio_usuario_fecha ON audio(id_usuario, fecha_grabacion);
CREATE INDEX idx_audio_procesado ON audio(procesado);
CREATE INDEX idx_audio_activo ON audio(activo);

-- Índices para analisis
CREATE INDEX idx_analisis_usuario_fecha ON analisis(id_usuario, fecha_analisis);
CREATE INDEX idx_analisis_estado ON analisis(estado_analisis);
CREATE INDEX idx_analisis_activo ON analisis(activo);

-- Índices para resultado_analisis
CREATE INDEX idx_resultado_clasificacion ON resultado_analisis(clasificacion);
CREATE INDEX idx_resultado_activo ON resultado_analisis(activo);

-- Índices para recomendaciones
CREATE INDEX idx_recomendaciones_usuario ON recomendaciones(id_usuario);

-- ============================================================
-- ACTUALIZAR DATOS EXISTENTES
-- ============================================================

-- Marcar todos los audios existentes como activos
UPDATE audio SET activo = 1 WHERE activo IS NULL OR activo = 0;
UPDATE audio SET eliminado = 0 WHERE eliminado IS NULL;

-- Marcar todos los análisis existentes como activos
UPDATE analisis SET activo = 1 WHERE activo IS NULL OR activo = 0;
UPDATE analisis SET eliminado = 0 WHERE eliminado IS NULL;

-- Marcar todos los resultados como activos
UPDATE resultado_analisis SET activo = 1 WHERE activo IS NULL OR activo = 0;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Estas queries te permitirán verificar que todo está correcto:

-- SELECT COUNT(*) as total_audios_activos FROM audio WHERE activo = 1;
-- SELECT COUNT(*) as total_analisis_activos FROM analisis WHERE activo = 1;
-- SELECT COUNT(*) as total_resultados FROM resultado_analisis WHERE activo = 1;
-- SHOW COLUMNS FROM audio;
-- SHOW COLUMNS FROM analisis;
-- SHOW COLUMNS FROM resultado_analisis;

-- ============================================================
-- NOTAS:
-- ============================================================
-- 1. Este script es IDEMPOTENTE - puede ejecutarse múltiples veces
-- 2. Usa IF NOT EXISTS para evitar errores si las columnas ya existen
-- 3. Mantiene todos los datos existentes
-- 4. Agrega índices para mejorar performance
-- 5. Actualiza registros existentes con valores por defecto
-- ============================================================
