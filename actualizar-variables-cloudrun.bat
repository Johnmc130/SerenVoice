@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo   ACTUALIZAR VARIABLES DE ENTORNO EN GOOGLE CLOUD RUN
echo ============================================================
echo.
echo Este script actualizará las variables de entorno de tu backend
echo en Cloud Run para que se conecte a Railway.
echo.
echo Servicio: serenvoice-backend
echo Región: us-central1
echo.
pause

echo.
echo Verificando si gcloud está instalado...
where gcloud >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ gcloud CLI NO está instalado
    echo.
    echo 📥 OPCIÓN 1: Instalar gcloud CLI
    echo    Descarga desde: https://cloud.google.com/sdk/docs/install
    echo    Luego vuelve a ejecutar este script
    echo.
    echo 🌐 OPCIÓN 2: Actualizar desde la consola web
    echo    1. Ve a: https://console.cloud.google.com/run
    echo    2. Selecciona: serenvoice-backend
    echo    3. Click: "Edit and Deploy New Revision"
    echo    4. Ve a: "Variables and Secrets"
    echo    5. Agrega/actualiza estas variables:
    echo.
    echo       Variable                 Valor
    echo       ─────────────────────────────────────────────────────────
    echo       DB_HOST                  switchback.proxy.rlwy.net
    echo       DB_PORT                  17529
    echo       DB_NAME                  railway
    echo       DB_USER                  root
    echo       DB_PASSWORD              NhZDwAWhtLPguGpXFExHRKGfggzhAxFD
    echo       FLASK_ENV                production
    echo       JWT_SECRET_KEY           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
    echo       GROQ_API_KEY             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
    echo.
    echo    6. Click: "Deploy"
    echo.
    pause
    exit /b 1
)

echo ✅ gcloud CLI está instalado
echo.

REM Verificar autenticación
echo Verificando autenticación...
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️  No estás autenticado en gcloud
    echo    Ejecutando: gcloud auth login
    echo.
    gcloud auth login
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error en autenticación. Ejecuta manualmente: gcloud auth login
        pause
        exit /b 1
    )
)

echo ✅ Autenticado correctamente
echo.

REM Verificar proyecto activo
echo Verificando proyecto activo...
for /f "delims=" %%i in ('gcloud config get-value project 2^>nul') do set CURRENT_PROJECT=%%i

if "%CURRENT_PROJECT%"=="" (
    echo.
    echo ⚠️  No hay proyecto configurado
    echo    Lista de proyectos disponibles:
    echo.
    gcloud projects list
    echo.
    set /p PROJECT_ID="Ingresa el ID del proyecto: "
    gcloud config set project %PROJECT_ID%
) else (
    echo ✅ Proyecto activo: %CURRENT_PROJECT%
    echo.
    set /p CONFIRM="¿Es este el proyecto correcto? (s/n): "
    if /i not "%CONFIRM%"=="s" (
        echo.
        gcloud projects list
        echo.
        set /p PROJECT_ID="Ingresa el ID del proyecto correcto: "
        gcloud config set project %PROJECT_ID%
    )
)

echo.
echo ============================================================
echo   ACTUALIZANDO VARIABLES DE ENTORNO
echo ============================================================
echo.
echo Servicio: serenvoice-backend
echo Región: us-central1
echo.
echo Variables a actualizar:
echo   - DB_HOST = switchback.proxy.rlwy.net
echo   - DB_PORT = 17529
echo   - DB_NAME = railway
echo   - DB_USER = root
echo   - DB_PASSWORD = NhZDwAWhtLPguGpXFExHRKGfggzhAxFD
echo   - FLASK_ENV = production
echo   - JWT_SECRET_KEY = (configurado)
echo   - GROQ_API_KEY = (configurado)
echo.
set /p CONFIRM_UPDATE="¿Continuar con la actualización? (s/n): "
if /i not "%CONFIRM_UPDATE%"=="s" (
    echo Operación cancelada
    pause
    exit /b 0
)

echo.
echo Actualizando servicio en Cloud Run...
echo (Esto puede tardar 1-2 minutos)
echo.

gcloud run services update serenvoice-backend ^
  --region=us-central1 ^
  --update-env-vars="DB_HOST=switchback.proxy.rlwy.net,DB_PORT=17529,DB_NAME=railway,DB_USER=root,DB_PASSWORD=NhZDwAWhtLPguGpXFExHRKGfggzhAxFD,FLASK_ENV=production,JWT_SECRET_KEY=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,GROQ_API_KEY=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"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   ✅ ACTUALIZACIÓN EXITOSA
    echo ============================================================
    echo.
    echo El backend en Cloud Run ahora está conectado a Railway.
    echo.
    echo Próximos pasos:
    echo   1. Espera 30-60 segundos para que el cambio se propague
    echo   2. Prueba tu APK - el registro debería funcionar ahora
    echo   3. Si hay errores, verifica los logs con:
    echo      gcloud run logs read --service=serenvoice-backend --limit=50
    echo.
) else (
    echo.
    echo ============================================================
    echo   ❌ ERROR EN ACTUALIZACIÓN
    echo ============================================================
    echo.
    echo Posibles causas:
    echo   - El servicio no existe o tiene otro nombre
    echo   - No tienes permisos suficientes
    echo   - La región es incorrecta
    echo.
    echo Intenta actualizar manualmente desde la consola web:
    echo   https://console.cloud.google.com/run
    echo.
)

echo.
pause
