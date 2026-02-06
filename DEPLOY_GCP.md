# 🚀 SerenVoice - Guía de Despliegue en GCP

Esta guía explica cómo desplegar SerenVoice en Google Cloud Platform paso a paso.

---

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Desarrollo Local con Docker](#desarrollo-local-con-docker)
3. [Despliegue en GCP (Producción)](#despliegue-en-gcp-producción)
4. [Mantenimiento y Comandos Útiles](#mantenimiento-y-comandos-útiles)
5. [Solución de Problemas](#solución-de-problemas)
6. [Costos y Optimización](#costos-y-optimización)

---

## 🔧 Requisitos Previos

### Para Desarrollo Local
- **Docker Desktop** (Windows/Mac) o **Docker Engine** (Linux)
- **Git**
- **Node.js** >= 18 (opcional, para desarrollo sin Docker)
- **Python** >= 3.10 (opcional, para desarrollo sin Docker)

### Para Despliegue en GCP
- **Cuenta de Google Cloud** con facturación habilitada
- **gcloud CLI** instalado y configurado
- **Cuenta de GitHub** (para CI/CD)

---

## 🐳 Desarrollo Local con Docker

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/Johnmc130/SerenVoice.git
cd SerenVoice
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus credenciales
notepad .env  # Windows
nano .env     # Linux/Mac
```

**Variables mínimas requeridas en `.env`:**
```env
# Base de datos
DB_HOST=mysql_estudiantes
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=serenvoice123
DB_NAME=serenvoice

# JWT (generar una clave segura)
JWT_SECRET_KEY=tu_clave_secreta_muy_larga_de_al_menos_32_caracteres

# Flask
FLASK_ENV=development
PORT=5000

# Groq AI (opcional - para recomendaciones IA)
GROQ_API_KEY=tu_api_key_de_groq

# Google OAuth (opcional)
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
```

### Paso 3: Iniciar Servicios

```bash
docker-compose up -d --build
```

### Paso 4: Verificar que Todo Funciona

```bash
# Ver estado de contenedores
docker-compose ps

# Probar API
curl http://localhost:5000/api/health

# Probar Frontend
# Abrir en navegador: http://localhost:5173
```

### Servicios Disponibles (Local)

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:5173 | Aplicación React |
| Backend API | http://localhost:5000 | API REST Flask |
| phpMyAdmin | http://localhost:8080 | Admin base de datos |
| MySQL | localhost:3306 | Base de datos |

### Comandos Docker Útiles

```bash
# Ver logs
docker-compose logs -f flask_backend

# Reiniciar un servicio
docker-compose restart flask_backend

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (¡BORRA LA BD!)
docker-compose down -v

# Reconstruir sin cache
docker-compose build --no-cache
```

---

## ☁️ Despliegue en GCP (Producción)

## ☁️ Despliegue en GCP (Producción)

### Arquitectura de Producción

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │  GCP Compute Engine VM  │
         │   (serenvoice-server)   │
         │     IP: 35.226.22.24    │
         └─────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │         NGINX             │
         │   (SSL + Proxy Reverso)   │
         │   Puerto 80/443           │
         └─────────────┬─────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
┌────────┐      ┌─────────────┐    ┌──────────────┐
│Frontend│      │   Backend   │    │  phpMyAdmin  │
│ :5173  │      │    :5000    │    │    :8080     │
└────────┘      └──────┬──────┘    └──────────────┘
                       │
                       ▼
                 ┌──────────┐
                 │  MySQL   │
                 │  :3306   │
                 └──────────┘
```

### Paso 1: Instalar Google Cloud CLI

**Windows (PowerShell como Administrador):**
```powershell
# Descargar instalador
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:TEMP\GoogleCloudSDKInstaller.exe")
& $env:TEMP\GoogleCloudSDKInstaller.exe
```

**Linux/Mac:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Paso 2: Configurar gcloud

```bash
# Iniciar sesión
gcloud auth login

# Crear proyecto (o usar uno existente)
gcloud projects create serenvoice-prod --name="SerenVoice Production"

# Seleccionar proyecto
gcloud config set project serenvoice-prod

# Habilitar facturación (requerido)
# Ir a: https://console.cloud.google.com/billing

# Habilitar APIs necesarias
gcloud services enable compute.googleapis.com
```

### Paso 3: Crear Service Account para GitHub Actions

```bash
# Crear service account
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions Deploy"

# Obtener el email
SA_EMAIL="github-actions@$(gcloud config get-value project).iam.gserviceaccount.com"

# Asignar roles necesarios
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/compute.admin"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/iap.tunnelResourceAccessor"

# Generar clave JSON
gcloud iam service-accounts keys create gcp-key.json \
    --iam-account=$SA_EMAIL

# Ver contenido de la clave (copiar para GitHub)
cat gcp-key.json
```

### Paso 4: Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Crear los siguientes secrets:

| Secret Name | Valor |
|-------------|-------|
| `GCP_SA_KEY` | Contenido completo del archivo `gcp-key.json` |

### Paso 5: Hacer el Primer Despliegue

```bash
# Simplemente hacer push a main
git add .
git commit -m "Deploy to GCP"
git push origin main
```

GitHub Actions automáticamente:
1. ✅ Creará la VM `serenvoice-server` (e2-medium, Ubuntu 22.04)
2. ✅ Configurará reglas de firewall
3. ✅ Instalará Docker y Docker Compose
4. ✅ Clonará el repositorio
5. ✅ Levantará todos los contenedores
6. ✅ Configurará Nginx como proxy reverso
7. ✅ Instalará certificado SSL con Let's Encrypt

### Paso 6: Configurar SSL (Primera vez)

Después del primer despliegue, conectar a la VM y configurar SSL:

```bash
# Conectar a la VM
gcloud compute ssh serenvoice-server --zone=us-central1-a

# Instalar Nginx y Certbot
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Configurar Nginx (ya está configurado si usas el archivo del repo)
sudo cp /opt/serenvoice/deploy/nginx-serenvoice.conf /etc/nginx/sites-available/serenvoice
sudo ln -sf /etc/nginx/sites-available/serenvoice /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Obtener certificado SSL
# Opción A: Con dominio propio
sudo certbot --nginx -d tudominio.com --non-interactive --agree-tos --email tu@email.com

# Opción B: Con nip.io (gratis, sin dominio)
IP=$(curl -s ifconfig.me)
sudo sed -i "s/server_name _;/server_name ${IP//./-}.nip.io;/" /etc/nginx/sites-available/serenvoice
sudo certbot --nginx -d ${IP//./-}.nip.io --non-interactive --agree-tos --email tu@email.com

# Reiniciar Nginx
sudo systemctl reload nginx
```

---

## 🌐 URLs de Acceso (Producción)

Con la configuración actual:

| Servicio | URL |
|----------|-----|
| **Frontend (HTTPS)** | https://35-226-22-24.nip.io |
| **Backend API (HTTPS)** | https://35-226-22-24.nip.io/api |
| **phpMyAdmin** | http://35.226.22.24:8080 |

---

---

## 🛠️ Mantenimiento y Comandos Útiles

### Conectar a la VM por SSH

```bash
gcloud compute ssh serenvoice-server --zone=us-central1-a
```

### Ver Estado de Contenedores

```bash
# Dentro de la VM
cd /opt/serenvoice
sudo docker compose ps
```

### Ver Logs

```bash
# Todos los servicios
sudo docker compose logs -f

# Solo backend
sudo docker compose logs -f flask_backend

# Solo frontend
sudo docker compose logs -f react_frontend

# Solo MySQL
sudo docker compose logs -f mysql_estudiantes
```

### Reiniciar Servicios

```bash
# Reiniciar todo
sudo docker compose restart

# Reiniciar un servicio específico
sudo docker compose restart flask_backend
```

### Actualizar Aplicación (Manual)

```bash
cd /opt/serenvoice
sudo git pull origin main
sudo docker compose down
sudo docker compose up -d --build
```

### Backup de Base de Datos

```bash
# Crear backup
sudo docker compose exec mysql_estudiantes mysqldump -u admin -pserenvoice123 serenvoice > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260205.sql | sudo docker compose exec -T mysql_estudiantes mysql -u admin -pserenvoice123 serenvoice
```

### Gestión de la VM

```bash
# Ver IP externa
gcloud compute instances describe serenvoice-server \
    --zone=us-central1-a \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Detener VM (para ahorrar costos)
gcloud compute instances stop serenvoice-server --zone=us-central1-a

# Iniciar VM
gcloud compute instances start serenvoice-server --zone=us-central1-a

# Eliminar VM (¡CUIDADO! Borra todo)
gcloud compute instances delete serenvoice-server --zone=us-central1-a
```

---

## 🔧 Solución de Problemas

### Error: "ModuleNotFoundError: No module named 'backend'"

Los imports deben usar el prefijo `backend.`:
```python
# ❌ Incorrecto
from services.audio_service import AudioService

# ✅ Correcto
from backend.services.audio_service import AudioService
```

### Error: "Connection refused" al conectar a MySQL

1. Verificar que MySQL esté corriendo:
   ```bash
   sudo docker compose ps mysql_estudiantes
   ```

2. Esperar a que MySQL esté "healthy":
   ```bash
   sudo docker compose logs mysql_estudiantes | tail -20
   ```

### Error: "502 Bad Gateway" en Nginx

1. Verificar que los contenedores estén corriendo:
   ```bash
   sudo docker compose ps
   ```

2. Verificar logs del backend:
   ```bash
   sudo docker compose logs flask_backend --tail=50
   ```

### El frontend no carga las APIs

Verificar que Nginx esté configurado correctamente:
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Renovar certificado SSL manualmente

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 💰 Costos y Optimización

### Costos Estimados Mensuales

| Recurso | Costo |
|---------|-------|
| VM e2-medium (2 vCPU, 4GB RAM) | ~$25/mes |
| Disco 30GB SSD | ~$1.50/mes |
| IP Estática (si se configura) | ~$3/mes |
| Tráfico de red | Variable |
| **Total aproximado** | **~$30/mes** |

### Reducir Costos

1. **Usar VM más pequeña** (e2-small: ~$13/mes)
   ```bash
   gcloud compute instances set-machine-type serenvoice-server \
       --zone=us-central1-a \
       --machine-type=e2-small
   ```

2. **Apagar cuando no se use**
   ```bash
   gcloud compute instances stop serenvoice-server --zone=us-central1-a
   ```

3. **Usar instancia preemptible** (80% más barato, pero puede apagarse)

### Monitoreo de Costos

1. Ir a: https://console.cloud.google.com/billing
2. Configurar alertas de presupuesto
3. Revisar el desglose de costos por servicio

---

## 📱 Despliegue de App Móvil

La app móvil usa Expo y se conecta a la misma API.

### Desarrollo Local

```bash
cd proyectofinal-mobile
npm install
npx expo start
```

### Configurar URL de API para Móvil

Editar `proyectofinal-mobile/constants/env.ts`:
```typescript
// Para desarrollo local
export const API_URL = 'http://192.168.x.x:5000';  // Tu IP local

// Para producción
export const API_URL = 'https://35-226-22-24.nip.io';
```

### Build para Producción

```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

---

## 📝 Checklist de Despliegue

### Primera vez
- [ ] Instalar gcloud CLI
- [ ] Configurar cuenta de GCP con facturación
- [ ] Crear Service Account
- [ ] Configurar GitHub Secret (GCP_SA_KEY)
- [ ] Hacer push a main
- [ ] Configurar SSL con Certbot
- [ ] Verificar todos los endpoints

### Actualizaciones posteriores
- [ ] Hacer cambios en el código
- [ ] Probar localmente con Docker
- [ ] Commit y push a main
- [ ] Verificar que GitHub Actions complete
- [ ] Probar en producción

---

## 🔒 Seguridad

### Recomendaciones

1. **Cambiar contraseñas por defecto** en `.env`
2. **No exponer phpMyAdmin** en producción (cerrar puerto 8080)
3. **Usar HTTPS** siempre (ya configurado con Certbot)
4. **Configurar firewall** para limitar acceso por IP
5. **Rotar JWT_SECRET_KEY** periódicamente
6. **Backup regular** de la base de datos

### Cerrar phpMyAdmin en Producción

```bash
# Editar docker-compose.yml y comentar el servicio phpmyadmin
# O cerrar puerto en firewall:
gcloud compute firewall-rules update serenvoice-allow-web \
    --allow=tcp:80,tcp:443,tcp:5000,tcp:5173
```

---

**Última actualización:** Febrero 2026
