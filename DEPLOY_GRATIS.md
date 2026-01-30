# 🚀 Guía Completa de Despliegue - SerenVoice

## 📊 PASO 1: Base de Datos en Railway (GRATIS)

Railway ofrece MySQL gratis con 500MB de almacenamiento.

### 1.1 Crear cuenta en Railway
1. Ve a: https://railway.app
2. Click "Login" → "Login with GitHub"
3. Autoriza Railway

### 1.2 Crear proyecto MySQL
1. Click "New Project"
2. Busca "MySQL" y selecciónalo
3. Espera que se cree (30 segundos)

### 1.3 Obtener credenciales
1. Click en el servicio MySQL
2. Ve a la pestaña "Variables"
3. Copia estos valores:
   - `MYSQL_HOST` (ej: mysql.railway.internal)
   - `MYSQL_PORT` (ej: 3306)
   - `MYSQL_USER` (ej: root)
   - `MYSQL_PASSWORD` (ej: xxxx)
   - `MYSQL_DATABASE` (ej: railway)

### 1.4 Conectar externamente
1. Ve a "Settings" → "Networking"
2. Habilita "Public Networking"
3. Copia la URL pública (ej: `mysql.railway.app:12345`)

### 1.5 Importar datos
Desde tu terminal local:
```bash
mysql -h mysql.railway.app -P 12345 -u root -p railway < serenvoice_backup.sql
```

---

## 🔧 PASO 2: Backend en Cloud Run (GRATIS)

### 2.1 Preparar Dockerfile
Ya está listo en `backend/Dockerfile.cloudrun`

### 2.2 Desplegar
```powershell
cd backend
gcloud run deploy serenvoice-backend `
  --source . `
  --dockerfile Dockerfile.cloudrun `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --memory 512Mi `
  --set-env-vars "FLASK_ENV=production,DB_HOST=TU_HOST_RAILWAY,DB_PORT=TU_PUERTO,DB_USER=root,DB_PASSWORD=TU_PASSWORD,DB_NAME=railway,JWT_SECRET_KEY=TU_SECRET"
```

### 2.3 Obtener URL
Después del deploy verás:
```
Service URL: https://serenvoice-backend-xxxxx.a.run.app
```

---

## 🌐 PASO 3: Frontend en Firebase Hosting (GRATIS)

### 3.1 Instalar Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 3.2 Inicializar proyecto
```bash
cd proyectofinal-frontend
firebase init hosting
# Selecciona: boreal-dock-481001-k0
# Public directory: dist
# Single-page app: Yes
# GitHub deploys: No
```

### 3.3 Configurar API URL
Edita `.env.production`:
```
VITE_API_URL=https://serenvoice-backend-xxxxx.a.run.app
```

### 3.4 Build y Deploy
```bash
npm run build
firebase deploy --only hosting
```

URL: `https://boreal-dock-481001-k0.web.app`

---

## 📱 PASO 4: Generar APK

### 4.1 Actualizar URL del backend
Edita `proyectofinal-mobile/.env.production`:
```
EXPO_PUBLIC_API_URL=https://serenvoice-backend-xxxxx.a.run.app
```

Edita `proyectofinal-mobile/eas.json` (líneas 17 y 26):
```json
"EXPO_PUBLIC_API_URL": "https://serenvoice-backend-xxxxx.a.run.app"
```

### 4.2 Generar APK
```bash
cd proyectofinal-mobile
eas login
eas build -p android --profile preview
```

### 4.3 Descargar
Cuando termine (10-15 min), descarga desde:
```
https://expo.dev/artifacts/eas/xxxxx.apk
```

---

## ✅ Resumen de URLs Finales

| Componente | URL |
|------------|-----|
| Backend API | `https://serenvoice-backend-xxxxx.a.run.app` |
| Frontend Web | `https://boreal-dock-481001-k0.web.app` |
| Base de Datos | `mysql.railway.app:12345` |
| APK Download | `https://expo.dev/artifacts/...` |

---

## 💰 Costos (Plan Gratuito)

| Servicio | Límite Gratis |
|----------|---------------|
| Cloud Run | 2M requests/mes |
| Railway MySQL | 500MB, 500 horas/mes |
| Firebase Hosting | 10GB/mes |
| EAS Build | 30 builds/mes |

**Total: $0/mes** para uso normal de proyecto universitario.
