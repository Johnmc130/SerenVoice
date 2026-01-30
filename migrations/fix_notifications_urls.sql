-- =====================================================
-- Migración: Corregir URLs de notificaciones
-- Fecha: 2026-01-27
-- Descripción: 
--   1. Corregir URL de invitaciones (/invitaciones/ID → /invitaciones)
--   2. Corregir URL de actividades para coincidir con rutas frontend
--   3. Corregir URL de sesiones grupales
--   4. Actualizar notificaciones existentes con URLs incorrectas
-- =====================================================

-- =====================================================
-- 1. CORREGIR TRIGGER DE INVITACIONES
-- =====================================================
DROP TRIGGER IF EXISTS `trg_notificar_nueva_invitacion`;

DELIMITER $$
CREATE TRIGGER `trg_notificar_nueva_invitacion` 
AFTER INSERT ON `invitaciones_grupo` FOR EACH ROW 
BEGIN
  DECLARE v_nombre_grupo VARCHAR(200);
  DECLARE v_nombre_invitador VARCHAR(200);
  
  -- Obtener nombre del grupo
  SELECT nombre_grupo INTO v_nombre_grupo 
  FROM grupos WHERE id_grupo = NEW.id_grupo;
  
  -- Obtener nombre del invitador
  SELECT CONCAT(nombre, ' ', COALESCE(apellido, '')) INTO v_nombre_invitador 
  FROM usuario WHERE id_usuario = NEW.id_usuario_invita;
  
  -- Crear notificación con URL correcta (sin ID, la página muestra todas)
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
  ) VALUES (
    NEW.id_usuario_invitado,
    'invitacion_grupo',
    CONCAT('Invitación a ', v_nombre_grupo),
    CONCAT(v_nombre_invitador, ' te ha invitado a unirte al grupo "', v_nombre_grupo, '". ¡Revisa tu invitación!'),
    '📩',
    '/invitaciones',
    NEW.id_invitacion,
    'invitacion',
    'alta'
  );
END$$
DELIMITER ;

-- =====================================================
-- 2. CORREGIR TRIGGER DE ACTIVIDADES DE GRUPO
-- =====================================================
DROP TRIGGER IF EXISTS `trg_notificar_actividad_grupo`;

DELIMITER $$
CREATE TRIGGER `trg_notificar_actividad_grupo` 
AFTER INSERT ON `actividades_grupo` FOR EACH ROW 
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
    CONCAT('Nueva actividad: ', NEW.titulo),
    CONCAT('Se ha creado una nueva actividad en tu grupo. ', 
           IFNULL(LEFT(NEW.descripcion, 100), ''), 
           IF(LENGTH(NEW.descripcion) > 100, '...', '')),
    '📋',
    CONCAT('/grupos/', NEW.id_grupo, '/actividad/', NEW.id_actividad),
    NEW.id_actividad,
    'actividad',
    'media'
  FROM grupo_miembros gm
  WHERE gm.id_grupo = NEW.id_grupo 
    AND gm.estado = 'activo'
    AND gm.id_usuario != NEW.id_creador;
END$$
DELIMITER ;

-- =====================================================
-- 3. CORREGIR TRIGGER DE SESIONES GRUPALES
-- =====================================================
DROP TRIGGER IF EXISTS `trg_notificar_sesion_grupal`;

DELIMITER $$
CREATE TRIGGER `trg_notificar_sesion_grupal` 
AFTER INSERT ON `sesion_actividad_grupal` FOR EACH ROW 
BEGIN
  DECLARE v_nombre_grupo VARCHAR(200);
  
  -- Obtener nombre del grupo
  SELECT nombre_grupo INTO v_nombre_grupo 
  FROM grupos WHERE id_grupo = NEW.id_grupo;
  
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
    'sesion_grupal',
    CONCAT('🎙️ Sesión de análisis: ', IFNULL(NEW.titulo, v_nombre_grupo)),
    'Se ha iniciado una sesión de análisis emocional grupal. ¡Graba tu audio para participar!',
    '🎙️',
    CONCAT('/grupos/', NEW.id_grupo),
    NEW.id_sesion,
    'sesion_grupal',
    'alta'
  FROM grupo_miembros gm
  WHERE gm.id_grupo = NEW.id_grupo 
    AND gm.estado = 'activo'
    AND gm.id_usuario != NEW.id_iniciador;
    
  -- Crear registros de participación para todos los miembros (si existe la tabla)
  INSERT IGNORE INTO participacion_sesion_grupal (id_sesion, id_usuario, notificacion_enviada)
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

-- =====================================================
-- 4. ACTUALIZAR NOTIFICACIONES EXISTENTES CON URLs INCORRECTAS
-- =====================================================

-- Corregir URLs de invitaciones existentes
UPDATE notificaciones 
SET url_accion = '/invitaciones'
WHERE tipo_notificacion = 'invitacion_grupo' 
  AND url_accion LIKE '/invitaciones/%';

