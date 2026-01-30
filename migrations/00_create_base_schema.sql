-- ============================================================
-- SCHEMA BASE PARA SERENVOICE
-- ============================================================

-- Tabla usuario (principal)
CREATE TABLE IF NOT EXISTS `usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(150) NOT NULL UNIQUE,
  `contrasena` VARCHAR(255) NOT NULL,
  `fecha_nacimiento` DATE NULL,
  `edad` INT NULL,
  `genero` CHAR(1) NULL COMMENT 'M, F, O',
  `usa_medicamentos` BOOLEAN DEFAULT FALSE,
  `foto_perfil` VARCHAR(255) NULL,
  `auth_provider` VARCHAR(50) DEFAULT 'local' COMMENT 'local, google',
  `email_verificado` BOOLEAN DEFAULT FALSE,
  `token_verificacion` VARCHAR(255) NULL,
  `token_verificacion_expira` DATETIME NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `activo` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`id_usuario`),
  INDEX `idx_correo` (`correo`),
  INDEX `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla rol
CREATE TABLE IF NOT EXISTS `rol` (
  `id_rol` INT NOT NULL AUTO_INCREMENT,
  `nombre_rol` VARCHAR(50) NOT NULL UNIQUE COMMENT 'usuario, administrador, terapeuta',
  `descripcion` TEXT NULL,
  `activo` BOOLEAN DEFAULT TRUE,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla intermedia rol_usuario
CREATE TABLE IF NOT EXISTS `rol_usuario` (
  `id_rol_usuario` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_rol` INT NOT NULL,
  `fecha_asignacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rol_usuario`),
  UNIQUE KEY `unique_usuario_rol` (`id_usuario`, `id_rol`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
  FOREIGN KEY (`id_rol`) REFERENCES `rol`(`id_rol`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla audio
CREATE TABLE IF NOT EXISTS `audio` (
  `id_audio` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `ruta_archivo` VARCHAR(255) NOT NULL,
  `duracion_segundos` INT NULL,
  `formato` VARCHAR(10) NULL COMMENT 'wav, mp3, m4a',
  `fecha_subida` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_audio`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
  INDEX `idx_usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla analisis
CREATE TABLE IF NOT EXISTS `analisis` (
  `id_analisis` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_audio` INT NOT NULL,
  `emocion_detectada` VARCHAR(50) NULL COMMENT 'feliz, triste, enojado, neutral, ansioso',
  `nivel_estres` DECIMAL(5,2) NULL COMMENT '0-100',
  `nivel_ansiedad` DECIMAL(5,2) NULL COMMENT '0-100',
  `confianza_prediccion` DECIMAL(5,2) NULL COMMENT '0-100',
  `fecha_analisis` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `metadata` JSON NULL,
  PRIMARY KEY (`id_analisis`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
  FOREIGN KEY (`id_audio`) REFERENCES `audio`(`id_audio`) ON DELETE CASCADE,
  INDEX `idx_usuario_fecha` (`id_usuario`, `fecha_analisis`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla resultado_analisis
CREATE TABLE IF NOT EXISTS `resultado_analisis` (
  `id_resultado` INT NOT NULL AUTO_INCREMENT,
  `id_analisis` INT NOT NULL,
  `emociones_json` JSON NULL COMMENT 'Detalles de todas las emociones detectadas',
  `metricas_adicionales` JSON NULL,
  `fecha_generacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_resultado`),
  FOREIGN KEY (`id_analisis`) REFERENCES `analisis`(`id_analisis`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla recomendaciones
CREATE TABLE IF NOT EXISTS `recomendaciones` (
  `id_recomendacion` INT NOT NULL AUTO_INCREMENT,
  `id_resultado` INT NOT NULL,
  `tipo_recomendacion` VARCHAR(100) NULL COMMENT 'ejercicio_respiracion, meditacion, actividad_fisica',
  `descripcion` TEXT NOT NULL,
  `prioridad` INT DEFAULT 1 COMMENT '1=baja, 2=media, 3=alta',
  `aplicada` BOOLEAN DEFAULT FALSE,
  `util` BOOLEAN NULL COMMENT 'Feedback del usuario',
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_recomendacion`),
  FOREIGN KEY (`id_resultado`) REFERENCES `resultado_analisis`(`id_resultado`) ON DELETE CASCADE,
  INDEX `idx_resultado` (`id_resultado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla sesion (historial de sesiones de usuario)
CREATE TABLE IF NOT EXISTS `sesion` (
  `id_sesion` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `token_sesion` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `fecha_inicio` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` TIMESTAMP NULL,
  `activa` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`id_sesion`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
  INDEX `idx_usuario_activa` (`id_usuario`, `activa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla refresh_token
CREATE TABLE IF NOT EXISTS `refresh_token` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `token` VARCHAR(500) NOT NULL UNIQUE,
  `fecha_expiracion` DATETIME NOT NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `revocado` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
  INDEX `idx_token` (`token`),
  INDEX `idx_usuario_revocado` (`id_usuario`, `revocado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla alerta_analisis
CREATE TABLE IF NOT EXISTS `alerta_analisis` (
  `id_alerta` INT NOT NULL AUTO_INCREMENT,
  `id_analisis` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `nivel_severidad` VARCHAR(20) DEFAULT 'media' COMMENT 'baja, media, alta, critica',
  `tipo_alerta` VARCHAR(100) NULL COMMENT 'estres_alto, ansiedad_critica, depresion_detectada',
  `mensaje` TEXT NULL,
  `fecha_alerta` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `leida` BOOLEAN DEFAULT FALSE,
  `resuelta` BOOLEAN DEFAULT FALSE,
  `fecha_resolucion` TIMESTAMP NULL,
  PRIMARY KEY (`id_alerta`),
  FOREIGN KEY (`id_analisis`) REFERENCES `analisis`(`id_analisis`) ON DELETE CASCADE,
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
  INDEX `idx_usuario_leida` (`id_usuario`, `leida`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla historial_alerta
CREATE TABLE IF NOT EXISTS `historial_alerta` (
  `id_historial` INT NOT NULL AUTO_INCREMENT,
  `id_alerta` INT NOT NULL,
  `accion` VARCHAR(100) NULL COMMENT 'creada, leida, resuelta, escalada',
  `id_usuario_accion` INT NULL COMMENT 'Usuario que realizó la acción',
  `detalles` TEXT NULL,
  `fecha_accion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial`),
  FOREIGN KEY (`id_alerta`) REFERENCES `alerta_analisis`(`id_alerta`) ON DELETE CASCADE,
  FOREIGN KEY (`id_usuario_accion`) REFERENCES `usuario`(`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla reporte
CREATE TABLE IF NOT EXISTS `reporte` (
  `id_reporte` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `tipo_reporte` VARCHAR(50) NULL COMMENT 'semanal, mensual, personalizado',
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `ruta_archivo` VARCHAR(255) NULL,
  `fecha_generacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_reporte`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
  INDEX `idx_usuario_fecha` (`id_usuario`, `fecha_generacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla reporte_resultado
CREATE TABLE IF NOT EXISTS `reporte_resultado` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_reporte` INT NOT NULL,
  `id_resultado` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_reporte`) REFERENCES `reporte`(`id_reporte`) ON DELETE CASCADE,
  FOREIGN KEY (`id_resultado`) REFERENCES `resultado_analisis`(`id_resultado`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar roles por defecto
INSERT IGNORE INTO `rol` (`nombre_rol`, `descripcion`, `activo`) VALUES
('administrador', 'Acceso total al sistema', TRUE),
('usuario', 'Usuario estándar con acceso básico', TRUE),
('terapeuta', 'Profesional con acceso a datos de pacientes', TRUE);

-- Crear usuario admin por defecto (contraseña: Admin123)
-- Hash generado con werkzeug: scrypt:32768:8:1$...
INSERT IGNORE INTO `usuario` (`nombre`, `apellido`, `correo`, `contrasena`, `email_verificado`, `activo`) VALUES
('Admin', 'Sistema', 'admin@serenvoice.com', 'scrypt:32768:8:1$ZjTLKvYqtWv4oCqh$c8f99e4a258f5c0b7e8d9a7c5e6f7b8a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d', TRUE, TRUE);

-- Asignar rol administrador al usuario admin
INSERT IGNORE INTO `rol_usuario` (`id_usuario`, `id_rol`)
SELECT u.id_usuario, r.id_rol
FROM `usuario` u, `rol` r
WHERE u.correo = 'admin@serenvoice.com' AND r.nombre_rol = 'administrador';

-- Vista user_last_analysis (útil para el dashboard)
CREATE OR REPLACE VIEW `user_last_analysis` AS
SELECT 
  u.id_usuario,
  u.nombre,
  u.apellido,
  u.correo,
  MAX(a.fecha_analisis) AS ultima_fecha_analisis,
  COUNT(a.id_analisis) AS total_analisis
FROM usuario u
LEFT JOIN analisis a ON u.id_usuario = a.id_usuario
GROUP BY u.id_usuario, u.nombre, u.apellido, u.correo;
