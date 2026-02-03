param(
    [string]$kennyEmail = "kenny@gmail.com",
    [string]$kennyPass = "Kenny123",
    [string]$danyEmail = "dany@gmail.com",
    [string]$danyPass = "Kenny1234"
)

$baseUrl = "https://serenvoice-backend-11587771642.us-central1.run.app/api"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  TEST SISTEMA DE NOTIFICACIONES - ACTIVIDADES GRUPALES" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# ==================== PASO 1: LOGIN KENNY ====================
Write-Host "[1/7] Login Kenny ($kennyEmail)..." -ForegroundColor Yellow
try {
    $loginKenny = Invoke-RestMethod `
        -Uri "$baseUrl/auth/login" `
        -Method POST `
        -Body (@{correo=$kennyEmail; contrasena=$kennyPass} | ConvertTo-Json) `
        -ContentType "application/json"
    
    $global:tokenKenny = $loginKenny.token
    $global:userKenny = $loginKenny.user
    $global:userIdKenny = $global:userKenny.id_usuario
    
    Write-Host "OK - $($global:userKenny.nombre) $($global:userKenny.apellido) (ID: $global:userIdKenny)" -ForegroundColor Green
} catch {
    Write-Host "ERROR - No se pudo hacer login con Kenny: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ==================== PASO 2: LOGIN DANY ====================
Write-Host "[2/7] Login Dany ($danyEmail)..." -ForegroundColor Yellow
try {
    $loginDany = Invoke-RestMethod `
        -Uri "$baseUrl/auth/login" `
        -Method POST `
        -Body (@{correo=$danyEmail; contrasena=$danyPass} | ConvertTo-Json) `
        -ContentType "application/json"
    
    $global:tokenDany = $loginDany.token
    $global:userDany = $loginDany.user
    $global:userIdDany = $global:userDany.id_usuario
    
    Write-Host "OK - $($global:userDany.nombre) $($global:userDany.apellido) (ID: $global:userIdDany)" -ForegroundColor Green
} catch {
    Write-Host "ERROR - No se pudo hacer login con Dany: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ==================== PASO 3: NOTIFICACIONES INICIALES DANY ====================
Write-Host "[3/7] Verificando notificaciones iniciales de Dany..." -ForegroundColor Yellow
try {
    $notifsIniciales = Invoke-RestMethod `
        -Uri "$baseUrl/notificaciones/?only_unread=true" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $global:tokenDany"}
    
    $global:countInicial = $notifsIniciales.Count
    Write-Host "OK - Notificaciones no leidas: $global:countInicial" -ForegroundColor Green
} catch {
    Write-Host "AVISO - Error obteniendo notificaciones: $($_.Exception.Message)" -ForegroundColor Yellow
    $global:countInicial = 0
}
Write-Host ""

# ==================== PASO 4: OBTENER GRUPOS DE KENNY ====================
Write-Host "[4/7] Obteniendo grupos de Kenny..." -ForegroundColor Yellow
try {
    $grupos = Invoke-RestMethod `
        -Uri "$baseUrl/grupos/" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $global:tokenKenny"}
    
    if ($grupos.Count -eq 0) {
        Write-Host "ERROR - Kenny no tiene grupos. Por favor crea un grupo primero." -ForegroundColor Red
        exit 1
    }
    
    $global:grupo = $grupos[0]
    $global:grupoId = $global:grupo.id_grupo
    $global:grupoNombre = $global:grupo.nombre_grupo
    Write-Host "OK - Grupo '$global:grupoNombre' (ID: $global:grupoId)" -ForegroundColor Green
} catch {
    Write-Host "ERROR - No se pudieron obtener grupos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ==================== PASO 5: VERIFICAR SI DANY ESTA EN EL GRUPO ====================
Write-Host "[5/7] Verificando si Dany esta en el grupo..." -ForegroundColor Yellow
try {
    $miembros = Invoke-RestMethod `
        -Uri "$baseUrl/grupos/$global:grupoId/miembros" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $global:tokenKenny"}
    
    $danyEnGrupo = $miembros | Where-Object { $_.id_usuario -eq $global:userIdDany }
    
    if ($null -eq $danyEnGrupo) {
        Write-Host "Dany NO esta en el grupo. Debe estar en el mismo grupo para recibir notificaciones." -ForegroundColor Yellow
        Write-Host "Por favor, invita y acepta a Dany en el grupo desde la app, luego vuelve a ejecutar este test." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "OK - Dany esta en el grupo" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR - No se pudieron verificar miembros: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ==================== PASO 6: OBTENER O CREAR ACTIVIDAD GRUPAL ====================
Write-Host "[6/7] Obteniendo actividades del grupo..." -ForegroundColor Yellow
try {
    $actividades = Invoke-RestMethod `
        -Uri "$baseUrl/actividades-grupo/grupo/$global:grupoId" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $global:tokenKenny"}
    
    if ($actividades.Count -eq 0) {
        Write-Host "No hay actividades. Creando una actividad de prueba..." -ForegroundColor Yellow
        $actividadBody = @{
            titulo = "Test Notificaciones $(Get-Date -Format 'HH:mm:ss')"
            descripcion = "Actividad de prueba para sistema de notificaciones"
            fecha_inicio = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            duracion_minutos = 10
        } | ConvertTo-Json
        
        $nuevaActividad = Invoke-RestMethod `
            -Uri "$baseUrl/actividades-grupo/grupo/$global:grupoId" `
            -Method POST `
            -Body $actividadBody `
            -ContentType "application/json" `
            -Headers @{"Authorization" = "Bearer $global:tokenKenny"}
        
        $global:actividadId = $nuevaActividad.id_actividad
        Write-Host "OK - Actividad creada (ID: $global:actividadId)" -ForegroundColor Green
    } else {
        $actividad = $actividades[0]
        $global:actividadId = $actividad.id_actividad
        Write-Host "OK - Usando actividad '$($actividad.titulo)' (ID: $global:actividadId)" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR - No se pudieron gestionar actividades: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ==================== PASO 7: AGREGAR DANY A LA ACTIVIDAD (ENVIO DE NOTIFICACION) ====================
Write-Host "[7/7] Kenny agrega a Dany a la actividad (esto envia la notificacion)..." -ForegroundColor Yellow
try {
    $agregarBody = @{usuario_id = $global:userIdDany} | ConvertTo-Json
    $agregar = Invoke-RestMethod `
        -Uri "$baseUrl/actividades-grupo/$global:actividadId/agregar_participante" `
        -Method POST `
        -Body $agregarBody `
        -ContentType "application/json" `
        -Headers @{"Authorization" = "Bearer $global:tokenKenny"}
    
    Write-Host "OK - Dany agregado a la actividad. Notificacion enviada!" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -match "ya es participante" -or $errorMsg -match "already") {
        Write-Host "INFO - Dany ya era participante de esta actividad (notificacion enviada previamente)" -ForegroundColor Cyan
    } else {
        Write-Host "ERROR - $errorMsg" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "Esperando 3 segundos para que llegue la notificacion..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# ==================== VERIFICACION FINAL ====================
Write-Host "Verificando notificaciones de Dany..." -ForegroundColor Yellow
try {
    $notifsFinales = Invoke-RestMethod `
        -Uri "$baseUrl/notificaciones/?only_unread=true" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $global:tokenDany"}
    
    $countFinal = $notifsFinales.Count
    $nuevas = $countFinal - $global:countInicial
    
    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "  RESULTADO" -ForegroundColor Cyan
    Write-Host "============================================================`n" -ForegroundColor Cyan
    
    Write-Host "Notificaciones iniciales:  $global:countInicial" -ForegroundColor White
    Write-Host "Notificaciones finales:    $countFinal" -ForegroundColor White
    Write-Host "Notificaciones NUEVAS:     $nuevas`n" -ForegroundColor $(if ($nuevas -gt 0) {"Green"} else {"Yellow"})
    
    if ($nuevas -gt 0) {
        Write-Host "==> EXITO! El sistema de notificaciones funciona correctamente`n" -ForegroundColor Green
        Write-Host "Detalle de la ultima notificacion recibida:" -ForegroundColor Cyan
        $ultima = $notifsFinales[0]
        Write-Host "  Tipo:      $($ultima.tipo_notificacion)" -ForegroundColor White
        Write-Host "  Titulo:    $($ultima.titulo)" -ForegroundColor White
        Write-Host "  Mensaje:   $($ultima.mensaje)" -ForegroundColor White
        Write-Host "  Prioridad: $($ultima.prioridad)" -ForegroundColor White
        Write-Host "  Fecha:     $($ultima.fecha_creacion)" -ForegroundColor Gray
        Write-Host "  Leida:     $(if ($ultima.leida) {'Si'} else {'No'})`n" -ForegroundColor White
    } else {
        Write-Host "==> NO se detectaron notificaciones nuevas" -ForegroundColor Yellow
        Write-Host "`nPosibles razones:" -ForegroundColor Gray
        Write-Host "  1. Dany ya estaba agregado a esta actividad" -ForegroundColor Gray
        Write-Host "  2. La notificacion ya fue enviada en un test anterior" -ForegroundColor Gray
        Write-Host "  3. Las notificaciones ya fueron marcadas como leidas`n" -ForegroundColor Gray
        
        if ($notifsFinales.Count -gt 0) {
            Write-Host "Listado de notificaciones no leidas de Dany:" -ForegroundColor Cyan
            $notifsFinales | Select-Object -First 5 | ForEach-Object {
                Write-Host "  - [$($_.tipo_notificacion)] $($_.titulo) - $($_.fecha_creacion)" -ForegroundColor White
            }
            Write-Host ""
        }
    }
} catch {
    Write-Host "ERROR - No se pudieron verificar notificaciones: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "============================================================`n" -ForegroundColor Cyan
