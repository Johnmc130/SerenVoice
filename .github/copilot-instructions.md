# SerenVoice - AI Agent Instructions

> Voice emotion analysis platform with AI-powered mental health insights  
> **Architecture**: Flask backend + React web + React Native mobile  
> **Version**: 3.0.0 | Updated: January 2026

## Core Architecture

### Monorepo Structure
```
backend/              # Flask 3.1 + MySQL API + Groq AI + scikit-learn ML
proyectofinal-frontend/  # React 19 + Vite 7 + MUI 7 + 5 therapeutic games
proyectofinal-mobile/    # Expo 54 + React Native 0.81 (dual navigation)
.github/instructions/    # Detailed layer-specific rules
```

**Critical**: See layer-specific instructions for comprehensive patterns:
- **Backend**: `.github/instructions/backend.instructions.md` (1500+ lines)
  - DatabaseConnection pool (32 connections)
  - Groq AI integration (Llama 3.1-8b-instant)
  - AudioService with ML emotion detection
  - AlertasService with critical notifications
- **Frontend**: `.github/instructions/frontend.instructions.md` (1900+ lines)
  - secureStorage dual-mode (localStorage/sessionStorage)
  - AuthContext with 30min session timeout
  - apiClient with token refresh interceptors
  - 5 therapeutic games (Respiracion, Memoria, Mandala, Puzzle, Mindfulness)
- **Mobile**: `.github/instructions/mobile.instructions.md` (500+ lines)
  - Dual navigation: Expo Router (new) + React Navigation (legacy)
  - TypeScript hooks in /hooks directory
  - Platform-aware API URL detection

### Service-Oriented Backend Pattern

**Routes → Services → Models** separation is STRICT:

```python
# routes/audio_routes.py - ONLY request/response handling
@jwt_required()
@limiter.limit("10 per minute")
def upload_audio():
    file = request.files.get('audio')
    return AudioService().analyze_audio(file)  # Delegate to service

# services/audio_service.py - Business logic + ML
class AudioService:
    def analyze_audio(self, file):
        features = self.feature_extractor.extract(audio_data)
        emotion = self.model.predict(features)  # Gradient Boosting
        Audio.create(user_id, file_path)  # Call model

# models/audio.py - ONLY data access
class Audio:
    @staticmethod
    def create(user_id, file_path):
        result = DatabaseConnection.execute_query(
            "INSERT INTO audios ...", (user_id, file_path), fetch=False
        )
        return result.get('last_id')
```

