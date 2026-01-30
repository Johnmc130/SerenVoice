# SerenVoice Frontend - GitHub Copilot Instructions

> **Versión**: 3.0.0  
> **Última actualización**: Enero 2026  
> **Aplica a**: `**`

---

## 📋 Índice

1. Contexto del Proyecto
2. Arquitectura y Estructura (Detallada)
3. Componentes y UI (MUI)
4. Estado y Context API (Implementación Real)
5. Servicios y API (Patrones Actuales)
6. Seguridad Frontend (Obligatorio)
7. Routing y Navegación
8. Hooks Personalizados (Implementación Real)
9. Estilos y Theming
10. Testing
11. Accesibilidad (a11y)
12. Performance
13. CI/CD y Calidad
14. Reglas Estrictas
15. Checklist para Nuevas Contribuciones
16. Convenciones de Código

---

## 🎯 Contexto del Proyecto

**SerenVoice** es una aplicación de análisis de voz y detección de emociones. El frontend maneja:
- Grabación y envío de audio para análisis
- Visualización de métricas emocionales
- Dashboard de bienestar del usuario
- Juegos terapéuticos interactivos (5 juegos)
- Sistema de alertas y notificaciones
- Panel de administración

### Stack Tecnológico Actual

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | React | 19.1.1 |
| Build Tool | Vite | 7.1.7 |
| UI Library | MUI (@mui/material) | 7.3.5 |
| Routing | React Router DOM | 7.9.5 |
| HTTP Client | Axios | 1.13.2 |
| State Management | Context API | Nativo |
| Animations | Framer Motion | 12.23.24 |
| Charts | chart.js, recharts | 4.5.1, 3.4.1 |
| Auth OAuth | @react-oauth/google | 0.12.2 |
| Sanitization | DOMPurify | 3.3.1 |
| Date Handling | date-fns | 4.1.0 |
| Icons | react-icons | 5.5.0 |
| Linting | ESLint | 9.x |

---

## 🏗 Arquitectura y Estructura

### Estructura de Carpetas (Actualizada)

```
proyectofinal-frontend/
├── src/
│   ├── App.jsx                    # Router principal y providers
│   ├── main.jsx                   # Entry point
│   ├── global.css                 # Estilos globales y variables CSS
│   │
│   ├── assets/                    # Imágenes, SVGs, fuentes
│   │   ├── FondoClaro.svg
│   │   ├── FondoOscuro.svg
│   │   └── logo.svg
│   │
│   ├── components/                # Componentes reutilizables
│   │   ├── Administrador/         # Componentes exclusivos admin
│   │   ├── common/                # Componentes genéricos
│   │   ├── Debug/                 # Componentes de debug (dev only)
│   │   ├── Grupos/                # Componentes de grupos
│   │   ├── Juegos/                # 5 juegos terapéuticos
│   │   │   ├── JuegoRespiracion.jsx   # Respiración guiada
│   │   │   ├── JuegoMemoria.jsx       # Memoria con tarjetas
│   │   │   ├── JuegoMandala.jsx       # Colorear mandalas
│   │   │   ├── JuegoPuzzle.jsx        # Puzzle numérico
│   │   │   └── JuegoMindfulness.jsx   # Mindfulness guiado
│   │   ├── Publico/               # Componentes públicos
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Spinner.jsx
│   │   ├── Shared/                # Componentes compartidos
│   │   │   └── PageCard.jsx       # Contenedor principal de páginas
│   │   └── Usuario/               # Componentes de usuario
│   │       ├── Sidebar.jsx
│   │       └── NavbarUsuario.jsx
│   │
│   ├── config/                    # Configuración
│   │   └── api.js                 # Endpoints y baseURL centralizados
│   │
│   ├── constants/                 # Constantes de la aplicación
│   │
│   ├── context/                   # Context API providers
│   │   ├── AlertasContext.jsx     # Estado de alertas (polling)
│   │   ├── AuthContext.jsx        # Auth con session timeout
│   │   ├── authContextDef.js      # Definición del AuthContext
│   │   ├── ThemeContext.jsx       # Tema claro/oscuro
│   │   └── themeContextDef.js     # Definición del ThemeContext
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useApi.js              # Hook genérico para llamadas API
│   │   ├── useAuth.js             # Hook de autenticación
│   │   ├── useJuegos.js           # Hook para juegos terapéuticos
│   │   ├── useRateLimiter.js      # Rate limiting en cliente
│   │   └── useSessionTimeout.js   # Timeout de inactividad (30min)
│   │
│   ├── layouts/                   # Layouts de página
│   │   ├── LayoutAdmin.jsx        # Layout para administradores
│   │   └── LayoutUsuario.jsx      # Layout para usuarios
│   │
│   ├── Pages/                     # Páginas de la aplicación
│   │   ├── PaginasAdministradores/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminUsuarios.jsx
│   │   │   ├── AdminAlertas.jsx
│   │   │   ├── AdminGrupos.jsx
│   │   │   └── AdminReportes.jsx
│   │   ├── PaginasPublicas/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── SobreNosotros.jsx
│   │   │   └── Contacto.jsx
│   │   └── PaginasUsuarios/
│   │       ├── Dashboard.jsx
│   │       ├── Perfil.jsx
│   │       ├── ActualizarPerfil.jsx
│   │       ├── AnalizarVoz.jsx
│   │       ├── Historial.jsx
│   │       ├── DetalleAnalisis.jsx
│   │       ├── Recomendaciones.jsx
│   │       ├── Juegos.jsx
│   │       ├── JuegoDetalle.jsx
│   │       ├── Grupos.jsx
│   │       └── Notificaciones.jsx
│   │
│   ├── services/                  # Servicios de API
│   │   ├── apiClient.js           # Axios instance con interceptors
│   │   ├── authService.js         # Autenticación + sanitización
│   │   ├── audioService.js        # Análisis de audio
│   │   ├── analisisService.js     # Historial de análisis
│   │   ├── recomendacionesService.js # Recomendaciones IA
│   │   ├── juegosService.js       # Juegos terapéuticos
│   │   ├── alertasService.js      # Alertas del usuario
│   │   ├── notificacionesService.js # Notificaciones
│   │   ├── groupsService.js       # Grupos
│   │   ├── userService.js         # Gestión de usuario
│   │   ├── adminService.js        # Funciones admin
│   │   ├── adminUsuarios.js       # Admin - usuarios
│   │   ├── rolesService.js        # Gestión de roles
│   │   ├── resultadosService.js   # Resultados de análisis
│   │   ├── reportesService.js     # Reportes
│   │   ├── sesionesService.js     # Sesiones
│   │   └── contactService.js      # Formulario de contacto
│   │
│   ├── styles/                    # Estilos CSS por módulo
│   │   ├── StylesAdmin/
│   │   │   ├── AdminDashboard.css
│   │   │   └── AdminUsuarios.css
│   │   └── StylesUsuarios/
│   │       ├── Dashboard.css
│   │       └── SidebarUsuario.css
│   │
│   └── utils/                     # Utilidades
│       ├── ProtectedRoute.jsx     # HOC para rutas protegidas
│       ├── sanitize.js            # Sanitización XSS (DOMPurify)
│       ├── secureLogger.js        # Logging seguro
│       ├── secureStorage.js       # Almacenamiento tokens (dual mode)
│       └── theme.js               # Utilidades de tema
│
├── public/                        # Assets estáticos
├── index.html                     # HTML principal
├── vite.config.js                 # Configuración Vite
├── eslint.config.js               # Configuración ESLint
└── package.json
```

