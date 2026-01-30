-- Migración: Agregar tipo 'musica' a la columna tipo_recomendacion
-- Fecha: 2026-01-29
-- Descripción: Permite almacenar recomendaciones de música generadas por Groq IA

USE serenvoice;

-- Modificar el ENUM para incluir 'musica'
ALTER TABLE recomendaciones 
MODIFY COLUMN tipo_recomendacion 
ENUM('respiracion','ejercicio','meditacion','profesional','pausa_activa','musica','otros') 
DEFAULT NULL;

-- Verificar el cambio
SHOW COLUMNS FROM recomendaciones WHERE Field='tipo_recomendacion';
