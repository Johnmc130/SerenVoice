$ErrorActionPreference = "Stop"
$baseUrl = "https://serenvoice-backend-11587771642.us-central1.run.app/api"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TEST SISTEMA DE NOTIFICACIONES                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# LOGIN KENNY
Write-Host "[1/6] Login Kenny..." -ForegroundColor Yellow
$body1 = @{correo="kenny@gmail.com"; contrasena="Kenny123"} | ConvertTo-Json -Compress
$response1 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $body1 -ContentType "application/json"
$token1 = $response1.data.access_token
$user1 = $response1.data.usuario
$userId1 = $user1.id_usuario
Write-Host "OK - $($user1.nombre) $($user1.apellido) (Usuario ID $userId1)" -ForegroundColor Green
Write-Host "" 

# LOGIN DANY
Write-Host "[2/6] Login Dany..." -ForegroundColor Yellow
$body2 = @{correo="dany@gmail.com"; contrasena="Kenny1234"} | ConvertTo-Json -Compress
$response2 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $body2 -ContentType "application/json"
$token2 = $response2.data.access_token
$user2 = $response2.data.usuario
$userId2 = $user2.id_usuario
Write-Host "OK - $($user2.nombre) $($user2.apellido) (Usuario ID $userId2)" -ForegroundColor Green
Write-Host ""

# NOTIFICACIONES INICIALES DANY
Write-Host "[3/6] Obteniendo notificaciones iniciales de Dany..." -ForegroundColor Yellow
$headers2 = @{
    "Authorization" = "Bearer $token2"
}
$notifs1 = Invoke-RestMethod -Uri "$baseUrl/notificaciones/?only_unread=true" -Method GET -Headers $headers2
$countInicial = $notifs1.data.Count
Write-Host "OK - Notificaciones no leidas: $countInicial" -ForegroundColor Green
Write-Host ""

# OBTENER GRUPOS DE KENNY
Write-Host "[4/6] Obteniendo grupos de Kenny..." -ForegroundColor Yellow
$headers1 = @{
    "Authorization" = "Bearer $token1"
}
$grupos = Invoke-RestMethod -Uri "$baseUrl/grupos/" -Method GET -Headers $headers1

if ($grupos.data.Count -eq 0) {
    Write-Host "❌ Kenny no tiene grupos. Crea un grupo primero.`n" -ForegroundColor Red
    exit
}

$grupo = $grupos.data[0]
$grupoId = $grupo.id_grupo
Write-Host "OK - Grupo '$($grupo.nombre)' (Grupo ID $grupoId)" -ForegroundColor Green
Write-Host ""

# ENVIAR INVITACIÓN
Write-Host "[5/6] Kenny invita a Dany al grupo..." -ForegroundColor Yellow
$inviteBody = @{correo="dany@gmail.com"} | ConvertTo-Json -Compress
try {
    $invite = Invoke-RestMethod -Uri "$baseUrl/grupos/$grupoId/invitar" -Method POST -Body $inviteBody -ContentType "application/json" -Headers $headers1
    Write-Host "OK - Invitacion enviada" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠️ $($_.Exception.Message)" -ForegroundColor Yellow
    if ($_ -match "ya está en el grupo" -or $_ -match "ya tiene una invitación") {
        Write-Host "   (Esto es normal si ya había una invitación previa)`n" -ForegroundColor Gray
    }
}

Start-Sleep -Seconds 2

# VERIFICAR NOTIFICACIONES FINALES
Write-Host "[6/6] Verificando notificaciones de Dany..." -ForegroundColor Yellow
$notifs2 = Invoke-RestMethod -Uri "$baseUrl/notificaciones/?only_unread=true" -Method GET -Headers $headers2
$countFinal = $notifs2.data.Count
$nuevas = $countFinal - $countInicial

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RESULTADO                                                   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📊 Notificaciones iniciales: $countInicial" -ForegroundColor White
Write-Host "📊 Notificaciones finales:   $countFinal" -ForegroundColor White
Write-Host "📊 Notificaciones nuevas:    $nuevas`n" -ForegroundColor White

if ($nuevas -gt 0) {
    Write-Host "EXITO! El sistema de notificaciones funciona correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Última notificación recibida:" -ForegroundColor Cyan
    $ultima = $notifs2.data[0]
    Write-Host "   Tipo:     $($ultima.tipo_notificacion)" -ForegroundColor White
    Write-Host "   Título:   $($ultima.titulo)" -ForegroundColor White
    Write-Host "   Mensaje:  $($ultima.mensaje)" -ForegroundColor White
    Write-Host "   Fecha:    $($ultima.fecha_creacion)" -ForegroundColor Gray
    Write-Host "   Leída:    $(if ($ultima.leida) {'Sí'} else {'No'})`n" -ForegroundColor White
} else {
    Write-Host "⚠️ No se detectaron notificaciones nuevas" -ForegroundColor Yellow
    Write-Host "   Posibles razones:" -ForegroundColor Gray
    Write-Host "   - Dany ya está en el grupo" -ForegroundColor Gray
    Write-Host "   - Ya existe invitación pendiente" -ForegroundColor Gray
    Write-Host "   - Las notificaciones ya fueron leídas antes`n" -ForegroundColor Gray
    
    Write-Host "📋 Todas las notificaciones no leídas de Dany:" -ForegroundColor Cyan
    foreach ($notif in $notifs2.data) {
        Write-Host "   - [$($notif.tipo_notificacion)] $($notif.titulo)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Test completado" -ForegroundColor Green
Write-Host ""
