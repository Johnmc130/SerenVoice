# SerenVoice Mobile - GitHub Copilot Instructions

> **Versión**: 1.0.0  
> **Última actualización**: Enero 2026  
> **Aplica a**: `**`

---

## 📋 Índice

1. Contexto del Proyecto
2. Arquitectura y Estructura
3. Sistemas de Navegación (Dual)
4. Hooks Personalizados
5. Servicios y API
6. Almacenamiento Seguro
7. Juegos Terapéuticos
8. Configuración de Entorno
9. Convenciones de Código
10. Testing y Calidad
11. Reglas Estrictas
12. Checklist para Nuevas Contribuciones

---

## 🎯 Contexto del Proyecto

**SerenVoice Mobile** es la aplicación móvil nativa del ecosistema SerenVoice. Permite:
- Grabación y análisis de voz para detección de emociones
- Visualización de métricas emocionales (estrés, ansiedad)
- Acceso a juegos terapéuticos interactivos
- Historial de análisis y recomendaciones personalizadas
- Gestión de perfil y notificaciones

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | Expo | 54.0.27 |
| Runtime | React Native | 0.81.5 |
| React | React | 19.1.0 |
| Routing (nuevo) | Expo Router | 6.0.21 |
| Routing (legacy) | React Navigation | 7.x |
| HTTP Client | Axios | 1.13.2 |
| Storage (nativo) | expo-secure-store | - |
| Storage (web) | @react-native-async-storage | 2.2.0 |
| Audio | expo-av | 16.0.8 |
| Animations | react-native-reanimated | 4.1.1 |
| Graphics | react-native-svg, @shopify/react-native-skia | 15.12.1, 2.2.12 |
| Icons | lucide-react-native, @expo/vector-icons | 0.562.0, 15.0.3 |

---

## 🏗 Arquitectura y Estructura

### ⚠️ IMPORTANTE: Estructura Dual (Migración en Progreso)

El proyecto tiene **DOS sistemas paralelos**:

```
proyectofinal-mobile/
├── app/                        # 🆕 Expo Router (file-based routing)
│   ├── _layout.tsx             # Layout raíz
│   ├── index.tsx               # Pantalla inicial
│   ├── (tabs)/                 # Tab navigator
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # Home tab
│   │   └── profile.tsx         # Profile tab
│   └── (auth)/                 # Auth stack
│       ├── _layout.tsx
│       ├── PaginasPublicas/    # Login, Register, etc.
│       └── PaginaUsuario/      # Dashboard, Análisis, etc.
│
├── src/                        # 📦 Sistema Legacy (React Navigation)
│   ├── context/                # AuthContext, ThemeContext
│   ├── navigation/             # RootNavigator, MainNavigator
│   ├── screens/                # Pantallas legacy
│   ├── services/               # API services
│   ├── components/             # Componentes compartidos
│   │   └── games/              # Juegos terapéuticos
│   └── utils/                  # secureStorage, validators
│
├── hooks/                      # 🎣 Hooks modernos (TypeScript)
│   ├── useAuth.tsx             # Autenticación completa
│   ├── useAudio.tsx            # Grabación y análisis
│   ├── useAnalisis.tsx         # Historial de análisis
│   ├── useJuegos.tsx           # Juegos terapéuticos
│   └── ...                     # 15+ hooks especializados
│
├── components/                 # 🧩 Componentes Expo Router
│   ├── ui/                     # Button, Card, Input
│   ├── forms/                  # LoginForm, RegisterForm
│   └── Juegos/                 # Juegos en TypeScript
│
├── constants/                  # ⚙️ Configuración centralizada
│   ├── ApiClient.ts            # Cliente HTTP
│   ├── ApiEndpoints.ts         # Endpoints del backend
│   ├── env.ts                  # Variables de entorno
│   └── theme.ts                # Colores y estilos
│
└── api/                        # 📡 API layer (alternativa)
    ├── auth.js
    ├── audio.js
    └── config.js
```

### Regla de Navegación

```typescript
// ✅ Expo Router (preferido para código nuevo)
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/dashboard');

// ⚠️ React Navigation (legacy - solo para src/)
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation();
navigation.navigate('Dashboard');
```

---

## 🧭 Sistemas de Navegación

### Expo Router (app/)

Layout jerárquico con file-based routing:

```tsx
// app/_layout.tsx - Layout raíz
export default function RootLayout() {
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
```

### React Navigation (src/)

Stack-based navigation tradicional:

```javascript
// src/navigation/RootNavigator.js
const RootNavigator = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};
```

---

## 🎣 Hooks Personalizados

### useAuth (Principal)

```tsx
// hooks/useAuth.tsx
export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cargar sesión desde AsyncStorage al iniciar
  useEffect(() => {
    const initAuth = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        setUser(JSON.parse(userStr));
      }
    };
    initAuth();
  }, []);

  const login = async (correo: string, contrasena: string) => { ... };
  const logout = async () => { ... };
  const register = async (data: RegisterData) => { ... };
  const updateProfile = async (data: UpdateProfileData) => { ... };
  
  return { user, loading, error, login, logout, register, updateProfile };
}
```

