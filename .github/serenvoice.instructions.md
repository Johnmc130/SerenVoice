---
applyTo: '**'
---

# SerenVoice - Instrucciones Generales del Proyecto

> **Versión**: 2.0.0  
> **Última actualización**: Enero 2026  
> **Instrucciones específicas**: Ver `backend.instructions.md` y `frontend.instructions.md`

---

## 🎯 Contexto del Proyecto

**SerenVoice** es una aplicación de análisis de voz y detección de emociones que procesa datos altamente sensibles. La aplicación permite a los usuarios grabar audio, analizar sus emociones, recibir recomendaciones terapéuticas y acceder a juegos de bienestar.

### Stack Tecnológico

| Capa | Tecnología | Ubicación |
|------|------------|-----------|
| **Frontend Web** | React 19 + Vite 7 + MUI 7 | `proyectofinal-frontend/` |
| **Frontend Mobile** | React Native + Expo | `proyectofinal-mobile/` |
| **Backend** | Python 3.11 + Flask 3.1 | `backend/` |
| **Base de Datos** | MySQL 8.x | Configuración en `backend/database/` |
| **Auth** | JWT + Google OAuth | Flask-JWT-Extended |
| **AI/ML** | Groq API + scikit-learn + librosa | `backend/services/` |

### Arquitectura de Carpetas

```
SerenVoice/
├── backend/                    # API Flask
│   ├── routes/                 # Endpoints REST
│   ├── services/               # Lógica de negocio
│   ├── models/                 # Modelos de datos
│   ├── database/               # Configuración DB
│   ├── utils/                  # Utilidades y seguridad
│   └── tests/                  # Tests del backend
│
├── proyectofinal-frontend/     # App Web React
│   └── src/
│       ├── components/         # Componentes UI
│       ├── Pages/              # Páginas
│       ├── services/           # Servicios API
│       ├── context/            # Context API
│       ├── hooks/              # Custom hooks
│       └── utils/              # Utilidades
│
├── proyectofinal-mobile/       # App Mobile Expo
│
└── .github/instructions/       # Instrucciones Copilot
    ├── serenvoice.instructions.md  # General (este archivo)
    ├── backend.instructions.md     # Backend específico
    └── frontend.instructions.md    # Frontend específico
```

---

## 🚨 Reglas Fundamentales (OBLIGATORIAS)

### 1. Respetar Estructura Existente
- **NO** renombrar, mover o reestructurar carpetas existentes
- **NO** cambiar patrones de arquitectura sin aprobación explícita
- **NO** introducir nuevas dependencias sin justificación clara
- Colocar archivos nuevos en las carpetas correspondientes según dominio

### 2. Contratos de API Inmutables
- **NO** cambiar URLs de endpoints existentes
- **NO** modificar schemas de respuesta sin:
  - Plan de migración documentado
  - Estrategia de compatibilidad hacia atrás
  - Aprobación explícita del usuario

### 3. Datos Sensibles - Tratamiento Especial
Los datos de voz y emociones son **ALTAMENTE SENSIBLES**:

| Tipo de Dato | Tratamiento |
|--------------|-------------|
| Audio/voz crudo | NUNCA loguear, almacenar temporalmente |
| Métricas emocionales | NO loguear valores individuales |
| Tokens JWT | Solo en memoria (frontend) o servidor (backend) |
| Contraseñas | Hash bcrypt, NUNCA loguear |
| Emails | Enmascarar en logs |

---

## 🔒 Seguridad (Aplicar SIEMPRE)

### Backend
- Usar `@jwt_required()` en endpoints protegidos
- Aplicar `@limiter.limit()` para rate limiting
- Sanitizar inputs con funciones de `utils/seguridad.py`
- Usar queries parametrizadas (NUNCA concatenar SQL)
- Validar y escapar todas las entradas de usuario

### Frontend  
- Usar `secureStorage` para tokens (NO localStorage)
- Usar `secureLogger` en lugar de `console.log`
- Sanitizar inputs con `utils/sanitize.js` (DOMPurify)
- Usar `ProtectedRoute` para rutas autenticadas
- Aplicar `useRateLimiter` en formularios sensibles

### Comunicación
- HTTPS obligatorio (TLS 1.3)
- CORS configurado estrictamente (no wildcard `*`)
- Cookies: `HttpOnly`, `Secure`, `SameSite=Strict`
- Headers de seguridad: CSP, X-Frame-Options, etc.

---

## 📝 Convenciones de Código

### Nomenclatura

| Elemento | Backend (Python) | Frontend (React) |
|----------|------------------|------------------|
| Archivos | `snake_case.py` | `PascalCase.jsx` |
| Funciones | `snake_case` | `camelCase` |
| Clases | `PascalCase` | `PascalCase` |
| Constantes | `UPPER_SNAKE` | `UPPER_SNAKE` |
| Variables | `snake_case` | `camelCase` |

