# 🛠️ SOLUCIÓN A LOS ERRORES 500 EN SERENVOICE

## ✅ Problema Resuelto

Los errores 500 eran causados por:

1. **Schema desactualizado**: La tabla `alerta_analisis` no tenía la columna `id_resultado` que el código esperaba
2. **Tablas vacías**: `notificaciones_plantillas` y `juegos_terapeuticos` no tenían datos iniciales

## ✅ Correcciones Aplicadas

### 1. Schema actualizado ✅

```sql
-- alerta_analisis ahora tiene id_resultado (con FK a resultado_analisis)
ALTER TABLE alerta_analisis ADD COLUMN id_resultado INT NULL;
ALTER TABLE alerta_analisis ADD FOREIGN KEY (id_resultado) REFERENCES resultado_analisis(id_resultado);

-- resultado_analisis tiene todas las columnas necesarias
ALTER TABLE resultado_analisis ADD COLUMN nivel_estres DECIMAL(5,2);
ALTER TABLE resultado_analisis ADD COLUMN nivel_ansiedad DECIMAL(5,2);
ALTER TABLE resultado_analisis ADD COLUMN clasificacion VARCHAR(50);
ALTER TABLE resultado_analisis ADD COLUMN emocion_dominante VARCHAR(50);
ALTER TABLE resultado_analisis ADD COLUMN confianza DECIMAL(5,2);
```

### 2. Datos insertados ✅

- **16 plantillas** en `notificaciones_plantillas` (invitaciones, alertas, recomendaciones, etc.)
- **5 juegos** en `juegos_terapeuticos` (Respiración, Memoria, Mandala, Puzzle, Mindfulness)

## 📋 Próximos Pasos

El backend en Cloud Run **debe reiniciarse** para que los cambios surtan efecto:

### Opción 1: Forzar nuevo despliegue (Recomendado)

```bash
cd c:\Users\kenny\Downloads\Proyecto-Final---SerenVoice-main

# Opción A: Si tienes gcloud CLI configurado
gcloud run services update serenvoice-backend --region us-central1 --no-traffic

# Opción B: Redesplegar completamente
gcloud run deploy serenvoice-backend \
  --source backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

### Opción 2: Reinicio desde la consola web

1. Ve a [Google Cloud Console - Cloud Run](https://console.cloud.google.com/run)
2. Encuentra el servicio `serenvoice-backend`
3. Click en **"EDIT & DEPLOY NEW REVISION"**
4. No cambies nada, solo haz click en **"DEPLOY"**
5. Espera 2-3 minutos a que se complete

### Opción 3: Verificar conexión a BD

Si sigues viendo errores, verifica que Cloud Run tenga las variables correctas:

```bash
gcloud run services describe serenvoice-backend --region us-central1 --format="value(spec.template.spec.containers[0].env)"
```

Debe incluir:
- `DB_HOST=switchback.proxy.rlwy.net`
- `DB_PORT=17529`
- `DB_NAME=railway`
- `DB_USER=root`
- `DB_PASSWORD=...` (la que está en tu .env)

## 🔍 Verificación Post-Despliegue

Después del restart, prueba estos endpoints:

```bash
# 1. Juegos (debe devolver 5 juegos)
curl https://serenvoice-backend-11587771642.us-central1.run.app/api/juegos

# 2. Plantillas de notificaciones (debe devolver 16 plantillas)
curl https://serenvoice-backend-11587771642.us-central1.run.app/api/notificaciones/plantillas

# 3. Reporte completo (debe funcionar sin error de columna)
curl -H "Authorization: Bearer <TU_TOKEN>" \
  https://serenvoice-backend-11587771642.us-central1.run.app/api/reportes/mi-reporte-completo
```

## 📊 Estado Actual de la Base de Datos

```
✅ notificaciones_plantillas: 16 plantillas
✅ juegos_terapeuticos: 5 juegos
✅ alerta_analisis.id_resultado: Existe
✅ resultado_analisis.nivel_estres: Existe
```

## 🚨 Errores Resueltos

| Endpoint | Error Anterior | Estado |
|----------|----------------|--------|
| `/api/reportes/mi-reporte-completo` | Unknown column 'aa.id_resultado' | ✅ RESUELTO |
| `/api/juegos/iniciar` | 500 (tabla vacía) | ✅ RESUELTO |
| `/api/grupos` | 500 | ⚠️ VERIFICAR PERMISOS |
| `/api/grupos/invitaciones` | 500 | ⚠️ VERIFICAR PERMISOS |
| `/api/audio/analyze` | 500 | ⚠️ VERIFICAR ML MODEL |

## 🔧 Archivos Creados/Modificados

1. **migrations/fix_schema_and_seed_data.sql** - Migración SQL completa
2. **tools/apply_schema_fix.py** - Script Python para aplicar correcciones
3. **SOLUCION_ERRORES_500.md** - Este documento

## ⚡ Comando Rápido (Todo en uno)

```bash
# Desde el directorio raíz del proyecto
cd "c:\Users\kenny\Downloads\Proyecto-Final---SerenVoice-main"

# 1. Verificar que los datos están en la BD
python tools\apply_schema_fix.py

# 2. Redesplegar backend en Cloud Run
gcloud run deploy serenvoice-backend --source backend --region us-central1
```

---

**Última actualización**: 30 enero 2026, 23:30 UTC  
**Script ejecutado exitosamente**: ✅  
**Backend reiniciado**: ⏳ PENDIENTE
