# Test de Sistema de Notificaciones - SerenVoice

Write-Host "`n" -ForegroundColor Cyan
Write-Host "  TEST SISTEMA DE NOTIFICACIONES ENTRE USUARIOS               " -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor Cyan

$baseUrl = "https://serenvoice-backend-11587771642.us-central1.run.app/api"

# INSTRUCCIONES
Write-Host " INSTRUCCIONES PARA PROBAR:" -ForegroundColor Yellow
Write-Host "1. Ingresa las credenciales de DOS usuarios diferentes" -ForegroundColor White
Write-Host "2. El script hará que Usuario 1 envíe una invitación a grupo a Usuario 2" -ForegroundColor White
Write-Host "3. Verificaremos que Usuario 2 reciba la notificación`n" -ForegroundColor White

# LOGIN USUARIO 1
Write-Host "" -ForegroundColor Gray
Write-Host " USUARIO 1 (quien enviará la invitación):`n" -ForegroundColor Cyan
$correo1 = Read-Host "Correo"
$pass1 = Read-Host "Contraseña" -AsSecureString
$pass1Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass1))

try {
    $loginBody1 = @{correo=$correo1; contrasena=$pass1Plain} | ConvertTo-Json
    $login1 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody1 -ContentType "application/json"
    $token1 = $login1.data.access_token
    $user1 = $login1.data.usuario
    Write-Host "`n Login exitoso: $($user1.nombre) $($user1.apellido) (ID: $($user1.id_usuario))" -ForegroundColor Green
} catch {
    Write-Host "`n Error en login Usuario 1: $_" -ForegroundColor Red
    exit
}

# LOGIN USUARIO 2
Write-Host "`n" -ForegroundColor Gray
Write-Host " USUARIO 2 (quien recibirá la notificación):`n" -ForegroundColor Cyan
$correo2 = Read-Host "Correo"
$pass2 = Read-Host "Contraseña" -AsSecureString
$pass2Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass2))

try {
    $loginBody2 = @{correo=$correo2; contrasena=$pass2Plain} | ConvertTo-Json
    $login2 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody2 -ContentType "application/json"
    $token2 = $login2.data.access_token
    $user2 = $login2.data.usuario
    Write-Host "`n Login exitoso: $($user2.nombre) $($user2.apellido) (ID: $($user2.id_usuario))" -ForegroundColor Green
} catch {
    Write-Host "`n Error en login Usuario 2: $_" -ForegroundColor Red
    exit
}

# VERIFICAR NOTIFICACIONES INICIALES Usuario 2
Write-Host "`n" -ForegroundColor Gray
Write-Host " ESTADO INICIAL - Notificaciones de $($user2.nombre):" -ForegroundColor Yellow

$headers2 = @{"Authorization" = "Bearer $token2"}
try {
    $initialNotifs = Invoke-RestMethod -Uri "$baseUrl/notificaciones/?only_unread=true" -Method GET -Headers $headers2
    Write-Host "No leídas antes: $($initialNotifs.data.Count)" -ForegroundColor Cyan
} catch {
    Write-Host " Error obteniendo notificaciones: $_" -ForegroundColor Yellow
}

# OBTENER GRUPOS DEL USUARIO 1
Write-Host "`n" -ForegroundColor Gray
Write-Host " PASO 1: Obteniendo grupos de $($user1.nombre)..." -ForegroundColor Yellow

$headers1 = @{"Authorization" = "Bearer $token1"}
try {
    $grupos = Invoke-RestMethod -Uri "$baseUrl/grupos/" -Method GET -Headers $headers1
    if ($grupos.data.Count -gt 0) {
        $grupo = $grupos.data[0]
        Write-Host " Grupo encontrado: $($grupo.nombre) (ID: $($grupo.id_grupo))" -ForegroundColor Green
        
        # ENVIAR INVITACIÓN
        Write-Host "`n" -ForegroundColor Gray
        Write-Host " PASO 2: $($user1.nombre) invita a $($user2.nombre) al grupo..." -ForegroundColor Yellow
        
        $inviteBody = @{correo=$correo2} | ConvertTo-Json
        try {
            $invite = Invoke-RestMethod -Uri "$baseUrl/grupos/$($grupo.id_grupo)/invitar" -Method POST -Body $inviteBody -ContentType "application/json" -Headers $headers1
            Write-Host " Invitación enviada correctamente" -ForegroundColor Green
            
            Start-Sleep -Seconds 2
            
            # VERIFICAR NOTIFICACIONES DESPUÉS
            Write-Host "`n" -ForegroundColor Gray
            Write-Host " PASO 3: Verificando notificaciones de $($user2.nombre)..." -ForegroundColor Yellow
            
            $finalNotifs = Invoke-RestMethod -Uri "$baseUrl/notificaciones/?only_unread=true" -Method GET -Headers $headers2
            Write-Host "`n RESULTADO:" -ForegroundColor Cyan
            Write-Host "   Notificaciones nuevas: $($finalNotifs.data.Count - $initialNotifs.data.Count)" -ForegroundColor White
            Write-Host "   Total no leídas ahora: $($finalNotifs.data.Count)" -ForegroundColor White
            
            if ($finalNotifs.data.Count -gt $initialNotifs.data.Count) {
                Write-Host "`n NOTIFICACIÓN RECIBIDA CORRECTAMENTE!" -ForegroundColor Green
                Write-Host "`n Detalles de la notificación más reciente:" -ForegroundColor Cyan
                $lastNotif = $finalNotifs.data[0]
                Write-Host "   Tipo: $($lastNotif.tipo_notificacion)" -ForegroundColor White
                Write-Host "   Título: $($lastNotif.titulo)" -ForegroundColor White
                Write-Host "   Mensaje: $($lastNotif.mensaje)" -ForegroundColor White
                Write-Host "   Fecha: $($lastNotif.fecha_creacion)" -ForegroundColor White
            } else {
                Write-Host "`n NO SE RECIBIÓ NOTIFICACIÓN" -ForegroundColor Red
                Write-Host "   Posible problema en el sistema de notificaciones" -ForegroundColor Yellow
            }
            
        } catch {
            Write-Host " Error enviando invitación: $_" -ForegroundColor Red
        }
        
    } else {
        Write-Host " Usuario 1 no tiene grupos. Crea un grupo primero." -ForegroundColor Red
    }
} catch {
    Write-Host " Error obteniendo grupos: $_" -ForegroundColor Red
}

Write-Host "`n" -ForegroundColor Cyan
Write-Host "  TEST COMPLETADO                                             " -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor Cyan
