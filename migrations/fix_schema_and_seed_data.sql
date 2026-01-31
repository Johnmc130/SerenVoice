-- ============================================================
-- CORRECCIÓN DE SCHEMA Y DATOS INICIALES
-- ============================================================

-- 1. AGREGAR COLUMNA id_resultado A alerta_analisis (si no existe)
-- Esto permite vincular alertas directamente con resultados
ALTER TABLE `alerta_analisis` 
ADD COLUMN IF NOT EXISTS `id_resultado` INT NULL AFTER `id_analisis`,
ADD COLUMN IF NOT EXISTS `tipo_recomendacion` VARCHAR(100) NULL AFTER `tipo_alerta`,
ADD COLUMN IF NOT EXISTS `titulo` VARCHAR(255) NULL AFTER `tipo_recomendacion`,
ADD COLUMN IF NOT EXISTS `descripcion` TEXT NULL AFTER `titulo`,
ADD COLUMN IF NOT EXISTS `contexto` JSON NULL AFTER `descripcion`,
ADD COLUMN IF NOT EXISTS `fecha` DATE NULL AFTER `contexto`,
ADD COLUMN IF NOT EXISTS `activo` BOOLEAN DEFAULT TRUE AFTER `fecha`;

-- Agregar foreign key para id_resultado si no existe
SET @constraint_exists = (
    SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'alerta_analisis' 
    AND CONSTRAINT_NAME = 'fk_alerta_resultado'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE `alerta_analisis` ADD CONSTRAINT `fk_alerta_resultado` FOREIGN KEY (`id_resultado`) REFERENCES `resultado_analisis`(`id_resultado`) ON DELETE CASCADE',
    'SELECT "FK ya existe"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS `idx_resultado` ON `alerta_analisis`(`id_resultado`);

-- 2. ACTUALIZAR TABLA resultado_analisis (agregar columnas necesarias)
ALTER TABLE `resultado_analisis`
ADD COLUMN IF NOT EXISTS `nivel_estres` DECIMAL(5,2) NULL AFTER `id_analisis`,
ADD COLUMN IF NOT EXISTS `nivel_ansiedad` DECIMAL(5,2) NULL AFTER `nivel_estres`,
ADD COLUMN IF NOT EXISTS `clasificacion` VARCHAR(50) NULL AFTER `nivel_ansiedad` COMMENT 'normal, leve, moderado, alto, muy_alto',
ADD COLUMN IF NOT EXISTS `emocion_dominante` VARCHAR(50) NULL AFTER `clasificacion`,
ADD COLUMN IF NOT EXISTS `confianza` DECIMAL(5,2) NULL AFTER `emocion_dominante`;

-- 3. CREAR TABLA notificaciones_plantillas (si no existe)
CREATE TABLE IF NOT EXISTS `notificaciones_plantillas` (
  `id_plantilla` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Código único para identificar la plantilla',
  `categoria` VARCHAR(50) NOT NULL COMMENT 'invitacion_grupo, actividad_grupo, recordatorio_actividad, etc.',
  `titulo` VARCHAR(255) NOT NULL,
  `mensaje` TEXT NOT NULL COMMENT 'Mensaje con variables {{nombre_variable}}',
  `icono` VARCHAR(50) NULL DEFAULT '📢',
  `url_patron` VARCHAR(255) NULL COMMENT 'URL con variables {{id_grupo}}, {{id_actividad}}',
  `prioridad` ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
  `tipo_notificacion` VARCHAR(50) NULL COMMENT 'push, email, inapp',
  `requiere_accion` BOOLEAN DEFAULT FALSE,
  `enviar_push` BOOLEAN DEFAULT TRUE,
  `enviar_email` BOOLEAN DEFAULT TRUE,
  `activo` BOOLEAN DEFAULT TRUE,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_plantilla`),
  INDEX `idx_codigo` (`codigo`),
  INDEX `idx_categoria` (`categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. INSERTAR PLANTILLAS DE NOTIFICACIONES
INSERT INTO `notificaciones_plantillas` 
  (`codigo`, `categoria`, `titulo`, `mensaje`, `icono`, `url_patron`, `prioridad`, `requiere_accion`, `enviar_push`, `enviar_email`, `activo`) 
VALUES
  ('invitacion_grupo', 'invitacion_grupo', 'Invitación a {{nombre_grupo}}', '{{nombre_facilitador}} te ha invitado a unirte al grupo "{{nombre_grupo}}". ¡Únete para participar en actividades terapéuticas!', '👥', '/grupos/invitacion/{{id_grupo}}', 'alta', TRUE, TRUE, TRUE, TRUE),
  ('nueva_actividad', 'actividad_grupo', 'Nueva actividad: {{titulo_actividad}}', 'Se ha creado una nueva actividad en {{nombre_grupo}}. Fecha: {{fecha_programada}}', '📋', '/grupos/{{id_grupo}}/actividades/{{id_actividad}}', 'media', FALSE, TRUE, TRUE, TRUE),
  ('recordatorio_actividad', 'recordatorio_actividad', 'Recordatorio: {{titulo_actividad}}', 'La actividad "{{titulo_actividad}}" está programada para {{fecha_programada}}. ¡No olvides participar!', '⏰', '/grupos/{{id_grupo}}/actividades/{{id_actividad}}', 'media', FALSE, TRUE, TRUE, TRUE),
  ('nueva_recomendacion', 'recomendacion', 'Nueva recomendación personalizada', 'Basado en tu último análisis, tenemos una recomendación de tipo {{tipo_recomendacion}} para ti.', '💡', '/recomendaciones/{{id_recomendacion}}', 'media', TRUE, FALSE, TRUE, TRUE),
  ('alerta_critica', 'alerta_critica', '⚠️ Alerta importante', '{{mensaje_alerta}}. Te recomendamos considerar apoyo profesional.', '🚨', '/alertas/{{id_alerta}}', 'urgente', TRUE, TRUE, TRUE, TRUE),
  ('logro_juego', 'logro_desbloqueado', '🎉 ¡Logro desbloqueado!', '¡Felicidades! Has completado {{nombre_logro}}. Sigue así.', '🏆', '/perfil/logros', 'baja', FALSE, TRUE, FALSE, TRUE),
  ('recordatorio_analisis', 'recordatorio_analisis', 'Es momento de registrar tu estado emocional', 'Han pasado {{dias}} días desde tu último análisis. ¿Cómo te sientes hoy?', '🎤', '/grabar', 'baja', FALSE, TRUE, TRUE, TRUE),
  ('mensaje_facilitador', 'mensaje_facilitador', 'Mensaje de {{nombre_facilitador}}', '{{mensaje}}', '💬', '/grupos/{{id_grupo}}/mensajes', 'media', FALSE, TRUE, TRUE, TRUE),
  ('sesion_grupal_iniciada', 'actividad_grupo', '🎤 Actividad Grupal: {{titulo}}', 'Se ha iniciado una actividad de análisis emocional en {{nombre_grupo}}. ¡Graba tu audio para participar!', '🎤', '/grupos/{{id_grupo}}/sesion/{{id_sesion}}', 'alta', FALSE, TRUE, TRUE, TRUE),
  ('sesion_grupal_completada', 'actividad_grupo', '✅ Actividad Completada: {{titulo}}', '¡Todos los miembros han completado la actividad! Ya puedes ver los resultados grupales.', '✅', '/grupos/{{id_grupo}}/sesion/{{id_sesion}}/resultados', 'alta', FALSE, TRUE, TRUE, TRUE),
  ('sesion_grupal_recordatorio', 'recordatorio_actividad', '⏰ Recordatorio: {{titulo}}', 'Aún no has grabado tu audio para la actividad grupal. ¡No te quedes fuera!', '⏰', '/grupos/{{id_grupo}}/sesion/{{id_sesion}}', 'media', FALSE, TRUE, TRUE, TRUE),
  ('alerta_critica_usuario', 'alerta_critica', '⚠️ Alerta Crítica', '{{mensaje_custom}}', '🚨', '', 'urgente', FALSE, FALSE, FALSE, TRUE),
  ('alerta_critica_facilitador', 'alerta_critica', '🚨 Alerta: Atención requerida', 'El usuario {{nombre_usuario}} {{apellido_usuario}} presenta niveles críticos (Estrés: {{nivel_estres}}%, Ansiedad: {{nivel_ansiedad}}%). Fecha: {{fecha_alerta}}', '🚨', '', 'urgente', FALSE, FALSE, FALSE, TRUE),
  ('alerta_alta', 'alerta_critica', '⚠️ Alerta Alta', '{{mensaje_custom}}', '⚠️', '', 'alta', FALSE, FALSE, FALSE, TRUE),
  ('alerta_alta_facilitador', 'alerta_critica', '⚠️ Alerta Alta: Seguimiento requerido', 'El usuario {{nombre_usuario}} {{apellido_usuario}} muestra niveles elevados (Estrés: {{nivel_estres}}%, Ansiedad: {{nivel_ansiedad}}%). Considera hacer seguimiento.', '⚠️', '', 'alta', FALSE, FALSE, FALSE, TRUE),
  ('alerta_media', 'recomendacion', '💡 Recomendación', '{{mensaje_personalizado}}', '💡', '', 'media', FALSE, FALSE, FALSE, TRUE)
ON DUPLICATE KEY UPDATE 
  `titulo` = VALUES(`titulo`),
  `mensaje` = VALUES(`mensaje`),
  `icono` = VALUES(`icono`),
  `url_patron` = VALUES(`url_patron`);

-- 5. CREAR TABLA juegos (si no existe)
CREATE TABLE IF NOT EXISTS `juegos` (
  `id_juego` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `tipo` VARCHAR(50) NOT NULL COMMENT 'respiracion, mindfulness, mandala, puzzle, memoria',
  `descripcion` TEXT NULL,
  `categoria` VARCHAR(50) NULL COMMENT 'ansiedad, estres, relajacion',
  `duracion_minutos` INT NULL DEFAULT 5,
  `icono` VARCHAR(50) NULL DEFAULT '🎮',
  `activo` BOOLEAN DEFAULT TRUE,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_juego`),
  INDEX `idx_tipo` (`tipo`),
  INDEX `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. INSERTAR JUEGOS INICIALES
INSERT INTO `juegos` 
  (`nombre`, `tipo`, `descripcion`, `categoria`, `duracion_minutos`, `icono`, `activo`) 
VALUES
  ('Respiración Guiada', 'respiracion', 'Ejercicio guiado de respiración 4-4-6 para reducir la ansiedad y el estrés. Inhala, mantén y exhala siguiendo el ritmo visual.', 'ansiedad', 5, '🌬️', TRUE),
  ('Jardín Zen', 'mindfulness', 'Crea tu jardín zen virtual mientras practicas la atención plena. Planta flores, árboles y cuida tu espacio de paz interior.', 'estres', 10, '🌳', TRUE),
  ('Mandala Creativo', 'mandala', 'Colorea mandalas terapéuticos para relajarte y fomentar la creatividad. Elige colores y patrones para expresar tu estado emocional.', 'estres', 7, '🎨', TRUE),
  ('Puzzle Numérico', 'puzzle', 'Resuelve el puzzle deslizante 3x3 ordenando los números del 1 al 8. Ejercita tu mente mientras te concentras en el presente.', 'ansiedad', 8, '🧩', TRUE),
  ('Juego de Memoria', 'memoria', 'Encuentra los pares de emojis iguales ejercitando tu memoria. Un juego relajante que mejora la concentración y reduce el estrés.', 'estres', 15, '🃏', TRUE)
ON DUPLICATE KEY UPDATE 
  `descripcion` = VALUES(`descripcion`),
  `duracion_minutos` = VALUES(`duracion_minutos`),
  `icono` = VALUES(`icono`);

-- 7. CREAR TABLA sesiones_juego (si no existe)
CREATE TABLE IF NOT EXISTS `sesiones_juego` (
  `id_sesion_juego` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_juego` INT NOT NULL,
  `fecha_inicio` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` TIMESTAMP NULL,
  `completado` BOOLEAN DEFAULT FALSE,
  `puntuacion` INT NULL,
  `duracion_segundos` INT NULL,
  `metadata` JSON NULL COMMENT 'Datos específicos del juego',
  PRIMARY KEY (`id_sesion_juego`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
  FOREIGN KEY (`id_juego`) REFERENCES `juegos`(`id_juego`) ON DELETE CASCADE,
  INDEX `idx_usuario_juego` (`id_usuario`, `id_juego`),
  INDEX `idx_fecha` (`fecha_inicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. VERIFICAR Y ACTUALIZAR DATOS EXISTENTES
-- Migrar alertas existentes que usan id_analisis a id_resultado
UPDATE `alerta_analisis` aa
INNER JOIN `resultado_analisis` ra ON aa.id_analisis = ra.id_analisis
SET aa.id_resultado = ra.id_resultado
WHERE aa.id_resultado IS NULL;

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================

SELECT 'Migración completada exitosamente. Schema actualizado y datos iniciales insertados.' AS mensaje;
