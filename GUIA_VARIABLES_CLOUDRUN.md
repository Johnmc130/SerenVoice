# 🔧 GUÍA: Actualizar Variables de Entorno en Google Cloud Run

## 📋 Variables que Necesitas Configurar

```
DB_HOST         = switchback.proxy.rlwy.net
DB_PORT         = 17529
DB_NAME         = railway
DB_USER         = root
DB_PASSWORD     = NhZDwAWhtLPguGpXFExHRKGfggzhAxFD
FLASK_ENV       = production
JWT_SECRET_KEY  = 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
GROQ_API_KEY    = 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
```

---

## 🚀 MÉTODO 1: Script Automático (Recomendado)

### Paso 1: Ejecutar el script
```bash
# Doble click en:
actualizar-variables-cloudrun.bat
```

### Paso 2: Seguir las instrucciones
El script te guiará paso a paso:
- Verificará si tienes gcloud instalado
- Te ayudará a autenticarte
- Actualizará las variables automáticamente

---

## 🌐 MÉTODO 2: Consola Web (Manual)

### Paso 1: Ir a Cloud Run
1. Abre tu navegador
2. Ve a: https://console.cloud.google.com/run
3. Inicia sesión con tu cuenta de Google

### Paso 2: Seleccionar el servicio
1. En la lista de servicios, busca: **serenvoice-backend**
2. Click en el nombre del servicio

### Paso 3: Editar configuración
1. Click en **"Edit & Deploy New Revision"** (botón azul arriba)
2. Espera que cargue la configuración actual

### Paso 4: Actualizar variables
1. En la parte superior, busca las pestañas
2. Click en **"Variables & Secrets"** o **"Variables y secretos"**
3. Verás la sección **"Environment variables"**

### Paso 5: Agregar/modificar cada variable
Para cada variable de la lista:

**DB_HOST**
- Click en "+ Add Variable" si no existe, o click en el lápiz ✏️ si existe
- Name: `DB_HOST`
- Value: `switchback.proxy.rlwy.net`
- Click "Done"

**DB_PORT**
- Name: `DB_PORT`
- Value: `17529`
- Click "Done"

**DB_NAME**
- Name: `DB_NAME`
- Value: `railway`
- Click "Done"

**DB_USER**
- Name: `DB_USER`
- Value: `root`
- Click "Done"

**DB_PASSWORD**
- Name: `DB_PASSWORD`
- Value: `NhZDwAWhtLPguGpXFExHRKGfggzhAxFD`
- Click "Done"

**FLASK_ENV**
- Name: `FLASK_ENV`
- Value: `production`
- Click "Done"

**JWT_SECRET_KEY**
- Name: `JWT_SECRET_KEY`
- Value: `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`
- Click "Done"

**GROQ_API_KEY**
- Name: `GROQ_API_KEY`
- Value: `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`
- Click "Done"

### Paso 6: Desplegar
1. Baja hasta el final de la página
2. Click en **"Deploy"** (botón azul)
3. Espera 1-2 minutos mientras se despliega

### Paso 7: Verificar
Verás un mensaje de éxito: ✅ **"Service deployed successfully"**

---

## 💻 MÉTODO 3: Línea de Comandos (gcloud CLI)

### Requisitos
- Tener gcloud CLI instalado: https://cloud.google.com/sdk/docs/install
- Estar autenticado: `gcloud auth login`
- Tener permisos en el proyecto

### Comando único
```bash
gcloud run services update serenvoice-backend \
  --region=us-central1 \
  --update-env-vars="DB_HOST=switchback.proxy.rlwy.net,DB_PORT=17529,DB_NAME=railway,DB_USER=root,DB_PASSWORD=NhZDwAWhtLPguGpXFExHRKGfggzhAxFD,FLASK_ENV=production,JWT_SECRET_KEY=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,GROQ_API_KEY=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"
```

### Windows (cmd)
```cmd
gcloud run services update serenvoice-backend ^
  --region=us-central1 ^
  --update-env-vars="DB_HOST=switchback.proxy.rlwy.net,DB_PORT=17529,DB_NAME=railway,DB_USER=root,DB_PASSWORD=NhZDwAWhtLPguGpXFExHRKGfggzhAxFD,FLASK_ENV=production,JWT_SECRET_KEY=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,GROQ_API_KEY=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"
```

---

## 🔍 Verificar que Funcionó

### Opción 1: Logs en tiempo real
```bash
gcloud run logs read --service=serenvoice-backend --limit=50
```

Busca líneas que muestren la conexión a Railway:
```
Connecting to Railway MySQL...
DB_HOST: switchback.proxy.rlwy.net
```

### Opción 2: Probar el registro
1. Abre tu APK
2. Intenta registrar un usuario nuevo
3. Si NO aparece el error "Unknown column 'u.notificaciones'" → ✅ Funcionó

### Opción 3: Endpoint de salud
Visita en tu navegador:
```
https://serenvoice-backend-11587771642.us-central1.run.app/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## ❌ Solución de Problemas

### Error: "Service not found"
**Causa**: El nombre o región del servicio es incorrecto

**Solución**: Listar servicios existentes
```bash
gcloud run services list
```

### Error: "Permission denied"
**Causa**: No tienes permisos suficientes

**Solución**: Usa la consola web o pide permisos al administrador

### Error: "Invalid environment variable"
**Causa**: Formato incorrecto en el comando

**Solución**: Copia y pega el comando exactamente como está en esta guía

### El APK sigue dando error 500
**Causa**: Cambios no propagados o problemas de BD

**Solución**:
1. Espera 60 segundos después del deploy
2. Cierra y abre la app completamente
3. Verifica logs: `gcloud run logs read --service=serenvoice-backend --limit=100`

---

## 📱 Próximos Pasos

Después de actualizar las variables:

1. **Espera 30-60 segundos** para que los cambios se propaguen
2. **Prueba tu APK**:
   - Intenta registrar un usuario
   - Intenta hacer login
   - Prueba el análisis de audio
3. **Si hay errores**, revisa los logs:
   ```bash
   gcloud run logs read --service=serenvoice-backend --limit=100
   ```

---

## 🆘 Ayuda Adicional

### Ver configuración actual
```bash
gcloud run services describe serenvoice-backend --region=us-central1
```

### Ver variables de entorno actuales
```bash
gcloud run services describe serenvoice-backend --region=us-central1 --format="value(spec.template.spec.containers[0].env)"
```

### Rollback a versión anterior
Si algo sale mal:
```bash
gcloud run services update-traffic serenvoice-backend \
  --region=us-central1 \
  --to-revisions=<revision-anterior>=100
```

---

## 📞 Contacto

Si necesitas ayuda adicional:
- Documentación oficial: https://cloud.google.com/run/docs/configuring/environment-variables
- Soporte de Railway: https://railway.app/help
