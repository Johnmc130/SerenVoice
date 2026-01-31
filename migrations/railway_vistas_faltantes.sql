-- ============================================================
-- VISTAS FALTANTES PARA SERENVOICE - RAILWAY
-- Crea las vistas necesarias para estadísticas y reportes
-- ============================================================

SET NAMES utf8mb4;

-- ============================================================
-- 1. VISTA: Estadísticas de usuarios
-- ============================================================
DROP VIEW IF EXISTS `vista_usuarios_estadisticas`;

CREATE VIEW `vista_usuarios_estadisticas` AS
SELECT 
    u.id_usuario,
    u.nombre,
    u.apellido,
    u.correo,
    u.fecha_creacion,
    u.activo,
    -- Contadores de análisis
    COUNT(DISTINCT a.id_analisis) AS total_analisis,
    COUNT(DISTINCT au.id_audio) AS total_audios,
    -- Última actividad
    MAX(a.fecha_analisis) AS ultima_fecha_analisis,
    MAX(au.fecha_subida) AS ultima_fecha_audio,
    -- Estadísticas emocionales
    AVG(a.nivel_estres) AS promedio_estres,
    AVG(a.nivel_ansiedad) AS promedio_ansiedad,
    -- Grupos
    COUNT(DISTINCT gm.id_grupo) AS total_grupos,
    -- Notificaciones
    COUNT(DISTINCT n.id_notificacion) AS total_notificaciones,
    SUM(CASE WHEN n.leida = 0 THEN 1 ELSE 0 END) AS notificaciones_pendientes
FROM usuario u
LEFT JOIN analisis a ON u.id_usuario = a.id_usuario
LEFT JOIN audio au ON u.id_usuario = au.id_usuario
LEFT JOIN grupo_miembros gm ON u.id_usuario = gm.id_usuario AND gm.estado = 'activo'
LEFT JOIN notificaciones n ON u.id_usuario = n.id_usuario
WHERE u.activo = 1
GROUP BY u.id_usuario, u.nombre, u.apellido, u.correo, u.fecha_creacion, u.activo;

-- ============================================================
-- 2. VISTA: Último análisis por usuario
-- ============================================================
DROP VIEW IF EXISTS `user_last_analysis`;

CREATE VIEW `user_last_analysis` AS
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

-- ============================================================
-- 3. VISTA: Sesiones grupales activas
-- ============================================================
DROP VIEW IF EXISTS `vista_sesiones_grupales`;

CREATE VIEW `vista_sesiones_grupales` AS
SELECT 
    avg.id_sesion,
    avg.id_actividad,
    avg.id_grupo,
    g.nombre_grupo,
    avg.titulo,
    avg.descripcion,
    avg.estado,
    avg.total_participantes,
    avg.participantes_completados,
    CASE 
        WHEN avg.total_participantes > 0 
        THEN ROUND((avg.participantes_completados * 100.0) / avg.total_participantes, 1)
        ELSE 0 
    END AS porcentaje_completado,
    avg.fecha_inicio,
    avg.fecha_limite,
    avg.fecha_completada,
    u.nombre AS iniciador_nombre,
    u.apellido AS iniciador_apellido
FROM analisis_voz_actividad avg
JOIN grupos g ON avg.id_grupo = g.id_grupo
JOIN usuario u ON avg.id_iniciador = u.id_usuario
WHERE avg.activo = 1;

-- ============================================================
-- 4. VISTA: Participaciones en sesiones grupales
-- ============================================================
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
    a.emocion_detectada AS emocion_individual,
    a.nivel_estres,
    a.nivel_ansiedad,
    a.confianza_prediccion AS confianza
FROM participacion_sesion_grupal psg
JOIN usuario u ON psg.id_usuario = u.id_usuario
LEFT JOIN analisis a ON psg.id_analisis = a.id_analisis;

-- ============================================================
-- 5. VISTA: Grupos con estadísticas
-- ============================================================
DROP VIEW IF EXISTS `vista_grupos_estadisticas`;

CREATE VIEW `vista_grupos_estadisticas` AS
SELECT 
    g.id_grupo,
    g.nombre_grupo,
    g.descripcion,
    g.codigo_invitacion,
    g.es_privado,
    g.fecha_creacion,
    u.nombre AS creador_nombre,
    u.apellido AS creador_apellido,
    COUNT(DISTINCT gm.id_usuario) AS total_miembros,
    COUNT(DISTINCT ag.id_actividad) AS total_actividades,
    SUM(CASE WHEN gm.estado = 'activo' THEN 1 ELSE 0 END) AS miembros_activos
