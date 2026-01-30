-- ========================================================================
-- Migración: Sistema de Invitaciones a Grupos
-- Fecha: 2026-01-26
-- Descripción: Crea tabla para manejar invitaciones pendientes a grupos
--              en lugar de agregar miembros directamente
-- ========================================================================

-- --------------------------------------------------------
-- 1. Tabla para invitaciones a grupos
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `invitaciones_grupo` (
  `id_invitacion` INT(11) NOT NULL AUTO_INCREMENT,
  `id_grupo` INT(11) NOT NULL,
  `id_usuario_invitado` INT(11) NOT NULL COMMENT 'Usuario que recibe la invitación',
  `id_usuario_invita` INT(11) NOT NULL COMMENT 'Usuario que envía la invitación (facilitador/co-facilitador)',
  `estado` ENUM('pendiente', 'aceptada', 'rechazada', 'expirada', 'cancelada') DEFAULT 'pendiente',
  `mensaje` TEXT DEFAULT NULL COMMENT 'Mensaje opcional del invitador',
  `rol_propuesto` VARCHAR(50) DEFAULT 'participante' COMMENT 'Rol que tendrá si acepta',
  `fecha_invitacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_respuesta` DATETIME DEFAULT NULL,
  `fecha_expiracion` DATETIME DEFAULT NULL COMMENT 'Fecha límite para responder',
  `notificacion_enviada` TINYINT(1) DEFAULT 0,
  `activo` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id_invitacion`),
  UNIQUE KEY `uk_invitacion_pendiente` (`id_grupo`, `id_usuario_invitado`, `estado`),
  KEY `idx_invitacion_usuario` (`id_usuario_invitado`),
  KEY `idx_invitacion_grupo` (`id_grupo`),
  KEY `idx_invitacion_estado` (`estado`),
  KEY `idx_invitacion_fecha` (`fecha_invitacion`),
  CONSTRAINT `fk_invitacion_grupo` FOREIGN KEY (`id_grupo`) 
    REFERENCES `grupos` (`id_grupo`) ON DELETE CASCADE,
  CONSTRAINT `fk_invitacion_usuario` FOREIGN KEY (`id_usuario_invitado`) 
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_invitacion_invitador` FOREIGN KEY (`id_usuario_invita`) 
    REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- 2. Vista para invitaciones con información completa
-- --------------------------------------------------------

CREATE OR REPLACE VIEW `vista_invitaciones_grupo` AS
SELECT 
  ig.id_invitacion,
  ig.id_grupo,
  ig.id_usuario_invitado,
  ig.id_usuario_invita,
  ig.estado,
  ig.mensaje,
  ig.rol_propuesto,
  ig.fecha_invitacion,
  ig.fecha_respuesta,
  ig.fecha_expiracion,
  g.nombre_grupo,
  g.descripcion AS descripcion_grupo,
  g.tipo_grupo,
  g.privacidad,
  ui.nombre AS nombre_invitado,
  ui.apellido AS apellido_invitado,
  ui.correo AS correo_invitado,
  ui.foto_perfil AS foto_invitado,
  uf.nombre AS nombre_invitador,
  uf.apellido AS apellido_invitador,
  uf.foto_perfil AS foto_invitador,
  (SELECT COUNT(*) FROM grupo_miembros gm WHERE gm.id_grupo = ig.id_grupo AND gm.activo = 1) AS total_miembros
FROM invitaciones_grupo ig
JOIN grupos g ON ig.id_grupo = g.id_grupo
JOIN usuario ui ON ig.id_usuario_invitado = ui.id_usuario
JOIN usuario uf ON ig.id_usuario_invita = uf.id_usuario
WHERE ig.activo = 1;


-- --------------------------------------------------------
-- 3. Trigger para crear notificación al enviar invitación
-- --------------------------------------------------------

DELIMITER //

CREATE TRIGGER IF NOT EXISTS `trg_notificar_nueva_invitacion` 
AFTER INSERT ON `invitaciones_grupo` 
FOR EACH ROW 
BEGIN
  DECLARE v_nombre_grupo VARCHAR(200);
  DECLARE v_nombre_invitador VARCHAR(200);
  
  -- Obtener nombre del grupo
  SELECT nombre_grupo INTO v_nombre_grupo 
  FROM grupos WHERE id_grupo = NEW.id_grupo;
  
  -- Obtener nombre del invitador
  SELECT CONCAT(nombre, ' ', COALESCE(apellido, '')) INTO v_nombre_invitador 
  FROM usuario WHERE id_usuario = NEW.id_usuario_invita;
  
  -- Crear notificación para el usuario invitado
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
    '👥',
    CONCAT('/invitaciones/', NEW.id_invitacion),
    NEW.id_invitacion,
    'invitacion',
    'alta'
  );
  
  -- Marcar notificación como enviada
  UPDATE invitaciones_grupo 
  SET notificacion_enviada = 1 
  WHERE id_invitacion = NEW.id_invitacion;
  
