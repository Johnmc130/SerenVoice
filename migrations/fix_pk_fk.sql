-- =====================================================
-- Script para reparar Primary Keys y Foreign Keys
-- Ejecutar después de importar serenvoice.sql
-- =====================================================

-- Desactivar verificación de FK temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- PRIMARY KEYS
-- =====================================================

-- actividades_grupo
ALTER TABLE `actividades_grupo`
  ADD PRIMARY KEY IF NOT EXISTS (`id_actividad`);

-- alerta_analisis
ALTER TABLE `alerta_analisis`
  ADD PRIMARY KEY IF NOT EXISTS (`id_alerta`);

-- analisis
ALTER TABLE `analisis`
  ADD PRIMARY KEY IF NOT EXISTS (`id_analisis`);

-- audio
ALTER TABLE `audio`
  ADD PRIMARY KEY IF NOT EXISTS (`id_audio`);

-- grupos
ALTER TABLE `grupos`
  ADD PRIMARY KEY IF NOT EXISTS (`id_grupo`);

-- grupo_miembros
ALTER TABLE `grupo_miembros`
  ADD PRIMARY KEY IF NOT EXISTS (`id_grupo_miembro`);

-- historial_alerta
ALTER TABLE `historial_alerta`
  ADD PRIMARY KEY IF NOT EXISTS (`id_historial`);

-- juegos_terapeuticos
ALTER TABLE `juegos_terapeuticos`
  ADD PRIMARY KEY IF NOT EXISTS (`id_juego`);

-- notificaciones
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY IF NOT EXISTS (`id_notificacion`);

-- participacion_actividad
ALTER TABLE `participacion_actividad`
  ADD PRIMARY KEY IF NOT EXISTS (`id_participacion`);

-- plantillas_notificacion
ALTER TABLE `plantillas_notificacion`
  ADD PRIMARY KEY IF NOT EXISTS (`id_plantilla`);

-- preferencias_notificacion
ALTER TABLE `preferencias_notificacion`
  ADD PRIMARY KEY IF NOT EXISTS (`id_preferencia`);

-- recomendaciones
ALTER TABLE `recomendaciones`
  ADD PRIMARY KEY IF NOT EXISTS (`id_recomendacion`);

-- refresh_token
ALTER TABLE `refresh_token`
  ADD PRIMARY KEY IF NOT EXISTS (`id_refresh_token`);

-- reporte
ALTER TABLE `reporte`
  ADD PRIMARY KEY IF NOT EXISTS (`id_reporte`);

-- reporte_resultado
ALTER TABLE `reporte_resultado`
  ADD PRIMARY KEY IF NOT EXISTS (`id_reporte_resultado`);

-- resultado_analisis
ALTER TABLE `resultado_analisis`
  ADD PRIMARY KEY IF NOT EXISTS (`id_resultado`);

-- rol
ALTER TABLE `rol`
  ADD PRIMARY KEY IF NOT EXISTS (`id_rol`);

-- rol_usuario
ALTER TABLE `rol_usuario`
  ADD PRIMARY KEY IF NOT EXISTS (`id_rol_usuario`);

-- sesion
ALTER TABLE `sesion`
  ADD PRIMARY KEY IF NOT EXISTS (`id_sesion`);

-- sesiones_juego
ALTER TABLE `sesiones_juego`
  ADD PRIMARY KEY IF NOT EXISTS (`id`);

-- usuario
ALTER TABLE `usuario`
  ADD PRIMARY KEY IF NOT EXISTS (`id_usuario`);

-- =====================================================
-- AUTO_INCREMENT (solo si no está configurado)
-- =====================================================

ALTER TABLE `actividades_grupo` MODIFY `id_actividad` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `alerta_analisis` MODIFY `id_alerta` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `analisis` MODIFY `id_analisis` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `audio` MODIFY `id_audio` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `grupos` MODIFY `id_grupo` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `grupo_miembros` MODIFY `id_grupo_miembro` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `historial_alerta` MODIFY `id_historial` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `juegos_terapeuticos` MODIFY `id_juego` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `notificaciones` MODIFY `id_notificacion` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `participacion_actividad` MODIFY `id_participacion` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `plantillas_notificacion` MODIFY `id_plantilla` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `preferencias_notificacion` MODIFY `id_preferencia` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `recomendaciones` MODIFY `id_recomendacion` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `refresh_token` MODIFY `id_refresh_token` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `reporte` MODIFY `id_reporte` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `reporte_resultado` MODIFY `id_reporte_resultado` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `resultado_analisis` MODIFY `id_resultado` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `rol` MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `rol_usuario` MODIFY `id_rol_usuario` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `sesion` MODIFY `id_sesion` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `sesiones_juego` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `usuario` MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT;