FROM grupos g
JOIN usuario u ON g.id_creador = u.id_usuario
LEFT JOIN grupo_miembros gm ON g.id_grupo = gm.id_grupo
LEFT JOIN actividades_grupo ag ON g.id_grupo = ag.id_grupo AND ag.activo = 1
WHERE g.activo = 1
GROUP BY g.id_grupo, g.nombre_grupo, g.descripcion, g.codigo_invitacion, 
         g.es_privado, g.fecha_creacion, u.nombre, u.apellido;

-- ============================================================
-- 6. VISTA: Alertas pendientes por usuario
-- ============================================================
DROP VIEW IF EXISTS `vista_alertas_pendientes`;

CREATE VIEW `vista_alertas_pendientes` AS
SELECT 
    aa.id_alerta,
    aa.id_usuario,
    u.nombre,
    u.apellido,
    aa.nivel_severidad,
    aa.tipo_alerta,
    aa.mensaje,
    aa.fecha_alerta,
    aa.leida,
    aa.resuelta,
    a.emocion_detectada,
    a.nivel_estres,
    a.nivel_ansiedad
FROM alerta_analisis aa
JOIN usuario u ON aa.id_usuario = u.id_usuario
LEFT JOIN analisis a ON aa.id_analisis = a.id_analisis
WHERE aa.resuelta = 0
ORDER BY 
    CASE aa.nivel_severidad
        WHEN 'critica' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'media' THEN 3
        ELSE 4
    END,
    aa.fecha_alerta DESC;

-- ============================================================
-- 7. VISTA: Historial de análisis con emociones
-- ============================================================
DROP VIEW IF EXISTS `vista_historial_analisis`;

CREATE VIEW `vista_historial_analisis` AS
SELECT 
    a.id_analisis,
    a.id_usuario,
    u.nombre,
    u.apellido,
    a.emocion_detectada,
    a.nivel_estres,
    a.nivel_ansiedad,
    a.confianza_prediccion,
    a.fecha_analisis,
    au.duracion_segundos,
    au.formato,
    COUNT(DISTINCT r.id_recomendacion) AS total_recomendaciones
FROM analisis a
JOIN usuario u ON a.id_usuario = u.id_usuario
JOIN audio au ON a.id_audio = au.id_audio
LEFT JOIN resultado_analisis ra ON a.id_analisis = ra.id_analisis
LEFT JOIN recomendaciones r ON ra.id_resultado = r.id_resultado
GROUP BY a.id_analisis, a.id_usuario, u.nombre, u.apellido, a.emocion_detectada,
         a.nivel_estres, a.nivel_ansiedad, a.confianza_prediccion, 
         a.fecha_analisis, au.duracion_segundos, au.formato
ORDER BY a.fecha_analisis DESC;

-- ============================================================
-- 8. VISTA: Dashboard general del sistema
-- ============================================================
DROP VIEW IF EXISTS `vista_dashboard_sistema`;

CREATE VIEW `vista_dashboard_sistema` AS
SELECT 
    (SELECT COUNT(*) FROM usuario WHERE activo = 1) AS usuarios_activos,
    (SELECT COUNT(*) FROM analisis) AS total_analisis,
    (SELECT COUNT(*) FROM audio) AS total_audios,
    (SELECT COUNT(*) FROM grupos WHERE activo = 1) AS grupos_activos,
    (SELECT COUNT(*) FROM alerta_analisis WHERE resuelta = 0) AS alertas_pendientes,
    (SELECT COUNT(*) FROM notificaciones WHERE leida = 0) AS notificaciones_pendientes,
    (SELECT AVG(nivel_estres) FROM analisis WHERE fecha_analisis >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS promedio_estres_7dias,
    (SELECT AVG(nivel_ansiedad) FROM analisis WHERE fecha_analisis >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS promedio_ansiedad_7dias,
    (SELECT COUNT(*) FROM analisis WHERE fecha_analisis >= DATE_SUB(NOW(), INTERVAL 1 DAY)) AS analisis_hoy,
    (SELECT COUNT(*) FROM usuario WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS usuarios_nuevos_7dias;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'Vistas creadas exitosamente' AS resultado;

SHOW FULL TABLES WHERE Table_type = 'VIEW';
