-- ============================================================
-- MIGRACIÓN: Actividades Grupales con Análisis de Voz
-- Versión: 2.0
-- Fecha: 2026-01-07
-- Descripción: Agrega soporte para sesiones de análisis 
--              emocional grupal con grabación de audio
-- ============================================================

-- --------------------------------------------------------
-- 1. Tabla para sesiones de actividad grupal (análisis de voz grupal)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sesion_actividad_grupal` (
  `id_sesion` INT(11) NOT NULL AUTO_INCREMENT,
  `id_actividad` INT(11) NOT NULL,
  `id_grupo` INT(11) NOT NULL,
  `id_iniciador` INT(11) NOT NULL COMMENT 'Usuario que inició la sesión',
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `estado` ENUM('pendiente', 'en_progreso', 'completada', 'cancelada') DEFAULT 'pendiente',
  `total_participantes` INT(11) DEFAULT 0 COMMENT 'Total de miembros al iniciar',
  `participantes_completados` INT(11) DEFAULT 0,
  `fecha_inicio` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_limite` DATETIME DEFAULT NULL COMMENT 'Fecha límite para completar',
  `fecha_completada` DATETIME DEFAULT NULL,
  `activo` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id_sesion`),
  KEY `idx_sesion_actividad` (`id_actividad`),
  KEY `idx_sesion_grupo` (`id_grupo`),
  KEY `idx_sesion_estado` (`estado`),
  KEY `idx_sesion_fecha` (`fecha_inicio`),
  CONSTRAINT `fk_sesion_actividad` FOREIGN KEY (`id_actividad`) 
    REFERENCES `actividades_grupo` (`id_actividad`) ON DELETE CASCADE,
  CONSTRAINT `fk_sesion_grupo` FOREIGN KEY (`id_grupo`) 
    REFERENCES `grupos` (`id_grupo`) ON DELETE CASCADE,
  CONSTRAINT `fk_sesion_iniciador` FOREIGN KEY (`id_iniciador`) 
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- 2. Tabla para participación en sesión grupal (con audio)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `participacion_sesion_grupal` (
  `id_participacion` INT(11) NOT NULL AUTO_INCREMENT,
  `id_sesion` INT(11) NOT NULL,
  `id_usuario` INT(11) NOT NULL,
  `id_audio` INT(11) DEFAULT NULL COMMENT 'Audio grabado por el participante',
  `id_analisis` INT(11) DEFAULT NULL COMMENT 'Análisis del audio',
  `id_resultado` INT(11) DEFAULT NULL COMMENT 'Resultado del análisis individual',
  `estado` ENUM('pendiente', 'grabando', 'analizando', 'completado', 'error') DEFAULT 'pendiente',
  `fecha_invitacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_completado` DATETIME DEFAULT NULL,
  `notificacion_enviada` TINYINT(1) DEFAULT 0,
  `visto` TINYINT(1) DEFAULT 0 COMMENT 'Si el usuario vio la invitación',
  `notas` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_participacion`),
  UNIQUE KEY `uk_sesion_usuario` (`id_sesion`, `id_usuario`),
  KEY `idx_participacion_sesion` (`id_sesion`),
  KEY `idx_participacion_usuario` (`id_usuario`),
  KEY `idx_participacion_estado` (`estado`),
  CONSTRAINT `fk_participacion_sesion` FOREIGN KEY (`id_sesion`) 
    REFERENCES `sesion_actividad_grupal` (`id_sesion`) ON DELETE CASCADE,
  CONSTRAINT `fk_participacion_usuario` FOREIGN KEY (`id_usuario`) 
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_participacion_audio` FOREIGN KEY (`id_audio`) 
    REFERENCES `audio` (`id_audio`) ON DELETE SET NULL,
  CONSTRAINT `fk_participacion_analisis` FOREIGN KEY (`id_analisis`) 
    REFERENCES `analisis` (`id_analisis`) ON DELETE SET NULL,
  CONSTRAINT `fk_participacion_resultado` FOREIGN KEY (`id_resultado`) 
    REFERENCES `resultado_analisis` (`id_resultado`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- 3. Tabla para resultados agregados del grupo
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `resultado_grupal` (
  `id_resultado_grupal` INT(11) NOT NULL AUTO_INCREMENT,
  `id_sesion` INT(11) NOT NULL,
  `id_grupo` INT(11) NOT NULL,
  
  -- Promedios emocionales del grupo
  `promedio_felicidad` FLOAT DEFAULT 0,
  `promedio_tristeza` FLOAT DEFAULT 0,
  `promedio_enojo` FLOAT DEFAULT 0,
  `promedio_miedo` FLOAT DEFAULT 0,
  `promedio_sorpresa` FLOAT DEFAULT 0,
  `promedio_neutral` FLOAT DEFAULT 0,
  `promedio_estres` FLOAT DEFAULT 0,
  `promedio_ansiedad` FLOAT DEFAULT 0,
  
  -- Estadísticas adicionales
  `emocion_predominante` VARCHAR(50) DEFAULT NULL,
  `nivel_bienestar_grupal` FLOAT DEFAULT 0 COMMENT 'Índice de 0-100',
  `desviacion_estandar` FLOAT DEFAULT 0 COMMENT 'Variabilidad en el grupo',
  `confianza_promedio` FLOAT DEFAULT 0,
  
  -- Metadata
  `total_participantes` INT(11) DEFAULT 0,
  `fecha_calculo` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `resumen_ia` TEXT DEFAULT NULL COMMENT 'Análisis generado por IA',
  `recomendacion_grupal` TEXT DEFAULT NULL,
  `activo` TINYINT(1) DEFAULT 1,
  
  PRIMARY KEY (`id_resultado_grupal`),
  UNIQUE KEY `uk_resultado_sesion` (`id_sesion`),
  KEY `idx_resultado_grupo` (`id_grupo`),
  CONSTRAINT `fk_resultado_sesion` FOREIGN KEY (`id_sesion`) 
    REFERENCES `sesion_actividad_grupal` (`id_sesion`) ON DELETE CASCADE,
  CONSTRAINT `fk_resultado_grupo` FOREIGN KEY (`id_grupo`) 
    REFERENCES `grupos` (`id_grupo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- 4. Agregar columna tipo_actividad a actividades_grupo si no existe
