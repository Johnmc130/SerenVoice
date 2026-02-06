# Configuración de Despliegue Automático en GCP

## Paso 1: Crear Service Account en GCP

```bash
# Crear service account
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions Deploy"

# Obtener el email del service account
SA_EMAIL="github-actions@boreal-dock-481001-k0.iam.gserviceaccount.com"

# Asignar roles necesarios
gcloud projects add-iam-policy-binding boreal-dock-481001-k0 \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/compute.admin"

gcloud projects add-iam-policy-binding boreal-dock-481001-k0 \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/iam.serviceAccountUser"

# Generar clave JSON
gcloud iam service-accounts keys create gcp-key.json \
    --iam-account=$SA_EMAIL
```

## Paso 2: Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Crear los siguientes secrets:

| Secret Name | Valor |
|-------------|-------|
| `GCP_SA_KEY` | Contenido del archivo `gcp-key.json` (todo el JSON) |
| `ENV_FILE` | Contenido de tu archivo `.env` de producción |

## Paso 3: Contenido del ENV_FILE

```env
# Base de datos
DB_HOST=mysql_estudiantes
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=tu_password_seguro
DB_NAME=serenvoice

# JWT
JWT_SECRET_KEY=tu_clave_secreta_muy_larga

# Flask
FLASK_ENV=production
PORT=5000

# Frontend
VITE_API_URL=http://TU_IP_PUBLICA:5000
VITE_GOOGLE_CLIENT_ID=tu_google_client_id

# Groq AI (opcional)
GROQ_API_KEY=tu_groq_api_key
```

## Paso 4: Desplegar

Simplemente haz push a la rama `main`:

```bash
git add .
git commit -m "Deploy to GCP"
git push origin main
```

GitHub Actions automáticamente:
1. ✅ Creará la VM si no existe
2. ✅ Configurará firewall
3. ✅ Instalará Docker
4. ✅ Clonará el repo
5. ✅ Levantará los contenedores
6. ✅ Mostrará las URLs de acceso

## URLs de Acceso

Después del despliegue, tus servicios estarán en:

- **Frontend**: `http://[IP_PUBLICA]:5173`
- **Backend API**: `http://[IP_PUBLICA]:5000`
- **phpMyAdmin**: `http://[IP_PUBLICA]:8080`

## Comandos Útiles

```bash
# Ver estado de la VM
gcloud compute instances describe serenvoice-server --zone=us-central1-a

# Conectar por SSH
gcloud compute ssh serenvoice-server --zone=us-central1-a

# Ver logs de Docker (dentro de la VM)
sudo docker compose logs -f

# Reiniciar servicios
sudo docker compose restart

# Ver IP externa
gcloud compute instances describe serenvoice-server \
    --zone=us-central1-a \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

## Monitoreo

Los logs se envían automáticamente a Google Cloud Logging:

1. Ve a: https://console.cloud.google.com/logs
2. Filtra por `resource.type="gce_instance"`
3. O filtra por `logName="projects/boreal-dock-481001-k0/logs/gcplogs-docker-driver"`

## Costos Estimados

- **VM e2-medium**: ~$25/mes
- **Disco 30GB**: ~$1.50/mes
- **Tráfico de red**: Variable según uso
- **Total estimado**: ~$30/mes

Para reducir costos:
- Cambiar a `e2-small` (~$13/mes)
- Usar IP interna en lugar de externa
- Apagar la VM cuando no se use
