# Instrucciones para subir SerenVoice a GitHub

## Paso 1: Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre: **SerenVoice**
3. Descripción: **Plataforma de análisis de emociones por voz con IA**
4. Private o Public (tu elección)
5. NO marques opciones de inicialización
6. Click "Create repository"

## Paso 2: Conectar y subir (ejecutar estos comandos)

Reemplaza `TU_USUARIO_GITHUB` con tu usuario real de GitHub:

```bash
# Agregar el repositorio remoto
git remote add origin https://github.com/TU_USUARIO_GITHUB/SerenVoice.git

# Subir todos los archivos
git push -u origin master
```

Si te pide autenticación, usa un **Personal Access Token** en lugar de contraseña:
- Ve a: https://github.com/settings/tokens
- "Generate new token" → "Generate new token (classic)"
- Marca: `repo` (todos los permisos de repositorio)
- Copia el token y úsalo como contraseña

## Paso 3: Agregar colaborador

1. Ve a tu repositorio en GitHub
2. Click en **"Settings"** (engranaje arriba)
3. En el menú izquierdo, click en **"Collaborators"**
4. Click en **"Add people"**
5. Busca y agrega: **john.montenegro.est@tecazuay.edu.ec**
6. Envía la invitación

John recibirá un email para aceptar la colaboración.

## Comandos rápidos después de configurar

```bash
# Ver estado
git status

# Agregar cambios
git add .

# Hacer commit
git commit -m "Descripción de cambios"

# Subir cambios
git push

# Descargar cambios de otros
git pull
```

## ⚠️ Importante
- Ambos deben hacer `git pull` antes de trabajar para tener la última versión
- Hagan `git push` después de cada sesión de trabajo
- Si hay conflictos, Git les avisará y deberán resolverlos manualmente