-- --------------------------------------------------------

-- Verificar si la columna existe antes de agregarla
SET @columnExists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'actividades_grupo' 
    AND COLUMN_NAME = 'es_actividad_voz'
);

SET @sql = IF(@columnExists = 0,
  'ALTER TABLE `actividades_grupo` ADD COLUMN `es_actividad_voz` TINYINT(1) DEFAULT 0 COMMENT "Indica si es actividad de análisis de voz grupal"',
  'SELECT "Column already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- --------------------------------------------------------
-- 5. Trigger para notificar cuando se inicia una sesión grupal
-- --------------------------------------------------------

DROP TRIGGER IF EXISTS `trg_notificar_sesion_grupal`;

DELIMITER $$
CREATE TRIGGER `trg_notificar_sesion_grupal` 
AFTER INSERT ON `sesion_actividad_grupal` 
FOR EACH ROW 
BEGIN
  -- Crear notificaciones para todos los miembros activos del grupo
  INSERT INTO notificaciones (
    id_usuario, 
    tipo_notificacion, 
    titulo, 
    mensaje, 
    icono,
    url_accion, 
    id_referencia, 
    tipo_referencia, 
    prioridad
  )
  SELECT 
    gm.id_usuario,
    'actividad_grupo',
    CONCAT('🎤 Actividad Grupal: ', NEW.titulo),
    CONCAT('Se ha iniciado una actividad de análisis emocional en tu grupo. ¡Graba tu audio para participar!'),
    '🎤',
    CONCAT('/grupos/', NEW.id_grupo, '/sesion/', NEW.id_sesion),
    NEW.id_sesion,
    'sesion_grupal',
    'alta'
  FROM grupo_miembros gm
  WHERE gm.id_grupo = NEW.id_grupo 
    AND gm.estado = 'activo'
    AND gm.id_usuario != NEW.id_iniciador;
    
  -- Crear registros de participación para todos los miembros
  INSERT INTO participacion_sesion_grupal (id_sesion, id_usuario, notificacion_enviada)
  SELECT NEW.id_sesion, gm.id_usuario, 1
  FROM grupo_miembros gm
  WHERE gm.id_grupo = NEW.id_grupo 
    AND gm.estado = 'activo';
    
  -- Actualizar el total de participantes esperados
  UPDATE sesion_actividad_grupal 
  SET total_participantes = (
    SELECT COUNT(*) FROM grupo_miembros 
    WHERE id_grupo = NEW.id_grupo AND estado = 'activo'
  )
  WHERE id_sesion = NEW.id_sesion;
END$$
DELIMITER ;


-- --------------------------------------------------------
-- 6. Trigger para actualizar progreso cuando un participante completa
-- --------------------------------------------------------

DROP TRIGGER IF EXISTS `trg_actualizar_progreso_sesion`;

DELIMITER $$
CREATE TRIGGER `trg_actualizar_progreso_sesion` 
AFTER UPDATE ON `participacion_sesion_grupal` 
FOR EACH ROW 
BEGIN
  DECLARE v_completados INT;
  DECLARE v_total INT;
  
  -- Solo actuar si el estado cambió a 'completado'
  IF NEW.estado = 'completado' AND OLD.estado != 'completado' THEN
    
    -- Contar participantes completados
    SELECT COUNT(*) INTO v_completados
    FROM participacion_sesion_grupal
    WHERE id_sesion = NEW.id_sesion AND estado = 'completado';
    
    -- Obtener total de participantes
    SELECT total_participantes INTO v_total
    FROM sesion_actividad_grupal
    WHERE id_sesion = NEW.id_sesion;
    
    -- Actualizar contador en la sesión
    UPDATE sesion_actividad_grupal
    SET participantes_completados = v_completados
    WHERE id_sesion = NEW.id_sesion;
    
    -- Si todos completaron, marcar sesión como completada
    IF v_completados >= v_total AND v_total > 0 THEN
      UPDATE sesion_actividad_grupal
      SET estado = 'completada',
          fecha_completada = NOW()
      WHERE id_sesion = NEW.id_sesion;
    END IF;
  END IF;
END$$
DELIMITER ;


-- --------------------------------------------------------
-- 7. Vista para obtener el estado de sesiones grupales
-- --------------------------------------------------------

DROP VIEW IF EXISTS `vista_sesiones_grupales`;

CREATE VIEW `vista_sesiones_grupales` AS
SELECT 
  sag.id_sesion,
  sag.id_actividad,
  sag.id_grupo,
  g.nombre_grupo,
  sag.titulo,
  sag.descripcion,
  sag.estado,
  sag.total_participantes,
  sag.participantes_completados,
  CASE 
    WHEN sag.total_participantes > 0 
    THEN ROUND((sag.participantes_completados * 100.0) / sag.total_participantes, 1)
    ELSE 0 
  END as porcentaje_completado,
  sag.fecha_inicio,
  sag.fecha_limite,
  sag.fecha_completada,
  u.nombre as iniciador_nombre,
  u.apellido as iniciador_apellido,
  rg.id_resultado_grupal,
  rg.emocion_predominante,
  rg.nivel_bienestar_grupal
FROM sesion_actividad_grupal sag
JOIN grupos g ON sag.id_grupo = g.id_grupo
JOIN usuario u ON sag.id_iniciador = u.id_usuario
LEFT JOIN resultado_grupal rg ON sag.id_sesion = rg.id_sesion
WHERE sag.activo = 1;


-- --------------------------------------------------------
-- 8. Vista para participaciones en sesión
-- --------------------------------------------------------

DROP VIEW IF EXISTS `vista_participaciones_sesion`;

CREATE VIEW `vista_participaciones_sesion` AS
SELECT 
  psg.id_participacion,
  psg.id_sesion,
  psg.id_usuario,
  u.nombre,
  u.apellido,
  u.foto_perfil,
  psg.estado,
  psg.fecha_invitacion,
  psg.fecha_completado,
  psg.visto,
  ra.emocion_dominante as emocion_individual,
  ra.nivel_estres,
  ra.nivel_ansiedad,
  ra.nivel_felicidad,
  COALESCE(ra.confianza_modelo, 0) as confianza
FROM participacion_sesion_grupal psg
JOIN usuario u ON psg.id_usuario = u.id_usuario
LEFT JOIN resultado_analisis ra ON psg.id_resultado = ra.id_resultado;


-- --------------------------------------------------------
-- 9. Agregar nuevas plantillas de notificación
-- --------------------------------------------------------

INSERT IGNORE INTO `plantillas_notificacion` 
(`codigo`, `tipo_notificacion`, `titulo_template`, `mensaje_template`, `icono`, `url_template`, `prioridad_default`, `enviar_push`, `activo`) 
VALUES 
('sesion_grupal_iniciada', 'actividad_grupo', '🎤 Actividad Grupal: {{titulo}}', 'Se ha iniciado una actividad de análisis emocional en {{nombre_grupo}}. ¡Graba tu audio para participar!', '🎤', '/grupos/{{id_grupo}}/sesion/{{id_sesion}}', 'alta', 1, 1),
('sesion_grupal_completada', 'actividad_grupo', '✅ Actividad Completada: {{titulo}}', '¡Todos los miembros han completado la actividad! Ya puedes ver los resultados grupales.', '✅', '/grupos/{{id_grupo}}/sesion/{{id_sesion}}/resultados', 'alta', 1, 1),
('sesion_grupal_recordatorio', 'recordatorio_actividad', '⏰ Recordatorio: {{titulo}}', 'Aún no has grabado tu audio para la actividad grupal. ¡No te quedes fuera!', '⏰', '/grupos/{{id_grupo}}/sesion/{{id_sesion}}', 'media', 1, 1);


-- --------------------------------------------------------
-- 10. Índices adicionales para optimización
-- --------------------------------------------------------

-- Índice para búsqueda de sesiones activas por grupo
CREATE INDEX IF NOT EXISTS `idx_sesion_grupo_activo` 
ON `sesion_actividad_grupal` (`id_grupo`, `activo`, `estado`);

-- Índice para participaciones pendientes por usuario
CREATE INDEX IF NOT EXISTS `idx_participacion_usuario_estado` 
ON `participacion_sesion_grupal` (`id_usuario`, `estado`);


-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================

SELECT 'Migración de Actividades Grupales v2 completada exitosamente' as mensaje;