### Patrón de Arquitectura: Pages → Layouts → Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.jsx                                  │
│  GoogleOAuthProvider → ThemeProvider → AuthProvider → Router    │
└─────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌──────────┐     ┌──────────┐     ┌──────────┐
       │  Public  │     │  Usuario │     │  Admin   │
       │  Pages   │     │  Pages   │     │  Pages   │
       └──────────┘     └──────────┘     └──────────┘
              │                │                │
              │         ┌──────┴──────┐        │
              │         ▼             ▼        │
              │   LayoutUsuario  LayoutAdmin   │
              │   (Sidebar +    (Admin        │
              │    Navbar)       Sidebar)      │
              └─────────┼─────────────┼────────┘
                        ▼             ▼
                   ┌──────────────────────┐
                   │     Components       │
                   │  (Shared, Usuario,   │
                   │   Admin, Juegos)     │
                   └──────────────────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │      Services        │
                   │  (apiClient, auth,   │
                   │   audio, analisis)   │
                   └──────────────────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │   secureStorage      │
                   │   + secureLogger     │
                   └──────────────────────┘
```

### Crear Nuevos Componentes

#### Nuevo Componente Reutilizable

```jsx
// src/components/Shared/NuevoComponente.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * NuevoComponente - Descripción breve
 * 
 * @param {Object} props
 * @param {string} props.titulo - Título a mostrar
 * @param {React.ReactNode} props.children - Contenido
 * @param {Function} props.onAction - Callback para acción
 */
const NuevoComponente = ({ 
  titulo,
  children,
  onAction,
  className = '',
  ...props 
}) => {
  const handleClick = () => {
    if (onAction) {
      onAction();
    }
  };

  return (
    <div 
      className={`nuevo-componente ${className}`}
      {...props}
    >
      <h3>{titulo}</h3>
      <div className="contenido">
        {children}
      </div>
      <button onClick={handleClick}>
        Acción
      </button>
    </div>
  );
};

NuevoComponente.propTypes = {
  titulo: PropTypes.string.isRequired,
  children: PropTypes.node,
  onAction: PropTypes.func,
  className: PropTypes.string,
};

export default NuevoComponente;
```

#### Nueva Página de Usuario

```jsx
// src/Pages/PaginasUsuarios/NuevaPagina.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import "../../global.css";
import PageCard from "../../components/Shared/PageCard";
import Spinner from "../../components/Publico/Spinner";
import authService from "../../services/authService";
import secureLogger from "../../utils/secureLogger";

const NuevaPagina = () => {
  const userData = authService.getUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        // Llamada a servicio
        const response = await servicioNecesario.getData();
        if (response?.success) {
          setData(response.data);
        }
      } catch (err) {
        secureLogger.error("Error cargando datos:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      cargarDatos();
    }
  }, [userData]);

  // Redirigir si no hay usuario
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <Spinner message="Cargando..." />;
  }

  return (
    <div className="page-content">
      <PageCard size="xl">
        <h2>Título de la Página</h2>
        {error && (
          <div className="activity-error">{error}</div>
        )}
        {data && (
          <div>
            {/* Contenido */}
          </div>
        )}
      </PageCard>
    </div>
  );
};

export default NuevaPagina;
```

---

## 📝 Convenciones de Código

### Nomenclatura de Archivos

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase | `NavbarUsuario.jsx`, `PageCard.jsx` |
| Páginas | PascalCase | `Dashboard.jsx`, `AnalizarVoz.jsx` |
| Hooks | camelCase con prefijo `use` | `useAuth.js`, `useRateLimiter.js` |
| Servicios | camelCase | `authService.js`, `apiClient.js` |
| Utilidades | camelCase | `sanitize.js`, `secureStorage.js` |
| Estilos | PascalCase para módulos | `SidebarUsuario.css` |
| Context | PascalCase | `AuthContext.jsx`, `ThemeContext.jsx` |

### Estructura de Componentes

```jsx
// 1. Imports - en orden
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

// 2. Third-party libraries
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

// 3. Local imports - components
import PageCard from "../../components/Shared/PageCard";
import Spinner from "../../components/Publico/Spinner";

// 4. Local imports - services/utils
import authService from "../../services/authService";
import secureLogger from "../../utils/secureLogger";
import { sanitizeText } from "../../utils/sanitize";

// 5. Styles
import "../../global.css";
import "./MiComponente.css";

/**
 * Descripción del componente con JSDoc
 */
const MiComponente = ({ prop1, prop2 }) => {
  // 6. Hooks primero
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const { contextValue } = useContext(MiContext);

  // 7. Effects
  useEffect(() => {
    // ...
  }, []);

  // 8. Handlers y funciones
  const handleAction = () => {
    // ...
  };

  // 9. Early returns
  if (!prop1) return null;

  // 10. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 11. PropTypes
MiComponente.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.func,
};

// 12. Default props (si aplica)
MiComponente.defaultProps = {
  prop2: () => {},
};

