$ErrorActionPreference = "Stop"
$baseUrl = "https://serenvoice-backend-11587771642.us-central1.run.app/api"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  TEST SISTEMA DE NOTIFICACIONES - ACTIVIDADES GRUPALES" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# ==================== PASO 1: LOGIN KENNY ====================
Write-Host "[1/7] Login Kenny..." -ForegroundColor Yellow
$body1 = @{correo="kenny@gmail.com"; contrasena="Kenny123"} | ConvertTo-Json -Compress
$response1 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $body1 -ContentType "application/json"
$token1 = $response1.data.access_token
$user1 = $response1.data.usuario
$userId1 = $user1.id_usuario
Write-Host "OK - Usuario: $($user1.nombre) $($user1.apellido) (ID: $userId1)" -ForegroundColor Green
Write-Host ""

# ==================== PASO 2: LOGIN DANY ====================
Write-Host "[2/7] Login Dany..." -ForegroundColor Yellow
$body2 = @{correo="dany@gmail.com"; contrasena="Kenny1234"} | ConvertTo-Json -Compress
$response2 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $body2 -ContentType "application/json"
$token2 = $response2.data.access_token
$user2 = $response2.data.usuario
$userId2 = $user2.id_usuario
Write-Host "OK - Usuario: $($user2.nombre) $($user2.apellido) (ID: $userId2)" -ForegroundColor Green
Write-Host ""

# ==================== PASO 3: VERIFICAR NOTIFICACIONES INICIALES ====================
Write-Host "[3/7] Verificando notificaciones iniciales de Dany..." -ForegroundColor Yellow
$headers2 = @{
    "Authorization" = "Bearer $token2"
}
try {
    $notifs1 = Invoke-RestMethod -Uri "$baseUrl/notificaciones/?only_unread=true" -Method GET -Headers $headers2
    $countInicial = $notifs1.data.Count
    Write-Host "OK - Notificaciones no leidas: $countInicial" -ForegroundColor Green
} catch {
    Write-Host "Error obteniendo notificaciones: $($_.Exception.Message)" -ForegroundColor Yellow
    $countInicial = 0
}
Write-Host ""

# ==================== PASO 4: OBTENER GRUPOS DE KENNY ====================
Write-Host "[4/7] Obteniendo grupos de Kenny..." -ForegroundColor Yellow
$headers1 = @{
    "Authorization" = "Bearer $token1"
}
$grupos = Invoke-RestMethod -Uri "$baseUrl/grupos/" -Method GET -Headers $headers1

if ($grupos.data.Count -eq 0) {
    Write-Host "ERROR - Kenny no tiene grupos. Crea un grupo primero." -ForegroundColor Red
    exit
}

$grupo = $grupos.data[0]
$grupoId = $grupo.id_grupo
Write-Host "OK - Grupo: '$($grupo.nombre)' (ID: $grupoId)" -ForegroundColor Green
Write-Host ""

