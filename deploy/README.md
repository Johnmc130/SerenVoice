# 🚀 SerenVoice - Documentación de Despliegue Automático

## 📋 Resumen del Sistema

Este proyecto implementa un sistema completo de despliegue automático usando:

- **Scripts en Go** para gestión de recursos en GCP
- **SDK de Google Cloud** para Go
- **Cloud Functions** serverless en Go
- **GitHub Actions** para CI/CD
- **Cloud Logging** para monitoreo

---

## 📁 Estructura de Archivos

```
deploy/
├── deploy.go       # Script principal de despliegue (Go + GCP SDK)
├── resources.go    # Gestión de recursos con SDK de GCP
└── go.mod          # Dependencias de Go

functions/
└── health/
    ├── function.go # Cloud Function en Go
    └── go.mod      # Dependencias

.github/
└── workflows/
    └── deploy.yml  # Pipeline CI/CD de GitHub Actions
```

---

## 🔧 Scripts en Go

### deploy.go - Script de Despliegue

Este script usa el **SDK de Google Cloud para Go** para:

1. **Construir imágenes Docker** usando Cloud Build
2. **Desplegar a Cloud Run** usando la API de Cloud Run
3. **Realizar health checks** post-despliegue
4. **Logging centralizado** en Cloud Logging
5. **Rollback automático** en caso de fallo

```go
// Ejemplo de uso del SDK de GCP
import (
    "cloud.google.com/go/logging"
    run "cloud.google.com/go/run/apiv2"
)

// Crear cliente de Cloud Run
client, err := run.NewServicesClient(ctx)
```

### resources.go - Gestión de Recursos

Script que utiliza múltiples SDKs de GCP:

- `cloud.google.com/go/logging` - Cloud Logging
- `cloud.google.com/go/monitoring` - Cloud Monitoring
- `google.golang.org/api/run/v1` - Cloud Run API

Funcionalidades:
- Listar servicios de Cloud Run
- Obtener métricas de rendimiento
- Crear alertas
- Exportar configuración

---

## ⚡ Cloud Function Serverless (Go)

Ubicación: `functions/health/function.go`

### Endpoints disponibles:

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `HealthCheck` | `/health-check` | Verifica estado del sistema |
| `ProcessAlert` | `/process-alert` | Procesa alertas del backend |
| `MonitorDeployment` | `/monitor-deployment` | Info de despliegue |
| `NotifyEmotionAnalysis` | `/notify-emotion` | Notifica análisis críticos |

### Desplegar Cloud Function:

```bash
gcloud functions deploy serenvoice-health \
  --gen2 \
  --runtime go121 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --source functions/health \
  --entry-point HealthCheck
```

---

## 🔄 Pipeline CI/CD (GitHub Actions)

Archivo: `.github/workflows/deploy.yml`

### Flujo de trabajo:

```
Push a main/master
       ↓
   [Tests] ────────────────────┐
       ↓                       ↓
   [Build Go] ──→ [Deploy Backend] ──→ [Deploy Function]
                       ↓
                [Deploy Frontend]
                       ↓
                 [Notificación]
```

### Jobs:

1. **test** - Ejecuta tests de Python
2. **build-go** - Compila scripts de Go
3. **deploy-backend** - Despliega a Cloud Run
4. **deploy-function** - Despliega Cloud Function
5. **deploy-frontend** - Despliega a Firebase Hosting
6. **notify** - Resumen del despliegue

### Triggers:

- Push a `main` o `master`
- Tags que empiecen con `v` (ej: v1.0.0)
- Pull requests (solo tests)

---

## 🔐 Secrets de GitHub

Configura estos secrets en tu repositorio:

| Secret | Descripción |
|--------|-------------|
| `GCP_PROJECT_ID` | ID del proyecto GCP |
| `GCP_SA_KEY` | JSON de Service Account |
| `DB_HOST` | Host de la base de datos |
| `DB_PORT` | Puerto de la BD |
| `DB_USER` | Usuario de la BD |
| `DB_PASSWORD` | Contraseña de la BD |
| `DB_NAME` | Nombre de la BD |
| `JWT_SECRET_KEY` | Clave secreta JWT |

### Crear Service Account:

```bash
# Crear cuenta de servicio
gcloud iam service-accounts create github-deploy \
  --display-name="GitHub Deploy"

# Asignar permisos
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Descargar clave JSON
gcloud iam service-accounts keys create key.json \
  --iam-account=github-deploy@$PROJECT_ID.iam.gserviceaccount.com
```

---

## 📊 Monitoreo y Logging

### Cloud Logging

Todos los scripts de Go escriben logs a Cloud Logging:

```go
logger.Log(logging.Info, "Despliegue iniciado", nil)
logger.Log(logging.Error, "Error en despliegue", err)
```

Ver logs:
```bash
gcloud logging read "logName=projects/PROJECT_ID/logs/serenvoice-deploy" --limit 50
```

### Alertas

El sistema puede crear alertas automáticas para:
- Errores de despliegue
- Health checks fallidos
- Emociones críticas detectadas

---

## 🚀 Ejecución Manual

### Desplegar Backend:

```bash
cd deploy
go run deploy.go
```

### Gestionar Recursos:

```bash
cd deploy
go run resources.go
```

### Variables de Entorno:

```bash
export GCP_PROJECT_ID=boreal-dock-481001-k0
export GCP_REGION=us-central1
export DB_HOST=switchback.proxy.rlwy.net
export DB_PORT=17529
export DB_USER=root
export DB_PASSWORD=xxx
export DB_NAME=serenvoice
export JWT_SECRET_KEY=xxx
```

---

## ✅ Checklist de Entrega

- [x] Scripts en Go para gestión de recursos en GCP
- [x] Uso de SDKs de GCP con Go (logging, run, monitoring)
- [x] Función serverless en Go (Cloud Function)
- [x] Pipeline CI/CD con GitHub Actions
- [x] Despliegue automático al hacer commit
- [x] Integración de monitoreo y logging

---

## 📚 Referencias

- [Google Cloud Go SDK](https://cloud.google.com/go/docs)
- [Cloud Run Go Client](https://pkg.go.dev/cloud.google.com/go/run)
- [Cloud Functions Go](https://cloud.google.com/functions/docs/concepts/go-runtime)
- [GitHub Actions](https://docs.github.com/en/actions)