### useAudio (Análisis de Voz)

```tsx
// hooks/useAudio.tsx
export function useAudio() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<AudioResult | null>(null);

  // Calcular niveles de estrés/ansiedad desde emociones
  const calcularNiveles = (emotions: EmotionMap) => {
    const nivel_estres = Math.max(
      emotions["estrés"] ?? 0,
      (emotions["enojo"] ?? 0) * 0.6
    );
    return { nivel_estres, nivel_ansiedad };
  };

  const analizar = async (uri: string, duration: number, userId: number | null, token: string | null) => {
    // Soporta blob:// (web) y file:// (native)
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('duration', String(duration));
    // ... enviar a backend
  };

  return { loading, resultado, error, analizar, historial };
}
```

### Otros Hooks

| Hook | Descripción | Archivo |
|------|-------------|---------|
| `useAnalisis` | Historial y detalles de análisis | `hooks/useAnalisis.tsx` |
| `useJuegos` | CRUD de juegos terapéuticos | `hooks/useJuegos.tsx` |
| `useRecomendaciones` | Recomendaciones IA | `hooks/useRecomendaciones.tsx` |
| `useNotificaciones` | Sistema de notificaciones | `hooks/useNotificaciones.tsx` |
| `useGroups` | Gestión de grupos terapéuticos | `hooks/useGroups.tsx` |
| `useReportes` | Generación de reportes | `hooks/useReportes.tsx` |

---

## 📡 Servicios y API

### ApiClient (constants/ApiClient.ts)

```typescript
class ApiClient {
  async request(method: string, endpoint: string, body?: any, auth = false, isForm = false) {
    const headers: any = {};
    
    if (!isForm) headers["Content-Type"] = "application/json";
    
    if (auth) {
      const token = await AsyncStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, { method, headers, body });
    return response.json();
  }

  get(endpoint: string, auth = false) { ... }
  post(endpoint: string, data?: any, auth = false, isForm = false) { ... }
  put(endpoint: string, data?: any, auth = false) { ... }
  delete(endpoint: string, auth = false) { ... }
}
```

### Configuración de URLs (constants/env.ts)

```typescript
// Detección automática de entorno
const getApiUrl = (): string => {
  const isEmulator = Constants.isDevice === false;
  
  // Web: localhost
  if (Platform.OS === 'web') return 'http://localhost:5000';
  
  // Android Emulator: 10.0.2.2 (alias de localhost)
  if (Platform.OS === 'android' && isEmulator) return 'http://10.0.2.2:5000';
  
  // Dispositivo físico: IP de red local
  return 'http://192.168.x.x:5000';  // Configurar en .env
};
```

### Endpoints (constants/ApiEndpoints.ts)

```typescript
const ApiEndpoints = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    VERIFY: "/api/auth/verify",
  },
  AUDIO: {
    ANALYZE: "/api/audio/analyze",
  },
  ANALISIS: {
    HISTORY: "/api/analisis/history",
    DETAIL: "/api/analisis",  // + /:id
  },
  // ...
};
```

---

## 🔐 Almacenamiento Seguro

### secureStorage (src/utils/secureStorage.js)

Usa **expo-secure-store** en nativo y **AsyncStorage** en web:

```javascript
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const secureStorage = {
  async setAccessToken(token) {
    if (isWeb) {
      await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, token);
    } else {
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
    }
  },

  async getAccessToken() {
    if (isWeb) {
      return await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
    } else {
      return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    }
  },

  // clearAll, setUser, getUser, setRefreshToken, getRefreshToken...
};
```

**⚠️ NUNCA usar AsyncStorage directo para tokens en producción nativa.**

---

## 🎮 Juegos Terapéuticos

### Ubicaciones

```
proyectofinal-mobile/
├── components/Juegos/           # TypeScript (Expo Router)
│   ├── JuegoRespiracion.tsx
│   ├── JuegoMemoria.tsx
│   ├── JuegoMandala.tsx
│   ├── JuegoPuzzle.tsx
│   └── JuegoMindfulness.tsx
│
└── src/components/games/        # JavaScript (Legacy)
    ├── BreathingGame.js
    ├── MemoryGame.js
    ├── MandalaGame.js
    ├── PuzzleGame.js
    └── MindfulnessGame.js
```

### Patrón de Juego

```tsx
// components/Juegos/JuegoRespiracion.tsx
import { JuegoProps } from "../../types/juegos.types";

const JuegoRespiracion: React.FC<JuegoProps> = ({ juego, onFinish, onExit }) => {
  const [fase, setFase] = useState<Fase>("preparacion");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación según fase
    Animated.timing(scaleAnim, {
      toValue: fase === "inhalar" ? 1.8 : 1,
      duration: TIEMPO_INHALAR * 1000,
      useNativeDriver: true,  // ✅ SIEMPRE para performance
    }).start();
  }, [fase]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}>
        {/* ... */}
      </Animated.View>
    </View>
  );
};
```