**Never** bypass this layering (e.g., don't call DB from routes).

### Security-First Data Handling

SerenVoice processes **highly sensitive** voice/emotion data:

**Backend logging** (`utils/security_middleware.py`):
```python
secure_log(level='info', message='Analysis completed', 
           sensitive_data={'user_id': 123})  # Auto-redacts
# NEVER: print(f"Audio features: {features}")  # Raw data exposure
```

**Frontend logging** (`utils/secureLogger.js`):
```javascript
secureLogger.info('Upload started', { duration: 5 });  // Safe
// NEVER: console.log(audioBlob);  // Sensitive data
```

**Authentication flow**:
- JWT stored via `secureStorage` (dual-mode: localStorage for "remember me", sessionStorage otherwise)
- All protected endpoints use `@jwt_required()` decorator
- Rate limiting via `@limiter.limit()` on sensitive endpoints
- Session timeout: 30 minutes inactivity, 5 minute warning
- Google OAuth handled by `auth_routes.py` and `AuthContext.jsx`

## Critical Developer Workflows

### Local Development Setup

**Docker (Recommended)**:
```bash
docker-compose up -d  # Starts MySQL, phpMyAdmin, backend, frontend
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
# phpMyAdmin: http://localhost:8080
```

**Manual**:
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py

# Frontend
cd proyectofinal-frontend
npm install
npm run dev
```

**Environment Variables**: Copy `.env.example` to `.env` and configure:
- `JWT_SECRET_KEY` - **MUST** be set for production (use `secrets.token_hex(32)`)
- `DB_*` - Database credentials
- `GROQ_API_KEY` - For AI recommendations
- `VITE_API_URL` - Frontend backend URL

### Database Migrations

Manual migration system (no ORM auto-migrations):
```bash
# Run migration scripts from repository root
mysql -u admin -p serenvoice < migrations/actividades_grupales_v2.sql
# Or via phpMyAdmin: http://localhost:8080
```

**Schema changes**: Create new `.sql` files in `migrations/`, document in commit message.

### ML Model Management

Emotion detection models located in `backend/models/`:
- `emotion_model.pkl` - Trained Gradient Boosting classifier
- `training_data.json` - Training dataset
- Falls back to heuristic analysis if model missing

**Retraining**:
```bash
cd backend
python train_models.py  # Generates new emotion_model.pkl
```

## Project-Specific Patterns

### Frontend Context Architecture

**Three main contexts** (never directly modify localStorage/sessionStorage):
```jsx
// AuthContext - Authentication state + JWT lifecycle
const { user, login, logout, hasRole } = useAuth();

// ThemeContext - Dark/light mode persistence
const { theme, toggleTheme } = useTheme();

// AlertasContext - Real-time alert polling
const { alertas, marcarLeida } = useAlertas();
```

**Custom hooks** centralize logic:
- `useApi.js` - Generic API call wrapper with error handling
- `useRateLimiter.js` - Client-side rate limiting for forms
- `useSessionTimeout.js` - Auto-logout on inactivity
- `useJuegos.js` - Therapeutic games data and recommendations

### API Response Format (Immutable Contract)

**ALL backend endpoints** return:
```json
{
  "success": true,
  "data": { ... }
}
// OR
{
  "success": false,
  "error": "Error message"
}
```

**Frontend API client** (`config/api.js`):
```javascript
import { API_ENDPOINTS } from './config/api';
const response = await fetch(API_ENDPOINTS.AUDIO.ANALYZE, { ... });
const { success, data, error } = await response.json();
```

**NEVER** change this schema without backward compatibility plan.

### Component Organization

**Pages** (`src/Pages/`): Full-page views with routing
**Components** (`src/components/`): Reusable UI pieces
- `Publico/` - Public-facing (Navbar, Footer)
- `Usuario/` - User-specific (Sidebar)
- `Administrador/` - Admin-only
- `Shared/` - Cross-domain (PageCard)

**Material-UI theming**: Use `sx` prop over `styled()` for one-offs:
```jsx
<Box sx={{ p: 3, bgcolor: 'background.paper' }}>  {/* MUI theme-aware */}
```

### Rate Limiting Strategy

**Backend** (Flask-Limiter):
```python
@limiter.limit("10 per minute")  # Audio analysis (expensive)
@limiter.limit("30 per minute")  # Standard endpoints
```

**Frontend** (useRateLimiter hook):
```javascript
const { canSubmit, recordAttempt } = useRateLimiter(5, 60000);  // 5 attempts/min
if (!canSubmit()) return toast.error('Too many attempts');
```

## Integration Points

### Groq AI (Recommendations)
`backend/services/groq_service.py` - Calls Groq API for personalized recommendations
- Model: `llama-3.1-70b-versatile`
- Requires `GROQ_API_KEY` in `.env`
- Fallback to generic recommendations if API fails

### Google OAuth
- Backend: `routes/auth_routes.py` (`/api/auth/google`)
- Frontend: `@react-oauth/google` in `Login.jsx`
- Requires `VITE_GOOGLE_CLIENT_ID` for frontend
- Creates/links user accounts automatically

### MySQL Database
- Connection pooling via `database/connection.py`
- No ORM - raw SQL with parameterized queries (prevent SQL injection)
- Models use `@staticmethod` for data access methods

## Mobile App Architecture

### Dual Navigation System (Migration in Progress)

The mobile app has **TWO parallel systems**:

```
proyectofinal-mobile/
├── app/                 # 🆕 Expo Router (file-based) - USE FOR NEW CODE
│   ├── (tabs)/          # Tab navigator
│   └── (auth)/          # Auth stack
├── src/                 # 📦 Legacy (React Navigation)
│   ├── navigation/      # RootNavigator, MainNavigator
│   └── screens/         # Legacy screens
├── hooks/               # 🎣 Modern TypeScript hooks (useAuth, useAudio, etc.)
├── components/          # UI components + Games
└── constants/           # ApiClient, ApiEndpoints, env
```

**Navigation rule**:
```typescript
// ✅ Expo Router (new code)
import { useRouter } from 'expo-router';
router.push('/dashboard');

// ⚠️ React Navigation (legacy only)
import { useNavigation } from '@react-navigation/native';
navigation.navigate('Dashboard');
```

### Mobile-Specific Patterns

**Secure Storage** (`src/utils/secureStorage.js`):
```javascript
// Uses expo-secure-store (native) or AsyncStorage (web)
await secureStorage.setAccessToken(token);  // Platform-aware
const token = await secureStorage.getAccessToken();
// NEVER use AsyncStorage directly for tokens in native builds
```

**API URL Detection** (`constants/env.ts`):
```typescript
// Automatic platform detection
// Web: localhost:5000
// Android Emulator: 10.0.2.2:5000 (alias)
// Physical Device: 192.168.x.x:5000 (from .env)
```

**Typed Hooks** (`hooks/useAudio.tsx`):
```typescript
export function useAudio() {
  const analizar = async (uri: string, duration: number, userId: number | null, token: string | null) => {
    // Handles blob:// (web) and file:// (native)
    // Calculates stress/anxiety levels from emotions
  };
  return { loading, resultado, error, analizar, historial };
}
```

### Therapeutic Games

5 games in both TypeScript (`components/Juegos/`) and JavaScript (`src/components/games/`):
- `JuegoRespiracion` - Guided breathing with animations
- `JuegoMemoria` - Memory card matching
- `JuegoMandala` - Creative coloring with SVG
- `JuegoPuzzle` - Sliding number puzzle
- `JuegoMindfulness` - Guided meditation activities

**Animation rule**: Always use `useNativeDriver: true`:
```typescript
Animated.timing(scaleAnim, {
  toValue: 1.8,
  duration: 4000,
  useNativeDriver: true,  // ✅ REQUIRED for performance
}).start();
```

## Testing & Quality

**Backend**:
```bash
cd backend
pytest tests/              # Run all tests
ruff check .               # Linting
black --check .            # Format check
mypy .                     # Type checking (if configured)
```

**Frontend**:
```bash
cd proyectofinal-frontend
npm test                   # Vitest + React Testing Library
npm run lint               # ESLint
npm run build              # Production build check
```

**Minimum coverage**: 60% (enforced in CI/CD)

## Common Gotchas

1. **CORS preflight**: Backend excludes OPTIONS from rate limiting (see `security_middleware.py`)
2. **JWT refresh**: Handled automatically by `secureStorage.js` + backend `/api/auth/refresh`
3. **File uploads**: Max 16MB audio files, validated in `audio_routes.py`
4. **Trailing slashes**: Disabled in `app.py` (`strict_slashes = False`) to prevent 308 redirects
5. **Windows UTF-8**: Backend forces UTF-8 encoding (see `app.py` top-level)
6. **Docker volumes**: Don't override `node_modules` in frontend container (removed from docker-compose.yml)

## Quick Reference Commands

```bash
# Full stack
docker-compose up -d

# Backend only
cd backend && python app.py

# Frontend only  
cd proyectofinal-frontend && npm run dev

# Mobile app
cd proyectofinal-mobile && npx expo start
npx expo start --android   # Android only
npx expo start --ios       # iOS only
npx expo start --web       # Web only

# Run tests
docker-compose exec flask_backend pytest
docker-compose exec react_frontend npm test

# View logs
docker-compose logs -f flask_backend
docker-compose logs -f react_frontend

# Database backup
docker-compose exec mysql_estudiantes mysqldump -u admin -p serenvoice > backup.sql

# Retrain ML model
docker-compose exec flask_backend python train_models.py
```

---

**For comprehensive details**, always check:
- **Backend**: `.github/instructions/backend.instructions.md` (1100+ lines)
- **Frontend**: `.github/instructions/frontend.instructions.md` (1600+ lines)
- **Mobile**: `.github/instructions/mobile.instructions.md` (500+ lines)
- **General**: `.github/instructions/serenvoice.instructions.md`