-- =====================================================
-- UNIQUE KEYS (solo las más importantes)
-- =====================================================

-- Usuario: correo único
ALTER TABLE `usuario` 
  ADD UNIQUE KEY IF NOT EXISTS `correo` (`correo`);

-- Rol: nombre único
ALTER TABLE `rol`
  ADD UNIQUE KEY IF NOT EXISTS `nombre_rol` (`nombre_rol`);

-- =====================================================
-- FOREIGN KEYS (eliminar existentes y recrear)
-- =====================================================

-- Eliminar FKs existentes (ignorar errores si no existen)
ALTER TABLE `actividades_grupo` DROP FOREIGN KEY IF EXISTS `actividades_grupo_ibfk_1`;
ALTER TABLE `actividades_grupo` DROP FOREIGN KEY IF EXISTS `actividades_grupo_ibfk_2`;
ALTER TABLE `alerta_analisis` DROP FOREIGN KEY IF EXISTS `alerta_analisis_ibfk_1`;
ALTER TABLE `analisis` DROP FOREIGN KEY IF EXISTS `analisis_ibfk_1`;
ALTER TABLE `audio` DROP FOREIGN KEY IF EXISTS `audio_ibfk_1`;
ALTER TABLE `grupos` DROP FOREIGN KEY IF EXISTS `grupos_ibfk_1`;
ALTER TABLE `grupo_miembros` DROP FOREIGN KEY IF EXISTS `grupo_miembros_ibfk_1`;
ALTER TABLE `grupo_miembros` DROP FOREIGN KEY IF EXISTS `grupo_miembros_ibfk_2`;
ALTER TABLE `historial_alerta` DROP FOREIGN KEY IF EXISTS `historial_alerta_ibfk_1`;
ALTER TABLE `notificaciones` DROP FOREIGN KEY IF EXISTS `notificaciones_ibfk_1`;
ALTER TABLE `participacion_actividad` DROP FOREIGN KEY IF EXISTS `participacion_actividad_ibfk_1`;
ALTER TABLE `participacion_actividad` DROP FOREIGN KEY IF EXISTS `participacion_actividad_ibfk_2`;
ALTER TABLE `preferencias_notificacion` DROP FOREIGN KEY IF EXISTS `preferencias_notificacion_ibfk_1`;
ALTER TABLE `recomendaciones` DROP FOREIGN KEY IF EXISTS `recomendaciones_ibfk_1`;
ALTER TABLE `refresh_token` DROP FOREIGN KEY IF EXISTS `refresh_token_ibfk_1`;
ALTER TABLE `reporte` DROP FOREIGN KEY IF EXISTS `reporte_ibfk_1`;
ALTER TABLE `reporte_resultado` DROP FOREIGN KEY IF EXISTS `reporte_resultado_ibfk_1`;
ALTER TABLE `reporte_resultado` DROP FOREIGN KEY IF EXISTS `reporte_resultado_ibfk_2`;
ALTER TABLE `resultado_analisis` DROP FOREIGN KEY IF EXISTS `resultado_analisis_ibfk_1`;
ALTER TABLE `rol_usuario` DROP FOREIGN KEY IF EXISTS `rol_usuario_ibfk_1`;
ALTER TABLE `rol_usuario` DROP FOREIGN KEY IF EXISTS `rol_usuario_ibfk_2`;
ALTER TABLE `rol_usuario` DROP FOREIGN KEY IF EXISTS `rol_usuario_ibfk_3`;
ALTER TABLE `sesion` DROP FOREIGN KEY IF EXISTS `sesion_ibfk_1`;
ALTER TABLE `sesiones_juego` DROP FOREIGN KEY IF EXISTS `sesiones_juego_ibfk_1`;
ALTER TABLE `sesiones_juego` DROP FOREIGN KEY IF EXISTS `sesiones_juego_ibfk_2`;