### Documentación Obligatoria
- **Backend**: Docstrings en funciones públicas, type hints PEP 484
- **Frontend**: JSDoc en componentes, PropTypes definidos

### Imports (orden)
**Backend:**
1. Stdlib (os, json, datetime)
2. Third-party (flask, jwt)
3. Local (routes, services, models)

**Frontend:**
1. React y hooks
2. Third-party (MUI, axios)
3. Componentes locales
4. Services/utils
5. Estilos

---

## 🔄 Flujo de Datos

```
┌─────────────┐      HTTPS/JWT      ┌─────────────┐
│   Frontend  │ ◄─────────────────► │   Backend   │
│  (React)    │                     │   (Flask)   │
└─────────────┘                     └─────────────┘
       │                                   │
       │ secureStorage                     │ MySQL
       │ Context API                       │ Groq API
       ▼                                   ▼
┌─────────────┐                     ┌─────────────┐
│  In-Memory  │                     │  Database   │
│   Tokens    │                     │  + AI/ML    │
└─────────────┘                     └─────────────┘
```

### Patrón de Comunicación
1. Frontend llama a `apiClient` (Axios configurado)
2. `apiClient` agrega token de `secureStorage`
3. Backend valida JWT con `@jwt_required()`
4. Route delega a Service
5. Service ejecuta lógica y llama a Model
6. Respuesta JSON estandarizada: `{ success: bool, data/error: ... }`

---

## ✅ Testing

### Backend
- **Ubicación**: `backend/tests/`
- **Framework**: pytest
- **Cobertura mínima**: 60%
- **Obligatorio**: Tests para nuevas rutas y servicios

### Frontend
- **Ubicación**: `proyectofinal-frontend/src/__tests__/`
- **Framework**: Vitest + React Testing Library
- **Cobertura mínima**: 60%
- **Obligatorio**: Tests para nuevos componentes y hooks

---

## 🛠 CI/CD y Calidad

### Checks Pre-Merge
```yaml
Backend:
  - ruff check (linting)
  - black --check (formato)
  - mypy (tipos)
  - pytest (tests)
  - bandit (SAST)

Frontend:
  - eslint (linting)
  - npm run build (compilación)
  - npm test (tests)
  - npm audit (dependencias)
```

### Herramientas de Calidad
| Herramienta | Propósito | Capa |
|-------------|-----------|------|
| ruff | Linting Python | Backend |
| black | Formato Python | Backend |
| mypy | Type checking | Backend |
| bandit | SAST Python | Backend |
| eslint | Linting JS | Frontend |
| prettier | Formato JS | Frontend |
| npm audit | SCA | Frontend |

---

## 📋 Checklist para Cambios

Antes de proponer cualquier cambio, verificar:

### Estructura
- [ ] Archivos en carpetas correctas según dominio
- [ ] Nomenclatura según convenciones
- [ ] No se renombraron/movieron archivos existentes

### Seguridad
- [ ] Inputs sanitizados
- [ ] Sin datos sensibles en logs
- [ ] Endpoints protegidos con JWT (si aplica)
- [ ] Rate limiting aplicado (si aplica)

### Código
- [ ] Type hints/PropTypes incluidos
- [ ] Documentación (docstrings/JSDoc)
- [ ] Manejo de errores implementado
- [ ] Sin console.log/print de debug

### Testing
- [ ] Tests unitarios para nueva funcionalidad
- [ ] Tests existentes siguen pasando

### API (si aplica)
- [ ] Schema de request/response documentado
- [ ] Respuesta sigue formato `{ success, data/error }`
- [ ] Backward compatible (o plan de migración)

---

## 🔗 Referencias a Instrucciones Específicas

Para detalles específicos de cada capa, consultar:

- **Backend**: `.github/instructions/backend.instructions.md`
  - Arquitectura Flask detallada
  - Patrones de routes/services/models
  - Seguridad y autenticación
  - Base de datos y queries

- **Frontend**: `.github/instructions/frontend.instructions.md`
  - Arquitectura React detallada
  - Componentes y MUI
  - Context API y hooks
  - Seguridad del cliente

---

## ❓ Clarificaciones

Si falta información necesaria para completar una tarea:
1. Hacer **UNA** pregunta clarificadora concisa
2. Especificar qué información exacta se necesita
3. Proponer opciones si es posible
4. Esperar respuesta antes de proceder

**Siempre especificar rutas exactas** para archivos nuevos relativos a la raíz del repositorio.

---

## Resumen

> Respetar estructura existente. Priorizar seguridad y privacidad.
> Incluir tests y documentación. Seguir convenciones establecidas.
> Consultar instrucciones específicas de backend y frontend para detalles.