export default MiComponente;
```

### JSDoc para Componentes

```jsx
/**
 * ComponenteEjemplo - Muestra información del usuario
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.usuario - Datos del usuario
 * @param {string} props.usuario.nombre - Nombre del usuario
 * @param {string} props.usuario.email - Email del usuario
 * @param {boolean} [props.mostrarAvatar=true] - Si mostrar avatar
 * @param {Function} [props.onEdit] - Callback al editar
 * 
 * @example
 * <ComponenteEjemplo 
 *   usuario={{ nombre: "Juan", email: "juan@example.com" }}
 *   onEdit={(user) => console.log(user)}
 * />
 */
```

### Herramientas de Calidad

```bash
# Linting
npm run lint              # Ejecutar ESLint
npm run lint:fix          # Auto-fix problemas

# Formato (si está configurado Prettier)
npm run format
```

---

## 🎨 Componentes y UI (MUI)

### Uso de Material UI

```jsx
// ✅ CORRECTO - Importar componentes específicos
import { Button, TextField, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// ✅ Usar Box para layouts flexibles
<Box
  display="flex"
  flexDirection="column"
  gap={2}
  p={3}
>
  <Typography variant="h5">Título</Typography>
  <TextField label="Campo" fullWidth />
  <Button variant="contained" color="primary">
    Acción
  </Button>
</Box>

// ❌ INCORRECTO - No usar estilos inline extensos
<div style={{ 
  display: 'flex', 
  flexDirection: 'column',
  gap: '16px',
  padding: '24px'
}}>
```

### Componentes Compartidos del Proyecto

```jsx
// PageCard - Contenedor principal de páginas
import PageCard from "../components/Shared/PageCard";

<PageCard size="xl" align="left">
  <h2>Contenido</h2>
</PageCard>

// Sizes disponibles: 'sm' (600px), 'md' (900px), 'lg' (1000px), 'xl' (1200px), 'full' (100%)

// Spinner - Indicador de carga
import Spinner from "../components/Publico/Spinner";

<Spinner message="Cargando datos..." />
```

### Variables CSS del Proyecto

```css
/* Usar SIEMPRE las variables CSS definidas en global.css */

/* Colores principales */
var(--color-primary)           /* Accent principal: #5ad0d2 */
var(--color-primary-hover)     /* Hover: #1e88e5 / #8be8ea (dark) */
var(--color-success)           /* Verde éxito: #4caf50 */
var(--color-error)             /* Rojo error: #ff3333 / #ff6b6b (dark) */

/* Textos */
var(--color-text-main)         /* Texto principal */
var(--color-text-secondary)    /* Texto secundario */

/* Fondos */
var(--color-panel)             /* Panel con transparencia */
var(--color-panel-solid)       /* Panel sólido */
var(--color-shadow)            /* Sombras */

/* Gradientes de fondo */
var(--color-bg-gradient-start)
var(--color-bg-gradient-end)
```

### Responsive Design

```jsx
// Usar media queries en CSS
@media (max-width: 768px) {
  .mi-componente {
    flex-direction: column;
  }
}

// O breakpoints de MUI
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const MiComponente = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box flexDirection={isMobile ? 'column' : 'row'}>
      {/* ... */}
    </Box>
  );
};
```

---

## 🔄 Estado y Context API (Implementación Real)

### Contexts Disponibles

#### AuthContext - Autenticación con Session Timeout

```jsx
// src/context/AuthContext.jsx
// Constantes de configuración
const SESSION_TIMEOUT_MINUTES = 30;  // Logout por inactividad
const SESSION_WARNING_MINUTES = 5;   // Advertencia antes del logout