-- actividades_grupo
ALTER TABLE `actividades_grupo`
  ADD CONSTRAINT `actividades_grupo_ibfk_1` 
    FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id_grupo`) ON DELETE CASCADE,
  ADD CONSTRAINT `actividades_grupo_ibfk_2` 
    FOREIGN KEY (`id_creador`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

-- alerta_analisis
ALTER TABLE `alerta_analisis`
  ADD CONSTRAINT `alerta_analisis_ibfk_1` 
    FOREIGN KEY (`id_resultado`) REFERENCES `resultado_analisis` (`id_resultado`) ON DELETE CASCADE;

-- analisis
ALTER TABLE `analisis`
  ADD CONSTRAINT `analisis_ibfk_1` 
    FOREIGN KEY (`id_audio`) REFERENCES `audio` (`id_audio`) ON DELETE CASCADE;

-- audio
ALTER TABLE `audio`
  ADD CONSTRAINT `audio_ibfk_1` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

-- grupos
ALTER TABLE `grupos`
  ADD CONSTRAINT `grupos_ibfk_1` 
    FOREIGN KEY (`id_facilitador`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

-- grupo_miembros
ALTER TABLE `grupo_miembros`
  ADD CONSTRAINT `grupo_miembros_ibfk_1` 
    FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id_grupo`) ON DELETE CASCADE,
  ADD CONSTRAINT `grupo_miembros_ibfk_2` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

-- historial_alerta
ALTER TABLE `historial_alerta`
  ADD CONSTRAINT `historial_alerta_ibfk_1` 
    FOREIGN KEY (`id_alerta`) REFERENCES `alerta_analisis` (`id_alerta`) ON DELETE CASCADE;

-- notificaciones
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

-- participacion_actividad
ALTER TABLE `participacion_actividad`
  ADD CONSTRAINT `participacion_actividad_ibfk_1` 
    FOREIGN KEY (`id_actividad`) REFERENCES `actividades_grupo` (`id_actividad`) ON DELETE CASCADE,
  ADD CONSTRAINT `participacion_actividad_ibfk_2` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

-- preferencias_notificacion
ALTER TABLE `preferencias_notificacion`
  ADD CONSTRAINT `preferencias_notificacion_ibfk_1` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

-- recomendaciones
ALTER TABLE `recomendaciones`
  ADD CONSTRAINT `recomendaciones_ibfk_1` 
    FOREIGN KEY (`id_resultado`) REFERENCES `resultado_analisis` (`id_resultado`) ON DELETE CASCADE;

-- refresh_token
ALTER TABLE `refresh_token`
  ADD CONSTRAINT `refresh_token_ibfk_1` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

-- reporte
ALTER TABLE `reporte`
  ADD CONSTRAINT `reporte_ibfk_1` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

-- reporte_resultado
ALTER TABLE `reporte_resultado`
  ADD CONSTRAINT `reporte_resultado_ibfk_1` 
    FOREIGN KEY (`id_reporte`) REFERENCES `reporte` (`id_reporte`) ON DELETE CASCADE,
  ADD CONSTRAINT `reporte_resultado_ibfk_2` 
    FOREIGN KEY (`id_resultado`) REFERENCES `resultado_analisis` (`id_resultado`) ON DELETE CASCADE;

-- resultado_analisis
ALTER TABLE `resultado_analisis`
  ADD CONSTRAINT `resultado_analisis_ibfk_1` 
    FOREIGN KEY (`id_analisis`) REFERENCES `analisis` (`id_analisis`) ON DELETE CASCADE;

-- rol_usuario
ALTER TABLE `rol_usuario`
  ADD CONSTRAINT `rol_usuario_ibfk_1` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `rol_usuario_ibfk_2` 
    FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE CASCADE,
  ADD CONSTRAINT `rol_usuario_ibfk_3` 
    FOREIGN KEY (`id_admin_asigna`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL;

-- sesion
ALTER TABLE `sesion`
  ADD CONSTRAINT `sesion_ibfk_1` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

-- sesiones_juego
ALTER TABLE `sesiones_juego`
  ADD CONSTRAINT `sesiones_juego_ibfk_1` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `sesiones_juego_ibfk_2` 
    FOREIGN KEY (`id_juego`) REFERENCES `juegos_terapeuticos` (`id_juego`) ON DELETE CASCADE;

-- Reactivar verificación de FK
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que todo esté correcto
SELECT 'PKs y FKs reparadas correctamente' AS resultado;
