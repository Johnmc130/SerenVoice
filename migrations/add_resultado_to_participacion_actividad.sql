-- Agregar columnas para asociar resultado de análisis de voz a participación en actividad
-- Ejecutar: mysql -u admin -p serenvoice < migrations/add_resultado_to_participacion_actividad.sql

ALTER TABLE `participacion_actividad` 
ADD COLUMN IF NOT EXISTS `id_audio` INT(11) NULL DEFAULT NULL AFTER `notas_participante`,
ADD COLUMN IF NOT EXISTS `id_analisis` INT(11) NULL DEFAULT NULL AFTER `id_audio`,
ADD COLUMN IF NOT EXISTS `id_resultado` INT(11) NULL DEFAULT NULL AFTER `id_analisis`;

-- Índices para mejorar consultas
ALTER TABLE `participacion_actividad`
ADD INDEX IF NOT EXISTS `idx_pa_resultado` (`id_resultado`);

-- Foreign keys (opcionales, comentar si causa problemas)
-- ALTER TABLE `participacion_actividad`
--   ADD CONSTRAINT `fk_pa_audio` FOREIGN KEY (`id_audio`) REFERENCES `audios` (`id_audio`) ON DELETE SET NULL,
--   ADD CONSTRAINT `fk_pa_analisis` FOREIGN KEY (`id_analisis`) REFERENCES `analisis` (`id_analisis`) ON DELETE SET NULL,
--   ADD CONSTRAINT `fk_pa_resultado` FOREIGN KEY (`id_resultado`) REFERENCES `resultado_analisis` (`id_resultado`) ON DELETE SET NULL;