export const AuthProvider = ({ children }) => {
  // Estado principal
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    secureStorage.reloadFromStorage();
    return secureStorage.getAccessToken();
  });
  const [user, setUser] = useState(() => authService.getUser());
  const [roles, setRoles] = useState(() => user?.roles || []);
  const [userRole, setUserRoleState] = useState(() => user?.role || null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Hook de timeout integrado
  const { resetTimer } = useSessionTimeout({
    timeoutMinutes: SESSION_TIMEOUT_MINUTES,
    warningMinutes: SESSION_WARNING_MINUTES,
    onTimeout: handleSessionTimeout,
    onWarning: handleSessionWarning,
    enabled: !!token
  });

  // Extender sesión (cuando usuario confirma advertencia)
  const extendSession = useCallback(() => {
    setShowTimeoutWarning(false);
    resetTimer();
    secureLogger.debug('Sesión extendida por actividad del usuario');
  }, [resetTimer]);

  // Logout centralizado
  const performLogout = useCallback(async (reason = 'manual') => {
    await authService.logout();
    secureStorage.clearTokens();
    setToken(null);
    setUser(null);
    setRoles([]);
    setUserRoleState(null);
    
    if (reason === 'timeout' && navigateRef.current) {
      navigateRef.current('/login', { 
        state: { message: 'Tu sesión ha expirado por inactividad.' }
      });
    }
  }, []);

  // Valor del context
  return (
    <AuthContext.Provider value={{
      token,
      user,
      roles,
      userRole,
      isAuthenticated: !!token && !!user,
      loading,
      login,            // Función de login
      logout: performLogout,
      showTimeoutWarning,
      extendSession,
      dismissTimeoutWarning,
      setNavigate       // Para configurar navegación desde App.jsx
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Uso en componentes:
const { 
  token,
  user,
  roles,
  userRole,
  isAuthenticated,
  loading,
  login,
  logout,
  showTimeoutWarning,
  extendSession,
  dismissTimeoutWarning
} = useContext(AuthContext);
```

#### ThemeContext - Tema Claro/Oscuro

```jsx
// src/context/ThemeContext.jsx
import { useContext } from 'react';
import { ThemeContext } from '../context/themeContextDef';

const MiComponente = () => {
  const { 
    isDark,      // Boolean - true si está en modo oscuro
    toggleTheme  // Función para cambiar tema
  } = useContext(ThemeContext);
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
    </button>
  );
};
```

#### AlertasContext - Sistema de Alertas (con Polling)

```jsx
// src/context/AlertasContext.jsx
// Hace polling periódico para obtener alertas actualizadas

const MiComponente = () => {
  const { 
    alertas,           // Lista de alertas activas
    alertasCriticas,   // Solo alertas con nivel='critico'
    refreshAlertas,    // Forzar recarga de alertas
    loading
  } = useContext(AlertasContext);
  
  // Las alertas se actualizan automáticamente cada X segundos
};
```

### Reglas de Estado

```jsx
// ✅ CORRECTO - Estado local para UI simple
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ nombre: '', email: '' });

// ✅ CORRECTO - Context para estado global compartido
const { user, logout } = useContext(AuthContext);

// ❌ INCORRECTO - No duplicar estado del context
const [localUser, setLocalUser] = useState(user); // NO

// ❌ INCORRECTO - No guardar tokens en estado local
const [token, setToken] = useState(localStorage.getItem('token')); // NO
// Usar secureStorage en su lugar
```

---

## 📡 Servicios y API (Patrones Actuales)

### apiClient - Configuración Central

```javascript
// src/services/apiClient.js
// Axios instance con interceptores para:
// - Agregar Authorization header automáticamente desde secureStorage
// - Refresh de tokens en 401
// - Logout automático si refresh falla
// - Skip redirect para polling silencioso (X-Skip-Auth-Redirect)

import apiClient from './apiClient';

// Uso en servicios
const response = await apiClient.get('/endpoint');
const response = await apiClient.post('/endpoint', data);

// Para polling silencioso (no redirigir en 401):
const response = await apiClient.get('/endpoint', {
  headers: { 'X-Skip-Auth-Redirect': true }
});
```

### Configuración de Endpoints

```javascript
// src/config/api.js
import api from '../config/api';

// Usar endpoints centralizados
api.endpoints.auth.login        // "/auth/login"
api.endpoints.usuarios.detail(id)  // `/usuarios/${id}`
api.endpoints.analisis.history  // "/analisis/history"

// Incluye helper de baseURL para multiplatforma
```

### Patrón de Servicio (Implementación Real)

```javascript
// src/services/nuevoService.js
import apiClient from "./apiClient";
import api from '../config/api';
import secureLogger from '../utils/secureLogger';
import { sanitizeText } from '../utils/sanitize';

const nuevoService = {
  /**
   * Obtener items del usuario
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Object>} Respuesta con datos
   */
  async getItems(limit = 10) {
    try {
      const response = await apiClient.get('/nuevo/items', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      secureLogger.error('Error obteniendo items');
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener items'
      );
    }
  },

  /**
   * Crear nuevo item
   * @param {Object} data - Datos del item
   * @returns {Promise<Object>}
   */
  async createItem(data) {
    try {
      // Sanitizar inputs de texto
      const sanitizedData = {
        ...data,
        nombre: sanitizeText(data.nombre),
        descripcion: sanitizeText(data.descripcion)
      };
      
      const response = await apiClient.post('/nuevo/items', sanitizedData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Error al crear item');
      }
      
      secureLogger.info('Item creado exitosamente');
      return response.data;
    } catch (error) {
      secureLogger.warn('Error creando item');
      throw new Error(error.response?.data?.error || error.message);
    }
  }
};

export default nuevoService;
```

### Manejo de Errores en Componentes

```jsx
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

const cargarDatos = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await miService.getData();
    
    if (response?.success) {
      setData(response.data);
    } else {
      setError(response?.message || 'Error desconocido');
    }
  } catch (err) {
    // El servicio ya logueó el error
    setError(err.message || 'Error al cargar datos');
  } finally {
    setLoading(false);
  }
};

// En el render
{error && <div className="activity-error">{error}</div>}
```

---

## 🔒 Seguridad Frontend (Obligatorio)

### ⚠️ DATOS SENSIBLES - NO Loguear

| Tipo de Dato | Tratamiento |
|--------------|-------------|
| Tokens JWT | NUNCA loguear, usar secureStorage |
| Contraseñas | NUNCA loguear ni almacenar |
| Datos de audio | No loguear contenido |
| Métricas emocionales | Loguear solo categorías, no valores |
| Emails | Enmascarar en logs |

### secureStorage - Almacenamiento Seguro de Tokens (Implementación Real)

```javascript
// src/utils/secureStorage.js
/**
 * SecureStorage - Almacena tokens con soporte dual:
 * 
 * Modos:
 * - Persistente (recordarme=true): Usa localStorage, persiste al cerrar navegador
 * - Sesión (recordarme=false): Usa sessionStorage, se borra al cerrar navegador
 */

// Estado privado en closure
let _accessToken = null;
let _refreshToken = null;
let _tokenExpiry = null;
let _isPersistent = false;

const KEYS = {
  ACCESS: 'sv_access',
  REFRESH: 'sv_refresh',
  EXPIRY: 'sv_expiry',
  PERSISTENT: 'sv_persist'
};

// ✅ Guardar con persistencia opcional (para "Recuérdame")
secureStorage.setAccessToken(token, expiresIn, persistent);
// persistent=true → localStorage (sobrevive al cerrar browser)
// persistent=false → sessionStorage (se borra al cerrar browser)

// ✅ Obtener token (verifica expiración automáticamente)
const token = secureStorage.getAccessToken();
// Retorna null si el token ha expirado

// ✅ Verificar modo persistente
secureStorage.isPersistentMode(); // true/false

// ✅ Recargar desde storage (al montar AuthProvider)
secureStorage.reloadFromStorage();

// ✅ Limpiar ambos storages (logout completo)
secureStorage.clearTokens();
// Limpia tanto localStorage como sessionStorage

// ✅ Suscribirse a cambios (para sincronizar AuthContext)
const unsubscribe = secureStorage.subscribe((newToken) => {
  setToken(newToken);
});

// Flujo de "Recuérdame" en login:
const handleLogin = async (credentials, rememberMe) => {
  const response = await authService.login(credentials);
  secureStorage.setAccessToken(
    response.token, 
    response.expires_in,
    rememberMe  // <-- Determina localStorage vs sessionStorage
  );
};
```

### secureLogger - Logging Seguro (Implementación Real)

```javascript
// src/utils/secureLogger.js
// Sanitiza datos sensibles automáticamente

import secureLogger from '../utils/secureLogger';

// ✅ CORRECTO - Usar secureLogger
secureLogger.info('Usuario autenticado');
secureLogger.warn('Intento fallido de login');
secureLogger.error('Error en operación', error);
secureLogger.debug('Datos de depuración', { id: 123 });

