# Monitor completo de logs - Mobile + Backend
# Ejecuta este script para ver logs en tiempo real de ambos lados

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  MONITOR DE LOGS - SERENVOICE FULL STACK              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📱 LOGS DEL MÓVIL (ADB)" -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor Yellow

# Verificar dispositivo conectado
$devices = adb devices | Select-String "device$" | Measure-Object
if ($devices.Count -eq 0) {
    Write-Host "❌ No hay dispositivos Android conectados" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dispositivo conectado:" -ForegroundColor Green
adb devices | Select-String "device$"

Write-Host "`n☁️  BACKEND EN CLOUD RUN" -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor Yellow

# Obtener URL del backend
$backendUrl = gcloud run services describe serenvoice-backend --region us-central1 --format="value(status.url)" 2>$null
if ($backendUrl) {
    Write-Host "✅ Backend URL: $backendUrl" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se pudo obtener URL del backend" -ForegroundColor Yellow
}

# Mostrar configuración
$config = gcloud run services describe serenvoice-backend --region us-central1 --format="value(spec.template.spec.timeoutSeconds,spec.template.spec.containers[0].resources.limits.memory)" 2>$null
if ($config) {
    $timeout, $memory = $config -split "`t"
    Write-Host "⏱️  Timeout: $timeout segundos ($([int]$timeout/60) minutos)" -ForegroundColor Cyan
    Write-Host "💾 Memoria: $memory" -ForegroundColor Cyan
}

Write-Host "`n`n🔍 INICIANDO MONITOREO EN TIEMPO REAL..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Limpiar logs antiguos del móvil
adb logcat -c

Write-Host "Presiona Ctrl+C para detener`n" -ForegroundColor Yellow

# Iniciar monitoreo en dos jobs en paralelo
$mobileJob = Start-Job -ScriptBlock {
    adb logcat | Select-String -Pattern "ReactNativeJS|SerenVoice|participantes|analizar|HTTP 503|ERROR" -CaseSensitive:$false | ForEach-Object {
        $line = $_.Line
        if ($line -match "HTTP 503") {
            Write-Host "📱 [MÓVIL-ERROR] $line" -ForegroundColor Red
        } elseif ($line -match "ERROR|FATAL") {
            Write-Host "📱 [MÓVIL-ERROR] $line" -ForegroundColor Red
        } elseif ($line -match "participantes|analizar") {
            Write-Host "📱 [MÓVIL-INFO] $line" -ForegroundColor Cyan
        } else {
            Write-Host "📱 [MÓVIL] $line" -ForegroundColor Gray
        }
    }
}

$backendJob = Start-Job -ScriptBlock {
    while ($true) {
        $logs = gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=serenvoice-backend" --limit 10 --format=json 2>$null | ConvertFrom-Json
        foreach ($log in $logs) {
            $timestamp = $log.timestamp
            $text = $log.textPayload
            $status = $log.httpRequest.status
            
            if ($status -ge 500) {
                Write-Host "☁️  [BACKEND-ERROR] [$timestamp] HTTP $status - $($log.httpRequest.requestUrl)" -ForegroundColor Red
            } elseif ($text -match "Analizando audio|completado|Resultado grupal") {
                Write-Host "☁️  [BACKEND-INFO] [$timestamp] $text" -ForegroundColor Green
            }
        }
        Start-Sleep -Seconds 5
    }
}

# Esperar jobs
try {
    while ($true) {
        Receive-Job -Job $mobileJob -ErrorAction SilentlyContinue
        Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 100
    }
} finally {
    Stop-Job -Job $mobileJob, $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $mobileJob, $backendJob -Force -ErrorAction SilentlyContinue
}