### Tipos de Juegos

```typescript
// types/juegos.types.ts
export interface JuegoProps {
  juego: {
    id_juego: number;
    nombre: string;
    descripcion: string;
    tipo: string;
  };
  onFinish: (resultado: JuegoResultado) => void;
  onExit: () => void;
}
```

---

## ⚙️ Configuración de Entorno

### Variables de Entorno

Crear `.env` en raíz del proyecto:

```env
# API Backend
EXPO_PUBLIC_API_URL=http://localhost:5000,http://192.168.1.100:5000

# Google OAuth (opcional)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
```

### Lectura en app.config.js

```javascript
// app.config.js
export default {
  expo: {
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    },
  },
};
```

### Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start

# Opciones específicas
npx expo start --android    # Solo Android
npx expo start --ios        # Solo iOS
npx expo start --web        # Solo Web

# Builds nativos
npx expo run:android
npx expo run:ios

# Linting
npm run lint
```

---

## 📝 Convenciones de Código

### Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos TypeScript | `PascalCase.tsx` o `camelCase.ts` | `JuegoRespiracion.tsx`, `useAuth.tsx` |
| Archivos JavaScript | `camelCase.js` | `authService.js` |
| Componentes | `PascalCase` | `JuegoRespiracion` |
| Hooks | `use` + `PascalCase` | `useAuth`, `useAudio` |
| Constantes | `UPPER_SNAKE` | `API_URL`, `KEYS` |
| Tipos/Interfaces | `PascalCase` | `UserData`, `JuegoProps` |

### Imports (orden)

```typescript
// 1. React y React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Expo
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// 3. Third-party
import AsyncStorage from '@react-native-async-storage/async-storage';

// 4. Locales - Componentes
import { Button } from '@/components/ui/Button';

// 5. Locales - Hooks/Utils
import { useAuth } from '@/hooks/useAuth';
import { Config } from '@/constants';

// 6. Tipos
import type { UserData } from '@/types';
```

### Estilos

```typescript
// ✅ StyleSheet (preferido)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
});

// ⚠️ Inline styles (solo para valores dinámicos)
<View style={[styles.container, { backgroundColor: isActive ? '#4CAF50' : '#ccc' }]} />
```

---

## 🧪 Testing y Calidad

### Comandos

```bash
# Linting
npm run lint

# Type checking (si está configurado)
npx tsc --noEmit

# Ejecutar en modo desarrollo
npx expo start --clear  # Limpiar cache
```

### Verificaciones Pre-Commit

1. Sin errores de TypeScript
2. Sin warnings de ESLint
3. Importaciones resueltas correctamente
4. Hooks con dependencias correctas

---

## 🚫 Reglas Estrictas

### NO HACER

1. **NO** usar `console.log` con datos sensibles (audio, tokens, emociones)
2. **NO** almacenar tokens en AsyncStorage directamente en código nativo
3. **NO** mezclar navegación de Expo Router con React Navigation en el mismo flujo
4. **NO** usar animaciones sin `useNativeDriver: true`
5. **NO** hacer fetch directo - usar `ApiClient` o `useApi` hook
6. **NO** hardcodear URLs de API - usar `constants/env.ts`

### SÍ HACER

1. **SÍ** usar `secureStorage` para tokens y datos sensibles
2. **SÍ** tipar todos los hooks y componentes en TypeScript
3. **SÍ** manejar estados de loading/error en todos los hooks
4. **SÍ** usar `Animated` API con `useNativeDriver` para animaciones
5. **SÍ** validar inputs antes de enviar al backend
6. **SÍ** limpiar listeners en useEffect cleanup

---

## ✅ Checklist para Nuevas Contribuciones

### Antes de crear código

- [ ] Identificar si usar `app/` (Expo Router) o `src/` (legacy)
- [ ] Verificar si existe hook reutilizable
- [ ] Revisar `constants/ApiEndpoints.ts` para endpoints

### Nuevo Componente

- [ ] TypeScript con tipos definidos
- [ ] Props tipadas con interface
- [ ] Estilos con StyleSheet
- [ ] Manejo de estados loading/error
- [ ] Animaciones con useNativeDriver

### Nuevo Hook

- [ ] Prefijo `use`
- [ ] Estados: loading, error, data
- [ ] Cleanup en useEffect
- [ ] Tipos de retorno explícitos

### Nuevo Juego

- [ ] Implementar `JuegoProps` interface
- [ ] Callbacks `onFinish` y `onExit`
- [ ] Animaciones nativas
- [ ] Estado de progreso/completado

### Pre-Push

- [ ] `npm run lint` sin errores
- [ ] Probado en Android/iOS/Web
- [ ] Sin datos sensibles en logs
- [ ] Imports relativos correctos (`@/` o `../`)

---

## 📚 Referencias

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- Backend: `.github/instructions/backend.instructions.md`
- Frontend Web: `.github/instructions/frontend.instructions.md`