// El logger automáticamente:
// - Oculta tokens JWT y "Bearer ..."
// - Enmascara emails (us***le.com)
// - Oculta contraseñas
// - En producción, oculta stack traces

// ❌ PROHIBIDO - console.log con datos sensibles
console.log('Token:', token);  // NUNCA
console.log('Password:', password);  // NUNCA
console.log('Emociones:', emotionData);  // NUNCA
```

### sanitize.js - Prevención de XSS (Implementación Real)

```javascript
// src/utils/sanitize.js
import DOMPurify from 'dompurify';

// Funciones disponibles:
export const escapeHtml = (str) => { ... };       // Escapa &<>"'/`=
export const sanitizeHtml = (dirty, options) => { ... }; // DOMPurify
export const sanitizeText = (str) => { ... };     // Remueve TODO el HTML
export const sanitizeUrl = (url) => { ... };      // Solo http/https/mailto
export const sanitizeObject = (obj) => { ... };   // Recursivo

// Configuración por defecto de DOMPurify:
const defaultOptions = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'span'],
  ALLOWED_ATTR: ['class', 'style'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
};

// Validación de URLs:
const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
// Solo permite: http:, https:, mailto:, tel:

// ✅ Uso en servicios
const nombreSeguro = sanitizeText(inputNombre);
const { sanitized, valid } = sanitizeEmail(inputEmail);

// ✅ Sanitizar respuestas de API completas
const safeData = sanitizeObject(apiResponse, {
  htmlFields: ['descripcion'],  // Campos que pueden tener HTML seguro
  urlFields: ['foto_perfil', 'avatar', 'url']  // Campos que son URLs
});
```

### apiClient.js - Interceptores de Seguridad (Implementación Real)

```javascript
// src/services/apiClient.js
import axios from "axios";
import secureStorage from '../utils/secureStorage';
import secureLogger from '../utils/secureLogger';

const apiClient = axios.create({
  baseURL: API_BASE_URL,  // De config/api.js o VITE_API_URL
  withCredentials: false,
  timeout: 30000,
});

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use((config) => {
  // Agregar token automáticamente
  const token = secureStorage.getAccessToken() || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Content-Type automático (excepto FormData)
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  // Header de seguridad
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  
  return config;
});

// RESPONSE INTERCEPTOR - Manejo de 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      // Opción de skip (para polling silencioso)
      if (error.config?.headers?.['X-Skip-Auth-Redirect']) {
        return Promise.reject(error);
      }
      
      // Intentar refresh token
      const refreshToken = secureStorage.getRefreshToken();
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: { 'Authorization': `Bearer ${refreshToken}` }
          });
          
          if (response.data.token) {
            secureStorage.setAccessToken(response.data.token);
            error.config.headers.Authorization = `Bearer ${response.data.token}`;
            return apiClient(error.config);
          }
        } catch (refreshError) {
          secureLogger.warn('Token refresh failed');
        }
      }
      
      // Limpiar y redirigir a login
      secureStorage.clearTokens();
      window.setTimeout(() => { window.location.href = '/login'; }, 150);
    }
    
    return Promise.reject(error);
  }
);
```

### ProtectedRoute - Rutas Protegidas

```jsx
// src/utils/ProtectedRoute.jsx
import ProtectedRoute from '../utils/ProtectedRoute';

// En App.jsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute requiredRole="usuario">
      <LayoutUsuario>
        <Dashboard />
      </LayoutUsuario>
    </ProtectedRoute>
  } 
/>

<Route 
  path="/admin/*" 
  element={
    <ProtectedRoute requiredRole="admin">
      <LayoutAdmin>
        <AdminPanel />
      </LayoutAdmin>
    </ProtectedRoute>
  } 
/>
```

### Rate Limiting en Cliente

```jsx
// src/hooks/useRateLimiter.js
import useRateLimiter from '../hooks/useRateLimiter';

const LoginForm = () => {
  const { 
    checkLimit, 
    isLocked, 
    remaining, 
    lockoutEnd,
    reset 
  } = useRateLimiter({
    maxAttempts: 5,      // Máximo 5 intentos
    windowMs: 60000,     // En 1 minuto
    lockoutMs: 300000,   // Bloqueo por 5 minutos
    storageKey: 'login_attempts'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { allowed, remaining, retryAfter } = checkLimit();
    
    if (!allowed) {
      setError(`Demasiados intentos. Espera ${Math.ceil(retryAfter / 1000)}s`);
      return;
    }
    
    // Proceder con login...
  };
  
  // ...
};
```

### Session Timeout

```jsx
// src/hooks/useSessionTimeout.js
// Ya integrado en AuthContext, pero disponible para uso independiente

import useSessionTimeout from '../hooks/useSessionTimeout';

useSessionTimeout({
  timeoutMinutes: 30,      // Logout después de 30 min inactivo
  warningMinutes: 5,       // Advertencia 5 min antes
  onTimeout: () => {
    // Limpiar y redirigir
    navigate('/login');
  },
  onWarning: (minutesLeft) => {
    // Mostrar modal de advertencia
    setShowWarning(true);
  },
  enabled: isAuthenticated
});
```

---

## 🛤 Routing y Navegación

### Estructura de Rutas (App.jsx)

```jsx
// Rutas públicas
/                    // Landing
/login               // Login
/register            // Registro
/forgot-password     // Recuperar contraseña
/sobre-nosotros      // Información
/contacto            // Formulario de contacto

// Rutas de usuario (requieren auth)
/dashboard           // Panel principal
/perfil              // Ver perfil
/actualizar-perfil   // Editar perfil
/analizar-voz        // Grabación de audio
/historial           // Historial de análisis
/analisis/:id        // Detalle de análisis
/recomendaciones     // Recomendaciones IA
/juegos              // Juegos terapéuticos
/juego/:id           // Juego específico
/grupos              // Grupos del usuario
/notificaciones      // Centro de notificaciones

// Rutas de admin (requieren rol admin)
/admin/dashboard     // Dashboard admin
/admin/usuarios      // Gestión de usuarios
/admin/alertas       // Gestión de alertas
/admin/reportes      // Reportes generales
/admin/grupos        // Gestión de grupos
```

### Navegación Programática

```jsx
import { useNavigate, useLocation } from 'react-router-dom';

const MiComponente = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navegar a ruta
  navigate('/dashboard');
  
  // Navegar con state
  navigate('/analisis/123', { 
    state: { fromDashboard: true } 
  });
  
  // Reemplazar historial (no permite volver)
  navigate('/login', { replace: true });
  
  // Volver atrás
  navigate(-1);
  
  // Obtener state de navegación
  const { state } = location;
};
```

### Protección de Rutas por Rol

```jsx
// En App.jsx
import ProtectedRoute from './utils/ProtectedRoute';