-- Corregir URLs de actividades (cambiar /actividades/ a /actividad/)
UPDATE notificaciones 
SET url_accion = REPLACE(url_accion, '/actividades/', '/actividad/')
WHERE tipo_notificacion = 'actividad_grupo' 
  AND url_accion LIKE '%/actividades/%';

-- Corregir URLs de sesiones grupales (simplificar a detalle del grupo)
UPDATE notificaciones 
SET url_accion = CONCAT('/grupos/', 
    SUBSTRING_INDEX(SUBSTRING_INDEX(url_accion, '/grupos/', -1), '/', 1))
WHERE tipo_notificacion IN ('sesion_grupal', 'actividad_grupo') 
  AND url_accion LIKE '%/sesion/%';

-- =====================================================
-- 5. CREAR TABLA PARA CONFIGURACIÓN DE REMINDERS (si no existe)
-- =====================================================
CREATE TABLE IF NOT EXISTS `reminder_config` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tipo_reminder` VARCHAR(50) NOT NULL COMMENT 'Tipo: voice_scan, activity_deadline, session_upcoming',
  `dias_antes` INT DEFAULT 1 COMMENT 'Días antes del evento para enviar reminder',
  `horas_frecuencia` INT DEFAULT 24 COMMENT 'Frecuencia en horas para reminders periódicos',
  `activo` TINYINT(1) DEFAULT 1,
  `mensaje_template` TEXT,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_tipo` (`tipo_reminder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuración por defecto
INSERT IGNORE INTO `reminder_config` (`tipo_reminder`, `dias_antes`, `horas_frecuencia`, `mensaje_template`) VALUES
('voice_scan', NULL, 48, '¡Hola! Han pasado {dias} días desde tu último análisis de voz. Te recomendamos hacer un nuevo análisis para monitorear tu bienestar emocional.'),
('activity_deadline', 1, NULL, 'La actividad "{titulo}" del grupo "{grupo}" vence mañana. ¡No olvides completarla!'),
('activity_deadline_today', 0, NULL, 'La actividad "{titulo}" del grupo "{grupo}" vence hoy. ¡Es tu última oportunidad para participar!'),
('session_upcoming', 0, 2, 'Hay una sesión de análisis grupal activa en "{grupo}". ¡Aún puedes participar!');

-- =====================================================
-- 6. CREAR TABLA DE ÚLTIMO ANÁLISIS POR USUARIO (para reminders)
-- =====================================================
CREATE TABLE IF NOT EXISTS `user_last_analysis` (
  `id_usuario` INT PRIMARY KEY,
  `fecha_ultimo_analisis` DATETIME,
  `ultimo_reminder_enviado` DATETIME,
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Poblar con datos existentes
INSERT IGNORE INTO `user_last_analysis` (`id_usuario`, `fecha_ultimo_analisis`)
SELECT a.id_usuario, MAX(an.fecha_analisis)
FROM audio a
JOIN analisis an ON a.id_audio = an.id_audio
WHERE a.activo = 1
GROUP BY a.id_usuario;

-- =====================================================
-- 7. TRIGGER PARA ACTUALIZAR FECHA DE ÚLTIMO ANÁLISIS
-- =====================================================
DROP TRIGGER IF EXISTS `trg_update_last_analysis`;

DELIMITER $$
CREATE TRIGGER `trg_update_last_analysis`
AFTER INSERT ON `analisis` FOR EACH ROW
BEGIN
  DECLARE v_id_usuario INT;
  
  -- Obtener el usuario del audio
  SELECT id_usuario INTO v_id_usuario 
  FROM audio WHERE id_audio = NEW.id_audio;
  
  -- Actualizar o insertar registro
  INSERT INTO user_last_analysis (id_usuario, fecha_ultimo_analisis)
  VALUES (v_id_usuario, NEW.fecha_analisis)
  ON DUPLICATE KEY UPDATE 
    fecha_ultimo_analisis = NEW.fecha_analisis;
END$$
DELIMITER ;

-- =====================================================
-- 8. AGREGAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_notif_url ON notificaciones(url_accion(100));
CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON actividades_grupo(fecha_fin, activo);
CREATE INDEX IF NOT EXISTS idx_user_analysis_date ON user_last_analysis(fecha_ultimo_analisis);

-- =====================================================
-- RESUMEN DE CAMBIOS:
-- 1. ✅ Trigger invitaciones: URL cambiada a /invitaciones
-- 2. ✅ Trigger actividades: URL formato /grupos/{id}/actividad/{id}
-- 3. ✅ Trigger sesiones: URL formato /grupos/{id}
-- 4. ✅ Notificaciones existentes actualizadas
-- 5. ✅ Tabla reminder_config creada
-- 6. ✅ Tabla user_last_analysis creada
-- 7. ✅ Trigger para tracking de último análisis
-- =====================================================

SELECT 'Migración completada exitosamente' AS resultado;