# ==================== PASO 5: VERIFICAR/AGREGAR DANY AL GRUPO ====================
Write-Host "[5/7] Verificando si Dany esta en el grupo..." -ForegroundColor Yellow
try {
    $miembros = Invoke-RestMethod -Uri "$baseUrl/grupos/$grupoId/miembros" -Method GET -Headers $headers1
    $danyEnGrupo = $miembros.data | Where-Object { $_.id_usuario -eq $userId2 }
    
    if ($null -eq $danyEnGrupo) {
        Write-Host "Dany NO esta en el grupo. Enviando invitacion..." -ForegroundColor Yellow
        $inviteBody = @{correo="dany@gmail.com"} | ConvertTo-Json -Compress
        try {
            $invite = Invoke-RestMethod -Uri "$baseUrl/grupos/$grupoId/invitar" -Method POST -Body $inviteBody -ContentType "application/json" -Headers $headers1
            Write-Host "Invitacion enviada. Ahora Dany debe aceptarla desde su cuenta." -ForegroundColor Yellow
            Write-Host "Por favor, ve a la app con la cuenta de Dany y acepta la invitacion." -ForegroundColor Yellow
            Write-Host "Presiona Enter cuando hayas aceptado la invitacion..." -ForegroundColor Yellow
            Read-Host
        } catch {
            Write-Host "Error enviando invitacion: $($_.Exception.Message)" -ForegroundColor Red
            exit
        }
    } else {
        Write-Host "OK - Dany ya esta en el grupo" -ForegroundColor Green
    }
} catch {
    Write-Host "Error verificando miembros: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# ==================== PASO 6: OBTENER/CREAR ACTIVIDAD GRUPAL ====================
Write-Host "[6/7] Obteniendo actividades del grupo..." -ForegroundColor Yellow
try {
    $actividades = Invoke-RestMethod -Uri "$baseUrl/actividades-grupo/grupo/$grupoId" -Method GET -Headers $headers1
    
    if ($actividades.data.Count -eq 0) {
        Write-Host "No hay actividades. Creando una actividad de prueba..." -ForegroundColor Yellow
        $actBody = @{
            titulo = "Actividad de Prueba - Notificaciones"
            descripcion = "Prueba del sistema de notificaciones"
            fecha_inicio = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            duracion_minutos = 10
        } | ConvertTo-Json -Compress
        
        $nuevaAct = Invoke-RestMethod -Uri "$baseUrl/actividades-grupo/grupo/$grupoId" -Method POST -Body $actBody -ContentType "application/json" -Headers $headers1
        $actividadId = $nuevaAct.data.id_actividad
        Write-Host "OK - Actividad creada (ID: $actividadId)" -ForegroundColor Green
    } else {
        $actividad = $actividades.data[0]
        $actividadId = $actividad.id_actividad
        Write-Host "OK - Usando actividad existente: '$($actividad.titulo)' (ID: $actividadId)" -ForegroundColor Green
    }
} catch {
    Write-Host "Error con actividades: $($_.Exception.Message)" -ForegroundColor Red
    exit
}
Write-Host ""

# ==================== PASO 7: AGREGAR DANY A LA ACTIVIDAD ====================
Write-Host "[7/7] Kenny agrega a Dany a la actividad..." -ForegroundColor Yellow
Write-Host "Esto deberia enviar la notificacion..." -ForegroundColor Cyan
$addBody = @{usuario_id=$userId2} | ConvertTo-Json -Compress
try {
    $add = Invoke-RestMethod -Uri "$baseUrl/actividades-grupo/$actividadId/agregar_participante" -Method POST -Body $addBody -ContentType "application/json" -Headers $headers1
    Write-Host "OK - Dany agregado a la actividad" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -match "ya es participante") {
        Write-Host "INFO - Dany ya era participante de esta actividad" -ForegroundColor Yellow
    } else {
        Write-Host "Error: $errorMsg" -ForegroundColor Red
    }
}
Write-Host ""

Start-Sleep -Seconds 3

# ==================== VERIFICAR NOTIFICACIONES FINALES ====================
Write-Host "Verificando notificaciones de Dany..." -ForegroundColor Yellow
try {
    $notifs2 = Invoke-RestMethod -Uri "$baseUrl/notificaciones/?only_unread=true" -Method GET -Headers $headers2
    $countFinal = $notifs2.data.Count
    $nuevas = $countFinal - $countInicial
    
    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "  RESULTADO" -ForegroundColor Cyan
    Write-Host "============================================================`n" -ForegroundColor Cyan
    
    Write-Host "Notificaciones iniciales: $countInicial" -ForegroundColor White
    Write-Host "Notificaciones finales:   $countFinal" -ForegroundColor White
    Write-Host "Notificaciones nuevas:    $nuevas`n" -ForegroundColor White
    
    if ($nuevas -gt 0) {
        Write-Host "EXITO! El sistema de notificaciones funciona correctamente`n" -ForegroundColor Green
        Write-Host "Ultima notificacion recibida:" -ForegroundColor Cyan
        $ultima = $notifs2.data[0]
        Write-Host "  Tipo:     $($ultima.tipo_notificacion)" -ForegroundColor White
        Write-Host "  Titulo:   $($ultima.titulo)" -ForegroundColor White
        Write-Host "  Mensaje:  $($ultima.mensaje)" -ForegroundColor White
        Write-Host "  Fecha:    $($ultima.fecha_creacion)" -ForegroundColor Gray
        Write-Host "  Leida:    $(if ($ultima.leida) {'Si'} else {'No'})`n" -ForegroundColor White
    } else {
        Write-Host "AVISO - No se detectaron notificaciones nuevas" -ForegroundColor Yellow
        Write-Host "Posibles razones:" -ForegroundColor Gray
        Write-Host "  - Dany ya estaba en la actividad" -ForegroundColor Gray
        Write-Host "  - La notificacion ya fue enviada antes" -ForegroundColor Gray
        Write-Host "  - Las notificaciones ya fueron leidas`n" -ForegroundColor Gray
        
        if ($notifs2.data.Count -gt 0) {
            Write-Host "Todas las notificaciones no leidas de Dany:" -ForegroundColor Cyan
            foreach ($notif in $notifs2.data | Select-Object -First 5) {
                Write-Host "  - [$($notif.tipo_notificacion)] $($notif.titulo)" -ForegroundColor White
            }
        }
    }
} catch {
    Write-Host "Error verificando notificaciones: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest completado`n" -ForegroundColor Green
