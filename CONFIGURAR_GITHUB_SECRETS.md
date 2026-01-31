# 🔐 Configurar Secretos de GitHub para CI/CD

Para que el workflow de GitHub Actions funcione completamente y pueda desplegar automáticamente a Google Cloud, necesitas configurar los siguientes secretos.

## 📋 Secretos Requeridos

### 1. Ir a la configuración de secretos

1. Ve a tu repositorio en GitHub: `https://github.com/Kenny010604/SerenVoice-Analisi-de-Voz`
2. Click en **Settings** (⚙️)
3. En el menú izquierdo, ve a **Secrets and variables** > **Actions**
4. Click en **New repository secret**

---

### 2. Secretos de Google Cloud Platform

#### `GCP_PROJECT_ID`
- **Descripción**: ID del proyecto de Google Cloud
- **Valor**: Tu project ID (ejemplo: `serenvoice-123456`)
- **Cómo obtenerlo**:
  ```bash
  gcloud config get-value project
  ```

#### `GCP_SA_KEY`
- **Descripción**: Clave JSON de la cuenta de servicio de GCP
- **Cómo obtenerlo**:
  
  1. Ve a Google Cloud Console
  2. **IAM & Admin** > **Service Accounts**
  3. Crea una cuenta de servicio o usa una existente
  4. Asigna roles:
     - `Cloud Run Admin`
     - `Storage Admin`
     - `Cloud Functions Developer`
     - `Service Account User`
  5. Click en la cuenta de servicio > **Keys** > **Add Key** > **Create new key**
  6. Selecciona **JSON** y descarga el archivo
  7. Abre el archivo JSON y copia **TODO** el contenido
  8. Pega el contenido completo en el secreto de GitHub

---

### 3. Secretos de Base de Datos

#### `DB_HOST`
- **Descripción**: Host de la base de datos
- **Valor**: Tu host de Railway/Cloud SQL (ejemplo: `containers-us-west-123.railway.app`)

#### `DB_PORT`
- **Descripción**: Puerto de la base de datos
- **Valor**: `3306` (MySQL) o tu puerto personalizado

#### `DB_USER`
- **Descripción**: Usuario de la base de datos
- **Valor**: Tu usuario (ejemplo: `root` o `admin`)

#### `DB_PASSWORD`
- **Descripción**: Contraseña de la base de datos
- **Valor**: Tu contraseña de base de datos

#### `DB_NAME`
- **Descripción**: Nombre de la base de datos
- **Valor**: `serenvoice`

---

### 4. Otros Secretos

#### `JWT_SECRET_KEY`
- **Descripción**: Clave secreta para JWT
- **Cómo generarla**:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- **Ejemplo**: `7f3d8e9a2b1c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c`

#### `GROQ_API_KEY` (opcional)
- **Descripción**: API key de Groq para recomendaciones con IA
- **Cómo obtenerla**: https://console.groq.com/keys

---

## ✅ Verificar Configuración

Una vez configurados todos los secretos:

1. Ve a **Actions** en tu repositorio
2. Selecciona el workflow **Deploy SerenVoice**
3. Click en **Run workflow**
4. Selecciona la rama `main`
5. Click en **Run workflow**

El workflow debería ejecutarse completamente sin errores de autenticación.

---

## 🚫 Sin Secretos Configurados

Si no configuras los secretos, el workflow:
- ✅ **Sí ejecutará**: Tests, compilación de Go
- ⚠️ **NO ejecutará**: Deployment a Cloud Run

Verás un mensaje:
```
⚠️ Deployment omitido - secretos de GCP no configurados
Configure GCP_SA_KEY, GCP_PROJECT_ID y otros secretos en GitHub Settings > Secrets
```

---

## 🔒 Seguridad

- ⚠️ **NUNCA** compartas estos secretos públicamente
- ⚠️ **NUNCA** los subas al repositorio (están protegidos por `.gitignore`)
- ✅ Solo configúralos en GitHub Secrets
- ✅ GitHub los encripta automáticamente
- ✅ No son visibles en los logs de Actions

---

## 📝 Resumen de Comandos

```bash
# Ver project ID actual
gcloud config get-value project

# Listar cuentas de servicio
gcloud iam service-accounts list

# Crear nueva cuenta de servicio (si no tienes una)
gcloud iam service-accounts create serenvoice-github-actions \
  --display-name="SerenVoice GitHub Actions"

# Asignar roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:serenvoice-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Crear clave JSON
gcloud iam service-accounts keys create key.json \
  --iam-account=serenvoice-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Mostrar contenido del archivo (para copiar)
cat key.json

# IMPORTANTE: Eliminar el archivo después de copiarlo
rm key.json
```

---

## 🆘 Problemas Comunes

### Error: "credentials_json must be specified"
- **Solución**: Verifica que `GCP_SA_KEY` esté configurado correctamente con el JSON completo

### Error: "Permission denied"
- **Solución**: Verifica que la cuenta de servicio tenga los roles necesarios

### Error: "Project not found"
- **Solución**: Verifica que `GCP_PROJECT_ID` esté correcto

### Tests fallan pero deployment no
- **Solución**: Es normal, el deployment solo se ejecuta en la rama `main` y si los secretos están configurados