END //

DELIMITER ;


-- --------------------------------------------------------
-- 4. Procedimiento para aceptar invitación
-- --------------------------------------------------------

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS `sp_aceptar_invitacion`(
  IN p_id_invitacion INT,
  IN p_id_usuario INT
)
BEGIN
  DECLARE v_id_grupo INT;
  DECLARE v_rol VARCHAR(50);
  DECLARE v_estado VARCHAR(20);
  
  -- Obtener datos de la invitación
  SELECT id_grupo, rol_propuesto, estado 
  INTO v_id_grupo, v_rol, v_estado
  FROM invitaciones_grupo 
  WHERE id_invitacion = p_id_invitacion 
    AND id_usuario_invitado = p_id_usuario;
  
  -- Verificar que la invitación existe y está pendiente
  IF v_estado IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invitación no encontrada';
  ELSEIF v_estado != 'pendiente' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La invitación ya fue respondida';
  END IF;
  
  -- Verificar que no sea ya miembro
  IF EXISTS (SELECT 1 FROM grupo_miembros WHERE id_grupo = v_id_grupo AND id_usuario = p_id_usuario AND activo = 1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya eres miembro de este grupo';
  END IF;
  
  -- Agregar como miembro
  INSERT INTO grupo_miembros (id_grupo, id_usuario, rol_grupo, activo, estado, fecha_ingreso)
  VALUES (v_id_grupo, p_id_usuario, v_rol, 1, 'activo', NOW());
  
  -- Actualizar estado de la invitación
  UPDATE invitaciones_grupo 
  SET estado = 'aceptada', fecha_respuesta = NOW()
  WHERE id_invitacion = p_id_invitacion;
  
  SELECT 'Invitación aceptada exitosamente' AS mensaje, v_id_grupo AS id_grupo;
  
END //

DELIMITER ;


-- --------------------------------------------------------
-- 5. Procedimiento para rechazar invitación
-- --------------------------------------------------------

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS `sp_rechazar_invitacion`(
  IN p_id_invitacion INT,
  IN p_id_usuario INT
)
BEGIN
  DECLARE v_estado VARCHAR(20);
  
  -- Obtener estado actual
  SELECT estado INTO v_estado
  FROM invitaciones_grupo 
  WHERE id_invitacion = p_id_invitacion 
    AND id_usuario_invitado = p_id_usuario;
  
  -- Verificar que la invitación existe y está pendiente
  IF v_estado IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invitación no encontrada';
  ELSEIF v_estado != 'pendiente' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La invitación ya fue respondida';
  END IF;
  
  -- Actualizar estado
  UPDATE invitaciones_grupo 
  SET estado = 'rechazada', fecha_respuesta = NOW()
  WHERE id_invitacion = p_id_invitacion;
  
  SELECT 'Invitación rechazada' AS mensaje;
  
END //

DELIMITER ;


-- --------------------------------------------------------
-- 6. Índice adicional para optimización
-- --------------------------------------------------------

-- Índice para buscar invitaciones pendientes de un usuario
CREATE INDEX IF NOT EXISTS `idx_invitaciones_pendientes` 
ON `invitaciones_grupo` (`id_usuario_invitado`, `estado`, `activo`);

