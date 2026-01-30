-- migrations/create_auditoria_seguridad.sql
-- Create the auditoria_seguridad table used by backend/services/auditoria_service.py
-- Run this on the SerenVoice database to restore the missing table.

CREATE TABLE IF NOT EXISTS auditoria_seguridad (
  id_auditoria INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo_evento VARCHAR(50) NOT NULL,
  id_usuario INT UNSIGNED NULL,
  descripcion VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  datos_adicionales JSON NULL,
  exitoso TINYINT(1) NOT NULL DEFAULT 1,
  fecha_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_auditoria),
  INDEX idx_id_usuario (id_usuario),
  INDEX idx_fecha_evento (fecha_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: to enforce referential integrity, add a foreign key to usuario(id_usuario)
-- ALTER TABLE auditoria_seguridad
--   ADD CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario)
--   REFERENCES usuario(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE;