// Ruta solo para usuarios
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute requiredRole="usuario">
      <LayoutUsuario>
        <Dashboard />
      </LayoutUsuario>
    </ProtectedRoute>
  } 
/>

// Ruta solo para admins
<Route 
  path="/admin/*" 
  element={
    <ProtectedRoute requiredRole="admin">
      <LayoutAdmin>
        <Outlet />
      </LayoutAdmin>
    </ProtectedRoute>
  }
>
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="usuarios" element={<AdminUsuarios />} />
</Route>
```

---

## 🎮 Juegos Terapéuticos (Componentes)

### 5 Juegos Disponibles

```
components/Juegos/
├── JuegoRespiracion.jsx   # Respiración guiada con animaciones
├── JuegoMemoria.jsx       # Memoria con tarjetas
├── JuegoMandala.jsx       # Colorear mandalas SVG
├── JuegoPuzzle.jsx        # Puzzle numérico deslizante
└── JuegoMindfulness.jsx   # Actividades de mindfulness guiadas
```

### JuegoRespiracion - Patrón de Estado por Fases

```jsx
// components/Juegos/JuegoRespiracion.jsx
// Máquina de estados para el flujo de respiración

const PHASES = ['preparacion', 'inhalar', 'mantener', 'exhalar', 'completado'];
const TOTAL_CYCLES = 5;

const JuegoRespiracion = () => {
  const [phase, setPhase] = useState('preparacion');
  const [cycle, setCycle] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  // Transición automática entre fases con timers
  useEffect(() => {
    if (phase === 'preparacion') {
      // Timer para iniciar
    } else if (phase === 'inhalar') {
      // 4 segundos → 'mantener'
    } else if (phase === 'mantener') {
      // 7 segundos → 'exhalar'
    } else if (phase === 'exhalar') {
      // 8 segundos → siguiente ciclo o 'completado'
    }
  }, [phase, cycle]);
  
  // Animaciones con CSS variables
  return (
    <div style={{ '--phase-duration': '4s' }}>
      {/* Círculo animado que crece/decrece */}
    </div>
  );
};
```

### useJuegos - Hook para Datos de Juegos

```jsx
// hooks/useJuegos.js
import { useState, useEffect } from 'react';
import { juegosAPI } from '../services/apiClient';
import juegosService from '../services/juegosService';

const useJuegos = () => {
  const [juegos, setJuegos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJuegos = async () => {
      try {
        const data = await juegosAPI.listar();  // o juegosService.getAll()
        setJuegos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJuegos();
  }, []);

  // También: obtenerRecomendados() basado en emociones del usuario
  const obtenerRecomendados = async (emociones) => {
    const recomendados = await juegosService.getRecomendados(emociones);
    return recomendados;
  };

  return { juegos, loading, error, obtenerRecomendados };
};
```

### Patrón de Componente de Juego

```jsx
// Estructura estándar para nuevos juegos
const NuevoJuego = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState('idle');  // idle | playing | completed
  const [score, setScore] = useState(0);
  
  // Guardar resultado al completar
  const handleComplete = async () => {
    setGameState('completed');
    // Guardar sesión de juego en backend
    await juegosService.guardarSesion({
      id_juego: JUEGO_ID,
      duracion: totalTime,
      puntaje: score,
      completado: true
    });
    onComplete?.({ score, duration: totalTime });
  };
  
  return (
    <div className="juego-container">
      {gameState === 'idle' && <InstruccionesJuego />}
      {gameState === 'playing' && <JuegoActivo />}
      {gameState === 'completed' && <ResultadoJuego score={score} />}
    </div>
  );
};
```

---

## 🪝 Hooks Personalizados (Implementación Real)

### useApi - Llamadas API Genéricas

```jsx
import { useApi } from '../hooks/useApi';
import analisisService from '../services/analisisService';

