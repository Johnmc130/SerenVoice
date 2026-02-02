# Validaciones de Campos Implementadas - SerenVoice

## 📋 Resumen de Cambios

Se han agregado **validaciones robustas** en el backend para garantizar la integridad de los datos sin afectar ninguna funcionalidad existente.

## ✅ Validaciones Implementadas

### 1. **Validación de Fechas**
- ❌ Las fechas de actividades/grupos **NO pueden ser anteriores a hoy**
- ✅ Se aceptan: hoy y fechas futuras
- ✅ Soporta múltiples formatos: `YYYY-MM-DD`, `YYYY-MM-DD HH:MM`, `YYYY-MM-DD HH:MM:SS`
- ✅ Valida que fecha_fin > fecha_inicio (si ambas están presentes)

**Archivos modificados:**
- `backend/routes/grupos_routes.py` - línea 277 (create_group)
- `backend/routes/grupos_routes.py` - línea 680 (create_activity)
- `backend/routes/actividades_grupo_routes.py` - línea 56 (crear_actividad)

### 2. **Validación de Participantes**
- ✅ Mínimo: **2 participantes** por grupo
- ✅ Máximo: **100 participantes** por grupo
- ✅ Al agregar miembros, verifica que no se exceda `max_participantes`
- ✅ Mensaje claro: "El grupo ha alcanzado el límite máximo de X participantes"

**Archivos modificados:**
- `backend/routes/grupos_routes.py` - línea 284 (create_group)
- `backend/routes/grupos_routes.py` - línea 525 (add_group_member)

### 3. **Validación de Longitudes de Texto**

#### Nombres de Grupos
- ✅ Mínimo: **3 caracteres**
- ✅ Máximo: **100 caracteres**

#### Títulos de Actividades
- ✅ Mínimo: **3 caracteres**
- ✅ Máximo: **200 caracteres**

#### Descripciones
- ✅ Grupos: máximo **500 caracteres**
- ✅ Actividades: máximo **1000 caracteres**

**Archivos modificados:**
- `backend/routes/grupos_routes.py` - línea 280
- `backend/routes/grupos_routes.py` - línea 673
- `backend/routes/actividades_grupo_routes.py` - línea 49

### 4. **Validación de Duración de Actividades**
- ✅ Mínimo: **1 minuto**
- ✅ Máximo: **480 minutos (8 horas)**
- ✅ Debe ser un número entero válido

**Archivos modificados:**
- `backend/routes/grupos_routes.py` - línea 703
- `backend/routes/actividades_grupo_routes.py` - línea 60

## 🔒 Compatibilidad

### Sin Cambios Destructivos
- ✅ Todas las APIs mantienen el mismo formato de respuesta
- ✅ No se modificaron nombres de campos
- ✅ No se eliminó ninguna funcionalidad existente
- ✅ Las validaciones se agregan **ANTES** de crear registros en BD
- ✅ Mensajes de error claros y descriptivos en español

### Respuestas de Error
Todas las validaciones devuelven HTTP 400 con mensaje descriptivo:
```json
{
  "error": "La fecha de inicio no puede ser anterior a hoy"
}
```

## 📂 Archivos Modificados

1. **backend/routes/grupos_routes.py** (3 secciones):
   - Líneas 277-334: Validaciones en `create_group()`
   - Líneas 525-535: Validación de límite en `add_group_member()`
   - Líneas 673-710: Validaciones en `create_activity()`

2. **backend/routes/actividades_grupo_routes.py** (1 sección):
   - Líneas 43-70: Validaciones en `crear_actividad()`

## 🧪 Pruebas

Se creó `backend/test_validations.py` para verificar todas las reglas:
```bash
cd backend
python test_validations.py
```

**Resultado:** ✅ Todas las validaciones funcionan correctamente

## 🚀 Despliegue a Cloud Run

