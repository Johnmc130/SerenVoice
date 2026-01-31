-- ============================================================
-- TABLAS FALTANTES PARA RAILWAY - SERENVOICE
-- Este script crea SOLO las tablas que faltan
-- NO modifica datos existentes
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
-- 1. GRUPOS (base para todo el sistema grupal)
-- ============================================================
CREATE TABLE IF NOT EXISTS `grupos` (
  `id_grupo` INT NOT NULL AUTO_INCREMENT,
  `nombre_grupo` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  `id_creador` INT NOT NULL,
  `codigo_invitacion` VARCHAR(20) NULL UNIQUE,
  `es_privado` TINYINT(1) DEFAULT 1,
  `max_miembros` INT DEFAULT 50,
  `imagen_grupo` VARCHAR(255) NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `activo` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id_grupo`),
  KEY `idx_creador` (`id_creador`),
  KEY `idx_codigo` (`codigo_invitacion`),
  CONSTRAINT `fk_grupos_creador` FOREIGN KEY (`id_creador`) 
    REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. GRUPO_MIEMBROS
-- ============================================================
CREATE TABLE IF NOT EXISTS `grupo_miembros` (
  `id_miembro` INT NOT NULL AUTO_INCREMENT,
  `id_grupo` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `rol_grupo` ENUM('admin', 'moderador', 'miembro') DEFAULT 'miembro',
  `estado` ENUM('activo', 'inactivo', 'expulsado', 'pendiente') DEFAULT 'activo',
  `fecha_union` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_salida` TIMESTAMP NULL,
  `invitado_por` INT NULL,
  PRIMARY KEY (`id_miembro`),
  UNIQUE KEY `uk_grupo_usuario` (`id_grupo`, `id_usuario`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `fk_miembros_grupo` FOREIGN KEY (`id_grupo`) 
    REFERENCES `grupos`(`id_grupo`) ON DELETE CASCADE,
  CONSTRAINT `fk_miembros_usuario` FOREIGN KEY (`id_usuario`) 
    REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. INVITACIONES_GRUPO
-- ============================================================
CREATE TABLE IF NOT EXISTS `invitaciones_grupo` (
  `id_invitacion` INT NOT NULL AUTO_INCREMENT,
  `id_grupo` INT NOT NULL,
  `id_usuario_invitado` INT NULL,
  `correo_invitado` VARCHAR(150) NULL,
  `id_usuario_invitador` INT NOT NULL,
  `token` VARCHAR(100) NOT NULL UNIQUE,
  `estado` ENUM('pendiente', 'aceptada', 'rechazada', 'expirada', 'cancelada') DEFAULT 'pendiente',
  `mensaje_personal` TEXT NULL,
  `fecha_invitacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` TIMESTAMP NULL,
  `fecha_respuesta` TIMESTAMP NULL,
  PRIMARY KEY (`id_invitacion`),
  KEY `idx_grupo` (`id_grupo`),
  KEY `idx_usuario_invitado` (`id_usuario_invitado`),
  KEY `idx_token` (`token`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `fk_inv_grupo` FOREIGN KEY (`id_grupo`) 
    REFERENCES `grupos`(`id_grupo`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_invitado` FOREIGN KEY (`id_usuario_invitado`) 
    REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_invitador` FOREIGN KEY (`id_usuario_invitador`) 
    REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. ACTIVIDADES_GRUPO
-- ============================================================
CREATE TABLE IF NOT EXISTS `actividades_grupo` (
  `id_actividad` INT NOT NULL AUTO_INCREMENT,
  `id_grupo` INT NOT NULL,
  `id_creador` INT NOT NULL,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NULL,
  `tipo_actividad` ENUM('juego_grupal', 'ejercicio_respiracion', 'meditacion_guiada', 'reflexion', 'tarea', 'otro') DEFAULT 'tarea',
  `duracion_estimada` INT DEFAULT 5,
  `fecha_inicio` DATETIME NULL,
  `fecha_fin` DATE NULL,
  `completada` TINYINT(1) DEFAULT 0,
  `activo` TINYINT(1) DEFAULT 1,
  `es_actividad_voz` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id_actividad`),
  KEY `idx_grupo` (`id_grupo`),
  KEY `idx_creador` (`id_creador`),
  KEY `idx_tipo` (`tipo_actividad`),
  KEY `idx_fecha` (`fecha_inicio`),
  CONSTRAINT `fk_act_grupo` FOREIGN KEY (`id_grupo`) 
    REFERENCES `grupos`(`id_grupo`) ON DELETE CASCADE,
  CONSTRAINT `fk_act_creador` FOREIGN KEY (`id_creador`) 
    REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. ANALISIS_VOZ_ACTIVIDAD (Sesiones de análisis grupal)
-- ============================================================
CREATE TABLE IF NOT EXISTS `analisis_voz_actividad` (
  `id_sesion` INT NOT NULL AUTO_INCREMENT,
  `id_actividad` INT NOT NULL,
  `id_grupo` INT NOT NULL,
  `id_iniciador` INT NOT NULL,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NULL,
  `estado` ENUM('pendiente', 'en_progreso', 'completada', 'cancelada') DEFAULT 'pendiente',
  `total_participantes` INT DEFAULT 0,
  `participantes_completados` INT DEFAULT 0,
  `fecha_inicio` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_limite` DATETIME NULL,
  `fecha_completada` DATETIME NULL,
  `activo` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id_sesion`),
  KEY `idx_actividad` (`id_actividad`),
  KEY `idx_grupo` (`id_grupo`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `fk_ava_actividad` FOREIGN KEY (`id_actividad`) 
    REFERENCES `actividades_grupo`(`id_actividad`) ON DELETE CASCADE,
  CONSTRAINT `fk_ava_grupo` FOREIGN KEY (`id_grupo`) 
    REFERENCES `grupos`(`id_grupo`) ON DELETE CASCADE,
  CONSTRAINT `fk_ava_iniciador` FOREIGN KEY (`id_iniciador`) 
    REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. ANALISIS_VOZ_PARTICIPANTE
-- ============================================================
CREATE TABLE IF NOT EXISTS `analisis_voz_participante` (
  `id_participacion` INT NOT NULL AUTO_INCREMENT,
  `id_sesion` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `id_audio` INT NULL,
  `id_analisis` INT NULL,
  `estado` ENUM('pendiente', 'grabando', 'analizando', 'completado', 'error') DEFAULT 'pendiente',
  `fecha_invitacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_completado` DATETIME NULL,
  `notificacion_enviada` TINYINT(1) DEFAULT 0,
  `notas` TEXT NULL,
  PRIMARY KEY (`id_participacion`),
  UNIQUE KEY `uk_sesion_usuario` (`id_sesion`, `id_usuario`),
  KEY `idx_sesion` (`id_sesion`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `fk_avp_sesion` FOREIGN KEY (`id_sesion`) 
    REFERENCES `analisis_voz_actividad`(`id_sesion`) ON DELETE CASCADE,
  CONSTRAINT `fk_avp_usuario` FOREIGN KEY (`id_usuario`) 
    REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. ANALISIS_PARTICIPANTE_ACTIVIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS `analisis_participante_actividad` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_actividad` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `id_audio` INT NULL,
  `id_analisis` INT NULL,
  `estado` ENUM('pendiente', 'completado', 'cancelado') DEFAULT 'pendiente',
  `fecha_participacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `comentarios` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_act_usuario` (`id_actividad`, `id_usuario`),
  KEY `idx_actividad` (`id_actividad`),
  KEY `idx_usuario` (`id_usuario`),
  CONSTRAINT `fk_apa_actividad` FOREIGN KEY (`id_actividad`) 
    REFERENCES `actividades_grupo`(`id_actividad`) ON DELETE CASCADE,
  CONSTRAINT `fk_apa_usuario` FOREIGN KEY (`id_usuario`) 
    REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. PARTICIPACION_SESION_GRUPAL
-- ============================================================
CREATE TABLE IF NOT EXISTS `participacion_sesion_grupal` (
  `id_participacion` INT NOT NULL AUTO_INCREMENT,
  `id_sesion` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `id_audio` INT NULL,
  `id_analisis` INT NULL,
  `id_resultado` INT NULL,
  `estado` ENUM('pendiente', 'grabando', 'analizando', 'completado', 'error') DEFAULT 'pendiente',
  `fecha_invitacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_completado` DATETIME NULL,
  `notificacion_enviada` TINYINT(1) DEFAULT 0,
  `visto` TINYINT(1) DEFAULT 0,
  `notas` TEXT NULL,
  PRIMARY KEY (`id_participacion`),
  UNIQUE KEY `uk_sesion_usuario` (`id_sesion`, `id_usuario`),
  KEY `idx_sesion` (`id_sesion`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. PLANTILLAS_NOTIFICACION
-- ============================================================
CREATE TABLE IF NOT EXISTS `plantillas_notificacion` (
  `id_plantilla` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `tipo_notificacion` VARCHAR(50) NOT NULL,
  `titulo_template` VARCHAR(200) NOT NULL,
  `mensaje_template` TEXT NOT NULL,
  `icono` VARCHAR(10) DEFAULT '📢',
  `prioridad` ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
  `activa` TINYINT(1) DEFAULT 1,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_plantilla`),
  KEY `idx_codigo` (`codigo`),
  KEY `idx_tipo` (`tipo_notificacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. PREFERENCIAS_NOTIFICACION
-- ============================================================
CREATE TABLE IF NOT EXISTS `preferencias_notificacion` (
  `id_preferencia` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `tipo_notificacion` VARCHAR(50) NOT NULL,
  `habilitada` TINYINT(1) DEFAULT 1,
  `canal_email` TINYINT(1) DEFAULT 1,
  `canal_push` TINYINT(1) DEFAULT 1,
  `canal_app` TINYINT(1) DEFAULT 1,
  `hora_inicio_silencio` TIME NULL,
  `hora_fin_silencio` TIME NULL,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_preferencia`),
  UNIQUE KEY `uk_usuario_tipo` (`id_usuario`, `tipo_notificacion`),
  CONSTRAINT `fk_pref_usuario` FOREIGN KEY (`id_usuario`) 
    REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. JUEGOS_TERAPEUTICOS
-- ============================================================
CREATE TABLE IF NOT EXISTS `juegos_terapeuticos` (
  `id_juego` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  `tipo_juego` ENUM('respiracion', 'memoria', 'mandala', 'puzzle', 'mindfulness', 'otro') NOT NULL,
  `duracion_estimada` INT DEFAULT 5,
  `nivel_dificultad` ENUM('facil', 'medio', 'dificil') DEFAULT 'facil',
  `emociones_objetivo` JSON NULL COMMENT 'Emociones que ayuda a manejar',
  `instrucciones` TEXT NULL,
  `icono` VARCHAR(10) DEFAULT '🎮',
  `color_tema` VARCHAR(7) DEFAULT '#4CAF50',
  `activo` TINYINT(1) DEFAULT 1,
  `orden` INT DEFAULT 0,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_juego`),
  KEY `idx_tipo` (`tipo_juego`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. AUDITORIA_SEGURIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS `auditoria_seguridad` (
  `id_auditoria` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NULL,
  `tipo_evento` VARCHAR(50) NOT NULL,
  `descripcion` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `datos_adicionales` JSON NULL,
  `nivel_severidad` ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
  `fecha_evento` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_auditoria`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_tipo` (`tipo_evento`),
  KEY `idx_fecha` (`fecha_evento`),
  KEY `idx_severidad` (`nivel_severidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS INICIALES PARA JUEGOS_TERAPEUTICOS
-- ============================================================
INSERT IGNORE INTO `juegos_terapeuticos` (`nombre`, `descripcion`, `tipo_juego`, `duracion_estimada`, `nivel_dificultad`, `instrucciones`, `icono`, `color_tema`, `orden`) VALUES
('Respiración 4-7-8', 'Ejercicio de respiración para reducir ansiedad', 'respiracion', 5, 'facil', 'Inhala 4 seg, mantén 7 seg, exhala 8 seg', '🌬️', '#2196F3', 1),
('Memoria Emocional', 'Juego de memoria para ejercitar la mente', 'memoria', 10, 'medio', 'Encuentra las parejas de cartas', '🧠', '#9C27B0', 2),
('Mandala Zen', 'Colorea mandalas para relajarte', 'mandala', 15, 'facil', 'Elige colores y colorea el mandala', '🎨', '#4CAF50', 3),
('Puzzle Mental', 'Rompecabezas para concentración', 'puzzle', 10, 'medio', 'Ordena las piezas del 1 al 15', '🧩', '#FF9800', 4),
('Mindfulness Guiado', 'Ejercicios de atención plena', 'mindfulness', 10, 'facil', 'Sigue las instrucciones de meditación', '🧘', '#00BCD4', 5);

-- ============================================================
-- PLANTILLAS DE NOTIFICACIÓN INICIALES
-- ============================================================
INSERT IGNORE INTO `plantillas_notificacion` (`codigo`, `nombre`, `tipo_notificacion`, `titulo_template`, `mensaje_template`, `icono`, `prioridad`) VALUES
('ALERTA_ESTRES', 'Alerta de Estrés', 'alerta', '⚠️ Nivel de estrés elevado', 'Tu último análisis muestra un nivel de estrés alto. Te recomendamos un ejercicio de relajación.', '⚠️', 'alta'),
('INVITACION_GRUPO', 'Invitación a Grupo', 'invitacion', '👥 Nueva invitación', 'Has sido invitado a unirte al grupo {nombre_grupo}', '👥', 'media'),
('ACTIVIDAD_NUEVA', 'Nueva Actividad', 'actividad', '📋 Nueva actividad disponible', 'Se ha creado una nueva actividad en tu grupo: {titulo}', '📋', 'media'),
('RECORDATORIO', 'Recordatorio', 'recordatorio', '⏰ Recordatorio diario', 'No olvides hacer tu check-in emocional de hoy', '⏰', 'baja'),
('LOGRO_DESBLOQUEADO', 'Logro Desbloqueado', 'logro', '🏆 ¡Felicidades!', 'Has desbloqueado el logro: {nombre_logro}', '🏆', 'media');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT 'Tablas creadas exitosamente' AS resultado;
SELECT TABLE_NAME, TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
ORDER BY TABLE_NAME;