const MiComponente = () => {
  const { 
    data,      // Datos de respuesta
    loading,   // Boolean de carga
    error,     // Error si ocurre
    execute,   // Función para ejecutar
    reset      // Limpiar estado
  } = useApi(analisisService.getHistory);

  useEffect(() => {
    execute(10); // Ejecutar con parámetros
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{JSON.stringify(data)}</div>;
};
```

### useAuth - Autenticación

```jsx
import { useAuth } from '../hooks/useAuth';

const MiComponente = () => {
  const { 
    user,
    token,
    isAuthenticated,
    login,
    logout
  } = useAuth();
  
  // ...
};
```

### useSessionTimeout - Timeout de Inactividad (Implementación Real)

```jsx
// hooks/useSessionTimeout.js
// Integrado en AuthContext - genera warning a los 25min, logout a los 30min

const useSessionTimeout = ({
  timeoutMinutes = 30,      // Tiempo total antes de logout
  warningMinutes = 5,       // Minutos antes para mostrar warning
  onTimeout,                // Callback cuando expira
  onWarning,                // Callback para mostrar advertencia
  enabled = true            // Solo activo si hay sesión
}) => {
  // Resetea timer en cada interacción del usuario
  // (mousemove, keypress, click, scroll, touch)
  
  return { resetTimer };  // Para extender manualmente
};

// Uso (ya integrado en AuthContext):
const { resetTimer } = useSessionTimeout({
  timeoutMinutes: 30,
  warningMinutes: 5,
  onTimeout: () => logout('timeout'),
  onWarning: (minutesLeft) => setShowWarning(true),
  enabled: !!token
});
```

### useRateLimiter - Rate Limiting en Cliente

```jsx
// hooks/useRateLimiter.js
const { 
  checkLimit,    // Verificar si puede intentar
  isLocked,      // Boolean de bloqueo activo
  remaining,     // Intentos restantes
  lockoutEnd,    // Timestamp de fin de bloqueo
  reset          // Resetear contador
} = useRateLimiter({
  maxAttempts: 5,      // Máximo 5 intentos
  windowMs: 60000,     // En 1 minuto
  lockoutMs: 300000,   // Bloqueo por 5 minutos
  storageKey: 'login_attempts'
});

// Uso en login:
const handleSubmit = async () => {
  const { allowed, retryAfter } = checkLimit();
  if (!allowed) {
    setError(`Demasiados intentos. Espera ${Math.ceil(retryAfter / 1000)}s`);
    return;
  }
  // Proceder con login...
};
```

### Crear Nuevo Hook

```jsx
// src/hooks/useNuevoHook.js
import { useState, useCallback, useEffect } from 'react';
import secureLogger from '../utils/secureLogger';

/**
 * Hook para [descripción]
 * 
 * @param {Object} options - Opciones de configuración
 * @param {number} options.param1 - Descripción del parámetro
 * @returns {Object} Estado y funciones del hook
 */
const useNuevoHook = ({ param1 = 10 } = {}) => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const action = useCallback(async (input) => {
    try {
      setLoading(true);
      setError(null);
      // Lógica del hook
      const result = await someOperation(input);
      setState(result);
      return result;
    } catch (err) {
      secureLogger.error('Error en useNuevoHook:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setState(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    state,
    loading,
    error,
    action,
    reset
  };
};

export default useNuevoHook;
```

---

## 🎨 Estilos y Theming

### Sistema de Temas

```javascript
// src/utils/theme.js
import theme from '../utils/theme';

// Inicializar tema (en main.jsx)
theme.initTheme();

// Obtener tema actual
const currentTheme = theme.getTheme(); // 'light' | 'dark'

// Cambiar tema
theme.setTheme('dark');

// Toggle tema
theme.toggleTheme();
```

### Clases CSS para Tema

```css
/* Estilos para modo claro (por defecto) */
.mi-componente {
  background: var(--color-panel);
  color: var(--color-text-main);
}

/* Estilos para modo oscuro */
.dark-mode .mi-componente {
  /* Las variables CSS ya cambian automáticamente */
  /* Solo agregar si necesitas override específico */
}
```

### Estructura de Archivos CSS

```
src/styles/
├── StylesAdmin/
│   ├── AdminDashboard.css
│   └── AdminUsuarios.css
├── StylesUsuarios/
│   ├── Dashboard.css
│   └── SidebarUsuario.css
├── Notificaciones.css
└── ConfiguracionNotificaciones.css

/* Importar en el componente correspondiente */
import "../styles/StylesUsuarios/Dashboard.css";
```

### Patrón de Estilos

```css
/* [Componente].css */

/* Contenedor principal */
.mi-componente {
  background: var(--color-panel);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px var(--color-shadow);
}

/* Elementos internos con BEM-like */
.mi-componente__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.mi-componente__title {
  color: var(--color-text-main);
  font-size: 1.2rem;
  font-weight: 600;
}

.mi-componente__content {
  color: var(--color-text-secondary);
}

/* Estados */
.mi-componente--loading {
  opacity: 0.6;
  pointer-events: none;
}

.mi-componente--error {
  border: 2px solid var(--color-error);
}

/* Responsive */
@media (max-width: 768px) {
  .mi-componente {
    padding: 1rem;
  }
  
  .mi-componente__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

---

## 🧪 Testing

### Estructura de Tests

```
proyectofinal-frontend/
├── src/
│   ├── __tests__/           # Unit tests
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── ...
├── e2e/                     # Tests E2E (Cypress/Playwright)
│   ├── login.spec.js
│   └── dashboard.spec.js
└── ...
```

### Test de Componente

```jsx
// src/__tests__/components/PageCard.test.jsx
import { render, screen } from '@testing-library/react';
import PageCard from '../../components/Shared/PageCard';

describe('PageCard', () => {
  it('renderiza children correctamente', () => {
    render(
      <PageCard>
        <h1>Test Title</h1>
      </PageCard>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('aplica clase de tamaño correcto', () => {
    const { container } = render(
      <PageCard size="xl">Content</PageCard>
    );
    
    expect(container.firstChild).toHaveClass('card-xl');
  });
});
```

### Test de Hook

```jsx
// src/__tests__/hooks/useApi.test.js
import { renderHook, act } from '@testing-library/react';
import { useApi } from '../../hooks/useApi';

describe('useApi', () => {
  it('maneja loading state correctamente', async () => {
    const mockApi = jest.fn().mockResolvedValue({ data: 'test' });
    
    const { result } = renderHook(() => useApi(mockApi));
    
    expect(result.current.loading).toBe(false);
    
    await act(async () => {
      await result.current.execute();
    });
    
    expect(result.current.data).toEqual({ data: 'test' });
    expect(result.current.loading).toBe(false);
  });
});
```

### Test de Servicio

```jsx
// src/__tests__/services/authService.test.js
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';

jest.mock('../../services/apiClient');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('guarda token en secureStorage después de login exitoso', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          token: 'test-token',
          user: { id: 1, nombre: 'Test' }
        }
      });
      
      const result = await authService.login('test@test.com', 'password');
      
      expect(result.token).toBe('test-token');
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ correo: 'test@test.com' })
      );
    });
  });
});
```

### Cobertura Mínima

```bash
# Ejecutar tests con cobertura
npm test -- --coverage

# Cobertura mínima requerida: 60%
# Áreas críticas (80%+): authService, secureStorage, sanitize
```

---

## ♿ Accesibilidad (a11y)

### Reglas Obligatorias

```jsx
// ✅ CORRECTO - Labels en formularios
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-error" />
{error && <span id="email-error" role="alert">{error}</span>}

// ✅ CORRECTO - Botones con texto descriptivo
<button aria-label="Cerrar modal">
  <CloseIcon />
</button>

// ✅ CORRECTO - Imágenes con alt
<img src={avatar} alt={`Avatar de ${nombre}`} />

// ✅ CORRECTO - Roles ARIA donde corresponde
<div role="alert" aria-live="polite">
  {mensajeError}
</div>

// ✅ CORRECTO - Focus management
const modalRef = useRef(null);
useEffect(() => {
  if (isOpen) {
    modalRef.current?.focus();
  }
}, [isOpen]);

// ❌ INCORRECTO
<div onClick={handleClick}>Click me</div>  // No es focusable
<img src={logo} />  // Sin alt
<input placeholder="Email" />  // Sin label
```

### Navegación por Teclado

```jsx
// Asegurar que elementos interactivos son focusables
<button onClick={handleClick}>Acción</button>

// Para elementos custom, usar tabIndex
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom Button
</div>
```

---

## ⚡ Performance

### Lazy Loading de Rutas

```jsx
// En App.jsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Pages/PaginasUsuarios/Dashboard'));
const AdminPanel = lazy(() => import('./Pages/PaginasAdministradores/AdminPanel'));

<Suspense fallback={<Spinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/admin/*" element={<AdminPanel />} />
  </Routes>
</Suspense>
```

### Memoización

```jsx
import { useMemo, useCallback, memo } from 'react';

// Memoizar cálculos costosos
const dataProcesada = useMemo(() => {
  return procesarDatos(rawData);
}, [rawData]);

// Memoizar callbacks
const handleClick = useCallback(() => {
  // ...
}, [dependencia]);

// Memoizar componentes
const MiComponente = memo(({ data }) => {
  return <div>{data}</div>;
});
```

### Evitar Re-renders Innecesarios

```jsx
// ✅ CORRECTO - Extraer componentes estables
const Header = memo(() => (
  <header>
    <h1>Título</h1>
  </header>
));

// ✅ CORRECTO - Usar keys estables
{items.map(item => (
  <Item key={item.id} data={item} />
))}

// ❌ INCORRECTO - Keys con índice en listas dinámicas
{items.map((item, index) => (
  <Item key={index} data={item} />  // NO para listas que cambian
))}

// ❌ INCORRECTO - Crear objetos/funciones en render
<Component style={{ margin: 10 }} />  // Nuevo objeto cada render
<Component onClick={() => doSomething()} />  // Nueva función cada render
```

---

## 🔄 CI/CD y Calidad

### Checks Obligatorios (Pre-Merge)

```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI

on:
  push:
    branches: [main, develop]
    paths: ['proyectofinal-frontend/**']
  pull_request:
    branches: [main, develop]
    paths: ['proyectofinal-frontend/**']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: proyectofinal-frontend/package-lock.json
      
      - name: Install dependencies
        run: npm ci
        working-directory: proyectofinal-frontend
      
      - name: Lint
        run: npm run lint
        working-directory: proyectofinal-frontend
      
      - name: Build
        run: npm run build
        working-directory: proyectofinal-frontend
      
      - name: Test
        run: npm test -- --coverage --watchAll=false
        working-directory: proyectofinal-frontend

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=high
        working-directory: proyectofinal-frontend
```

### Scripts de NPM

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 🚫 Reglas Estrictas

### ❌ PROHIBIDO (NO HACER)

1. **Seguridad**
   - NUNCA loguear tokens, contraseñas o datos sensibles
   - NUNCA almacenar tokens en localStorage para producción
   - NUNCA usar `dangerouslySetInnerHTML` sin sanitizar
   - NUNCA desactivar rate limiting
   - NUNCA exponer API keys en código cliente

2. **Estructura**
   - NO renombrar carpetas existentes (`components/`, `Pages/`, `services/`)
   - NO cambiar patrones de arquitectura sin aprobación
   - NO crear nuevos contexts sin justificación

3. **Estado**
   - NO duplicar estado que viene de contexts
   - NO usar `useState` para datos que deberían estar en context
   - NO mutar estado directamente

4. **API**
   - NO crear nuevos axios instances (usar apiClient)
   - NO hardcodear URLs de API
   - NO ignorar errores de API

### ✅ SIEMPRE HACER

1. **Antes de crear código nuevo**
   - Verificar si ya existe funcionalidad similar
   - Seguir patrones existentes en el directorio
   - Usar componentes compartidos (PageCard, Spinner, etc.)

2. **Para datos de usuario**
   - Sanitizar inputs con utils/sanitize
   - Usar secureLogger en lugar de console.log
   - Validar antes de enviar a API

3. **Para componentes nuevos**
   - Agregar PropTypes o TypeScript types
   - Documentar con JSDoc
   - Incluir manejo de loading y error states

4. **Para rutas protegidas**
   - Usar ProtectedRoute con requiredRole
   - Verificar autenticación en componentes sensibles
   - Redirigir a login si no hay sesión

---

## ✅ Checklist para Nuevas Contribuciones

```markdown
### Pre-Código
- [ ] Leí las instrucciones del proyecto
- [ ] Verifiqué que no existe funcionalidad similar
- [ ] El archivo va en la carpeta correcta según estructura

### Código
- [ ] Sigo la estructura de componentes establecida
- [ ] Imports ordenados (React > Third-party > Local > Styles)
- [ ] PropTypes definidos para todos los props
- [ ] JSDoc en componentes y funciones principales
- [ ] Uso variables CSS (var(--color-*))
- [ ] Loading y error states implementados

### Seguridad
- [ ] Inputs sanitizados con utils/sanitize
- [ ] Sin console.log de datos sensibles (usar secureLogger)
- [ ] Tokens manejados con secureStorage
- [ ] Sin dangerouslySetInnerHTML sin sanitizar
- [ ] Rutas protegidas con ProtectedRoute si requieren auth

### UX/Accesibilidad
- [ ] Labels en todos los inputs de formularios
- [ ] Alt text en imágenes
- [ ] Elementos interactivos son focusables
- [ ] Responsive design verificado
- [ ] Estados de carga claros para el usuario

### Testing
- [ ] Tests unitarios para componentes nuevos
- [ ] Tests para hooks personalizados
- [ ] Cobertura >= 60%

### CI/CD
- [ ] Linting pasa (npm run lint)
- [ ] Build exitoso (npm run build)
- [ ] Tests pasan (npm test)
```

---

## 📚 Referencias

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Material UI Documentation](https://mui.com/)
- [React Router v7](https://reactrouter.com/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

---

*Esta documentación es la fuente autoritativa para contribuciones al frontend de SerenVoice. Cualquier desviación requiere aprobación explícita del equipo.*
