-- ============================================================
-- AGREGAR COLUMNAS FALTANTES A participacion_actividad
-- Ejecutar: mysql -u admin -p serenvoice < migrations/fix_participacion_actividad.sql
-- ============================================================

-- Agregar columna 'completada' si no existe
ALTER TABLE `participacion_actividad` 
ADD COLUMN IF NOT EXISTS `completada` TINYINT(1) DEFAULT 0 AFTER `estado_emocional_despues`;

-- Agregar columna 'conectado' si no existe
ALTER TABLE `participacion_actividad` 
ADD COLUMN IF NOT EXISTS `conectado` TINYINT(1) DEFAULT 0 AFTER `completada`;

-- Agregar columna 'fecha_completada' si no existe
ALTER TABLE `participacion_actividad` 
ADD COLUMN IF NOT EXISTS `fecha_completada` DATETIME NULL AFTER `conectado`;

-- Agregar columna 'fecha_union' si no existe  
ALTER TABLE `participacion_actividad` 
ADD COLUMN IF NOT EXISTS `fecha_union` DATETIME DEFAULT CURRENT_TIMESTAMP AFTER `id_usuario`;

-- Crear índice para mejorar consultas
ALTER TABLE `participacion_actividad`
ADD INDEX IF NOT EXISTS `idx_pa_completada` (`id_actividad`, `completada`);

-- Verificar estructura final
SELECT 'Migración completada. Verificando estructura...' AS mensaje;
DESCRIBE `participacion_actividad`;