### Comando de Despliegue
```bash
cd backend

gcloud run deploy serenvoice-backend ^
  --source . ^
  --region us-central1 ^
  --platform managed ^
  --allow-unauthenticated ^
  --memory 1Gi ^
  --timeout 300 ^
  --update-env-vars "DB_HOST=switchback.proxy.rlwy.net,DB_PORT=17529,DB_USER=root,DB_PASSWORD=NhZDwAWhtLPguGpXFExHRKGfggzhAxFD,DB_NAME=railway,JWT_SECRET_KEY=7cee0dd1b9a9765efbcafe8b4cee4037449c8b7431b932358b7be9a2459ebd02,GROQ_API_KEY=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,DB_POOL_SIZE=15,FLASK_ENV=production"
```

### Verificación Post-Despliegue
1. **Health Check:**
   ```bash
   curl https://serenvoice-backend-11587771642.us-central1.run.app/api/health
   ```
   Debe responder: `{"status": "healthy", ...}`

2. **Probar validación de fecha pasada:**
   ```bash
   # Debería rechazar con error 400
   curl -X POST https://serenvoice-backend-11587771642.us-central1.run.app/api/grupos/actividad-grupos/1/crear \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{"nombre":"Test","fecha_inicio":"2024-01-01"}'
   ```

3. **Ver logs:**
   ```bash
   gcloud run services logs read serenvoice-backend --region us-central1 --limit 50
   ```

## 📝 Ejemplos de Uso

### Crear Grupo con Validaciones
```python
# ✅ VÁLIDO
{
  "nombre": "Grupo de Meditación",
  "descripcion": "Sesiones semanales de mindfulness",
  "max_participantes": 20,
  "fecha_inicio": "2026-02-15"
}

# ❌ INVÁLIDO - Fecha pasada
{
  "nombre": "Grupo",
  "fecha_inicio": "2024-01-01"  # Error: "La fecha de inicio no puede ser anterior a hoy"
}

# ❌ INVÁLIDO - Nombre muy corto
{
  "nombre": "AB"  # Error: "El nombre debe tener al menos 3 caracteres"
}

# ❌ INVÁLIDO - Demasiados participantes
{
  "nombre": "Grupo Grande",
  "max_participantes": 150  # Error: "El grupo no puede exceder 100 participantes"
}
```

### Crear Actividad con Validaciones
```python
# ✅ VÁLIDO
{
  "titulo": "Meditación Guiada",
  "descripcion": "Sesión de relajación",
  "duracion_estimada": 30,
  "fecha_programada": "2026-02-10"
}

# ❌ INVÁLIDO - Duración excesiva
{
  "titulo": "Actividad",
  "duracion_estimada": 600  # Error: "La duración no puede exceder 480 minutos (8 horas)"
}

# ❌ INVÁLIDO - Fecha pasada
{
  "titulo": "Actividad",
  "fecha_inicio": "2025-01-01"  # Error: "La fecha de la actividad no puede ser anterior a hoy"
}
```

### Agregar Miembro con Validación de Límite
```python
# Si grupo tiene max_participantes=10 y ya hay 10 miembros:
POST /api/grupos/5/miembros
{
  "usuario_id": 123
}

# ❌ Respuesta:
{
  "error": "El grupo ha alcanzado el límite máximo de 10 participantes"
}
```

## 🎯 Beneficios

1. **Integridad de Datos:** Evita datos inconsistentes en la base de datos
2. **Mejor UX:** Mensajes de error claros para el usuario
3. **Prevención de Errores:** Detecta problemas antes de operaciones costosas
4. **Mantenibilidad:** Validaciones centralizadas y fáciles de modificar
5. **Seguridad:** Previene ataques de inyección mediante validación estricta

## 🔍 Monitoreo

Después del despliegue, verificar en los logs:
- No deben aparecer errores 500 relacionados con validaciones
- Los errores 400 deben tener mensajes descriptivos
- La funcionalidad existente debe seguir funcionando normalmente

---

**Fecha de implementación:** 1 de febrero de 2026  
**Versión:** Backend v3.1.0  
**Estado:** ✅ Listo para despliegue
