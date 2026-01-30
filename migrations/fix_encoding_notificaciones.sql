-- ============================================================
-- MIGRACIÓN: Fix encoding de notificaciones
-- Fecha: 2026-01-18
-- Descripción: Corrige textos con encoding incorrecto (UTF-8 doble)
-- ============================================================

-- Verificar el charset actual de la tabla
-- SHOW CREATE TABLE notificaciones;

-- Actualizar títulos con encoding corrupto
UPDATE notificaciones 
SET titulo = 'Nueva recomendación personalizada'
WHERE titulo LIKE '%recomendaci%n%' 
  AND titulo LIKE '%Ã%';

-- Arreglar otros textos comunes con encoding corrupto
UPDATE notificaciones 
SET titulo = REPLACE(titulo, 'Ã³', 'ó')
WHERE titulo LIKE '%Ã³%';

UPDATE notificaciones 
SET titulo = REPLACE(titulo, 'Ã©', 'é')
WHERE titulo LIKE '%Ã©%';

UPDATE notificaciones 
SET titulo = REPLACE(titulo, 'Ã¡', 'á')
WHERE titulo LIKE '%Ã¡%';

UPDATE notificaciones 
SET titulo = REPLACE(titulo, 'Ã­', 'í')
WHERE titulo LIKE '%Ã­%';

UPDATE notificaciones 
SET titulo = REPLACE(titulo, 'Ãº', 'ú')
WHERE titulo LIKE '%Ãº%';

UPDATE notificaciones 
SET titulo = REPLACE(titulo, 'Ã±', 'ñ')
WHERE titulo LIKE '%Ã±%';

-- Lo mismo para el campo mensaje
UPDATE notificaciones 
SET mensaje = REPLACE(mensaje, 'Ã³', 'ó')
WHERE mensaje LIKE '%Ã³%';

UPDATE notificaciones 
SET mensaje = REPLACE(mensaje, 'Ã©', 'é')
WHERE mensaje LIKE '%Ã©%';

UPDATE notificaciones 
SET mensaje = REPLACE(mensaje, 'Ã¡', 'á')
WHERE mensaje LIKE '%Ã¡%';

UPDATE notificaciones 
SET mensaje = REPLACE(mensaje, 'Ã­', 'í')
WHERE mensaje LIKE '%Ã­%';

UPDATE notificaciones 
SET mensaje = REPLACE(mensaje, 'Ãº', 'ú')
WHERE mensaje LIKE '%Ãº%';

UPDATE notificaciones 
SET mensaje = REPLACE(mensaje, 'Ã±', 'ñ')
WHERE mensaje LIKE '%Ã±%';

-- Verificar después de la migración
-- SELECT id_notificacion, titulo, mensaje FROM notificaciones WHERE titulo LIKE '%recomendaci%' LIMIT 10;
