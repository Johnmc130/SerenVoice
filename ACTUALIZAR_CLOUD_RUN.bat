@echo off
echo ============================================================
echo ACTUALIZAR BACKEND EN GOOGLE CLOUD RUN
echo ============================================================
echo.
echo Tu backend está en: serenvoice-backend-11587771642.us-central1.run.app
echo Pero necesita conectarse a Railway con estas variables:
echo.
echo   DB_HOST=switchback.proxy.rlwy.net
echo   DB_PORT=17529
echo   DB_NAME=railway
echo   DB_USER=root
echo   DB_PASSWORD=NhZDwAWhtLPguGpXFExHRKGfggzhAxFD
echo.
echo ============================================================
echo OPCION 1: Actualizar via gcloud CLI
echo ============================================================
echo.
echo Ejecuta este comando (necesitas tener gcloud instalado):
echo.
echo gcloud run services update serenvoice-backend ^
echo   --region=us-central1 ^
echo   --set-env-vars="DB_HOST=switchback.proxy.rlwy.net,DB_PORT=17529,DB_NAME=railway,DB_USER=root,DB_PASSWORD=NhZDwAWhtLPguGpXFExHRKGfggzhAxFD,FLASK_ENV=production"
echo.
echo ============================================================
echo OPCION 2: Actualizar via Google Cloud Console
echo ============================================================
echo.
echo 1. Ve a: https://console.cloud.google.com/run
echo 2. Selecciona el servicio: serenvoice-backend
echo 3. Click en "Edit and Deploy New Revision"
echo 4. Ve a "Variables and Secrets"
echo 5. Agrega/Actualiza estas variables:
echo.
echo    DB_HOST = switchback.proxy.rlwy.net
echo    DB_PORT = 17529
echo    DB_NAME = railway
echo    DB_USER = root
echo    DB_PASSWORD = NhZDwAWhtLPguGpXFExHRKGfggzhAxFD
echo    FLASK_ENV = production
echo    GROQ_API_KEY = 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
echo    JWT_SECRET_KEY = (tu clave secreta)
echo.
echo 6. Click en "Deploy"
echo.
echo ============================================================
echo OPCION 3: Mover todo a Railway (Recomendado)
echo ============================================================
echo.
echo Si prefieres simplicidad, mueve el backend a Railway:
echo.
echo 1. Ve a railway.app
echo 2. Click en "New Project" o "Add Service"
echo 3. Selecciona "Deploy from GitHub repo"
echo 4. Selecciona tu repositorio
echo 5. Railway detectará el Dockerfile automáticamente
echo 6. Las variables de BD ya están en el mismo Railway
echo.
echo Después actualiza la URL del API en el móvil:
echo   proyectofinal-mobile/constants/env.ts
echo.
pause
