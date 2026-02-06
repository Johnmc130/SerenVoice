# SerenVoice - Despliegue en GCP Compute Engine

Script en Go para desplegar la aplicación en una VM de Google Cloud Platform.

## Requisitos

1. Go 1.21+
2. Google Cloud SDK (gcloud) configurado
3. Autenticación de GCP:
   ```bash
   gcloud auth application-default login
   ```

## Uso

```bash
cd deploy

# Instalar dependencias
go mod tidy

# Ejecutar despliegue
go run main.go
```

## Configuración

Variables de entorno opcionales:
- `GCP_PROJECT_ID`: ID del proyecto de GCP (default: boreal-dock-481001-k0)

## Qué hace el script

1. ✅ Crea reglas de firewall para puertos 80, 443, 5000, 5173, 8080
2. ✅ Crea una VM e2-medium con Ubuntu 22.04
3. ✅ Instala Docker y Docker Compose automáticamente
4. ✅ Instala agentes de Cloud Logging y Monitoring
5. ✅ Clona el repositorio y levanta los servicios
