# SerenVoice Backend - GitHub Copilot Instructions

> **Versión**: 3.0.0  
> **Última actualización**: Enero 2026  
> **Aplica a**: `**`

---

## 📋 Índice

1. Contexto del Proyecto
2. Arquitectura y Estructura (Detallada)
3. Servicios Principales (Implementación Real)
4. Convenciones de Código
5. Seguridad de Software (Obligatorio)
6. Autenticación y Autorización
7. Base de Datos y Modelos
8. Integración con Groq AI
9. API y Contratos
10. Testing
11. CI/CD y Calidad
12. Observabilidad
13. Reglas Estrictas
14. Checklist para Nuevas Contribuciones

---

## 🎯 Contexto del Proyecto

**SerenVoice** es una aplicación de análisis de voz y detección de emociones que procesa datos altamente sensibles:
- Grabaciones de voz de usuarios
- Métricas emocionales (estrés, ansiedad, felicidad, tristeza, etc.)
- Datos de salud mental y bienestar

### Stack Tecnológico Actual

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework Web | Flask | 3.1.2 |
| Base de Datos | MySQL | 8.x |
| Autenticación | Flask-JWT-Extended | 4.7.1 |
| Rate Limiting | Flask-Limiter | 3.5.0 |
| Connection Pooling | mysql-connector-python | pooling |
| Audio Processing | librosa, pydub | 0.10.1 |
| ML | scikit-learn, joblib | 1.3.2 |
| Feature Extraction | numpy, scipy | - |
| IA Generativa | Groq API | Llama 3.1-8b-instant |
| Documentación API | Flasgger (OpenAPI 3.0) | 0.9.7.1 |
| Password Hashing | bcrypt | 12 rounds |

---

## 🏗 Arquitectura y Estructura

### Estructura de Carpetas (Actualizada)

```
backend/
├── app.py                    # Factory de aplicación Flask (create_app)
├── run.py                    # Entry point para ejecutar la aplicación
├── extensions.py             # Extensiones Flask (JWT, Limiter)
├── requirements.txt          # Dependencias Python
├── Dockerfile                # Configuración de contenedor
├── train_models.py           # Script para entrenar modelos ML
│
├── database/                 # Configuración y conexión a BD
│   ├── __init__.py
│   ├── config.py            # Config con JWT, CORS, password rules
│   └── connection.py        # Pool de conexiones MySQL (pool_size=32)
│
├── models/                   # Modelos de datos (capa de acceso a BD)
│   ├── __init__.py
│   ├── usuario.py           # Modelo Usuario
│   ├── audio.py             # Modelo Audio
│   ├── analisis.py          # Modelo Análisis
│   ├── resultado_analisis.py # Resultados de análisis
│   ├── recomendacion.py     # Recomendaciones IA
│   ├── rol.py / rol_usuario.py # Sistema de roles
│   ├── sesion.py            # Sesiones de usuario
│   ├── alerta_analisis.py   # Alertas del sistema
│   ├── historial_alerta.py  # Historial de alertas
│   ├── notificacion.py      # Notificaciones
│   ├── preferencia_notificacion.py # Preferencias
│   ├── grupo.py / grupo_miembro.py # Grupos y miembros
│   ├── actividad_grupo.py   # Actividades grupales
│   ├── juego_terapeutico.py # Juegos disponibles
│   ├── sesion_juego.py      # Sesiones de juego
│   ├── reporte.py / reporte_resultado.py # Reportes
│   ├── refresh_token.py     # Refresh tokens
│   ├── emotion_model.pkl    # Modelo ML entrenado (NO versionar)
│   └── training_data.json   # Datos de entrenamiento
│
├── routes/                   # Blueprints (endpoints API)
│   ├── __init__.py
│   ├── auth_routes.py       # /api/auth/* (registro, login, OAuth, refresh)
│   ├── usuario_routes.py    # /api/usuarios/* (perfil, CRUD)
│   ├── audio_routes.py      # /api/audio/* (upload, análisis)
│   ├── analisis_routes.py   # /api/analisis/* (historial)
│   ├── alertas_routes.py    # /api/alertas/* (alertas críticas)
│   ├── notificaciones_routes.py # /api/notificaciones/*
│   ├── recomendaciones_routes.py # /api/recomendaciones/*
│   ├── juegos_routes.py     # /api/juegos/*
│   ├── grupos_routes.py     # /api/grupos/*
│   ├── sesion_grupal_routes.py # /api/sesiones-grupales/*
│   ├── resultados_routes.py # /api/resultados/*
│   ├── reportes_routes.py   # /api/reportes/*
│   ├── roles_routes.py      # /api/roles/*
│   ├── admin_routes.py      # /api/admin/*
│   ├── admin_reportes_routes.py # /api/admin/reportes/*
│   ├── auditoria_routes.py  # /api/auditoria/*
│   └── contact_routes.py    # /api/contact/*
│
├── services/                 # Lógica de negocio
│   ├── __init__.py
│   ├── auth_service.py      # Lógica de autenticación
│   ├── usuario_service.py   # Lógica de usuarios
│   ├── audio_service.py     # Procesamiento de audio + ML
│   ├── analisis_service.py  # Lógica de análisis
│   ├── groq_service.py      # Integración con Groq IA (Llama 3.1)
│   ├── recomendaciones_service.py # Gestión de recomendaciones
│   ├── recomendaciones_ia.py # IA para recomendaciones
│   ├── alertas_service.py   # Gestión de alertas críticas
│   ├── notificaciones_service.py # Notificaciones push/email
│   ├── email_service.py     # Envío de emails
│   ├── resultados_service.py # Gestión de resultados
│   ├── reportes_service.py  # Generación de reportes
│   ├── roles_service.py     # Gestión de roles
│   ├── sesion_service.py    # Sesiones de usuario
│   ├── sesion_grupal_service.py # Sesiones grupales
│   └── auditoria_service.py # Auditoría del sistema
│
├── utils/                    # Utilidades compartidas
│   ├── helpers.py           # Helpers generales (format_response)
│   ├── seguridad.py         # Validaciones, hash, sanitización, roles
│   ├── security_middleware.py # Rate limiting, headers, CORS, SecureLog
│   ├── audio_processor.py   # Procesamiento de audio (librosa)
│   └── feature_extractor.py # Extracción de características ML
│
├── tests/                    # Tests
│   └── test_routes.py       # Tests de rutas
│
├── tools/                    # Scripts de utilidad
│   └── ...
│
└── uploads/                  # Archivos subidos (NO versionar)
    ├── audios/
    └── perfiles/
```

### Patrón de Arquitectura ESTRICTO: Routes → Services → Models

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│   Routes    │ --> │  Services   │ --> │   Models    │ --> │    DB    │
│ (Blueprints)│     │  (Business) │     │ (Data Access)│     │  MySQL   │
└─────────────┘     └─────────────┘     └─────────────┘     └──────────┘
      │                    │
      │                    ├── Integración IA (Groq - groq_service.py)
      │                    └── ML (AudioService - emotion_model.pkl)
      │
      └── Validación de entrada (Seguridad.*)
          Rate Limiting (@limiter.limit)
          Autenticación JWT (@jwt_required)
          Control de Roles (@role_required)
```

**REGLA ESTRICTA**: NUNCA saltarse esta jerarquía:
- Routes: Solo manejo de request/response, validación de entrada
- Services: Toda la lógica de negocio, llamadas a IA, procesamiento
- Models: Solo acceso a datos (SQL queries)

---

## 🛠 Servicios Principales (Implementación Real)

### AudioService - Análisis de Voz y Emociones

```python
# backend/services/audio_service.py
class AudioService:
    """Servicio de análisis de audio con ML."""
    
    def __init__(self):
        self.audio_processor = AudioProcessor()
        self.feature_extractor = FeatureExtractor()
        self.model = None  # Modelo ML cargado
        self.scaler = None  # StandardScaler
        self.label_encoder = None  # LabelEncoder para emociones
        
        # Rutas de modelos
        self.model_path = 'models/emotion_model.pkl'
        self.training_data_path = 'models/training_data.json'
        
        self.load_or_initialize_model()
    
    def analyze_audio(self, filepath: str, duration: float) -> Dict:
        """
        Analiza un archivo de audio.
        
        Returns:
            {
                'emotions': [{'name': str, 'value': float, 'color': str}, ...],
                'confidence': float,  # 0-1
                'features': Dict  # Resumen de características
            }
        """
        # Cargar con librosa (sr=16000, mono=True)
        # Extraer features
        # Usar modelo ML o fallback heurístico
        pass
    
    def _analyze_with_model(self, features: List) -> Tuple[List, float]:
        """Predicción con modelo Gradient Boosting."""
        # scaler.transform() + model.predict_proba()
        pass
    
    def _analyze_heuristic(self, features: List) -> Tuple[List, float]:
        """Fallback si no hay modelo entrenado."""
        pass

# Emociones soportadas:
EMOTION_MAP = {
    'feliz': 'Felicidad',
    'triste': 'Tristeza',
    'enojado': 'Enojo',
    'neutral': 'Neutral',
    'sorprendido': 'Sorpresa',
    'asustado': 'Miedo'
}

COLOR_MAP = {
    'Felicidad': '#FFD700',
    'Tristeza': '#4169E1',
    'Enojo': '#FF6347',
    'Neutral': '#808080',
    'Sorpresa': '#FF69B4',
    'Miedo': '#9370DB'
}
```

### GroqService - IA Generativa para Recomendaciones

```python
# backend/services/groq_service.py
TIPOS_RECOMENDACION_VALIDOS = [
    'respiracion',      # Técnicas de respiración
    'pausa_activa',     # Descansos o pausas
    'meditacion',       # Meditación, mindfulness
    'ejercicio',        # Actividad física
    'profesional'       # Buscar ayuda profesional
]

def generate_recommendations_with_groq(
    payload: Dict,
    recent_recommendations: List[Dict] = None
) -> List[Dict]:
    """
    Genera recomendaciones usando Groq Llama 3.1.
    
    Args:
        payload: Datos del análisis (emotions, features, summary)
        recent_recommendations: Historial para evitar repetición
    
    Returns:
        Lista de {tipo_recomendacion: str, contenido: str}
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return []
    
    client = Groq(api_key=api_key)
    
    # Modelo y parámetros
    model_id = os.getenv("GROQ_RECS_MODEL", "llama-3.1-8b-instant")
    temperature = 0.7  # Creatividad moderada
    max_tokens = 600
    
    # Prompt estructurado con tipos EXACTOS permitidos
    # Ver archivo completo para el prompt
    
    response = client.chat.completions.create(
        model=model_id,
        messages=[...],
        temperature=temperature,
        max_tokens=max_tokens
    )
    
    # Parsear JSON (strip_markdown_json para limpiar ```json```)
    # Validar que tipo_recomendacion esté en TIPOS_VALIDOS
    return parsed_recommendations

# IMPORTANTE: Validar tipos de recomendación
def validate_recommendation_type(tipo: str) -> bool:
    return tipo in TIPOS_RECOMENDACION_VALIDOS
```

### AlertasService - Gestión de Alertas Críticas

```python
# backend/services/alertas_service.py
class AlertasService:
    """Gestión de alertas de análisis críticos."""
    
    @staticmethod
    def create_alert(analisis_data: Dict, resultado_data: Dict) -> Optional[int]:
        """
        Crea alerta si el análisis indica riesgo.
        Integra con NotificacionesService para alertas críticas.
        """
        nivel_estres = resultado_data.get('nivel_estres', 0)
        nivel_ansiedad = resultado_data.get('nivel_ansiedad', 0)
        
        # Determinar nivel de alerta
        if nivel_estres >= 80 or nivel_ansiedad >= 80:
            nivel = 'critico'
            # Crear notificación para admins
            NotificacionesService.notificar_alerta_critica(...)
        elif nivel_estres >= 60 or nivel_ansiedad >= 60:
            nivel = 'alto'
        else:
            return None  # No requiere alerta
        
        return AlertaAnalisis.create(...)
    
    @staticmethod
    def assign_alert(alerta_id: int, admin_id: int) -> bool:
        """Asigna alerta a un administrador."""
        # Crea entrada en HistorialAlerta
        HistorialAlerta.create(
            alerta_id=alerta_id,
            admin_id=admin_id,
            accion='asignacion'
        )
        return AlertaAnalisis.assign(alerta_id, admin_id)
    
    @staticmethod
    def resolve_alert(alerta_id: int, admin_id: int, notas: str) -> bool:
        """Resuelve una alerta."""
        # Registrar en historial
        # Actualizar estado
        pass
```

### RecomendacionesService - Integración Completa

```python
# backend/services/recomendaciones_service.py
class RecomendacionesService:
    """Gestión de recomendaciones personalizadas."""
    
    @staticmethod
    def get_for_user(id_usuario: int, limit: int = 10) -> List[Dict]:
        """
        Obtiene recomendaciones con contexto del análisis.
        
        SQL Join: recomendaciones → resultado_analisis → analisis → audio
        """
        query = """
            SELECT r.*, ra.nivel_estres, ra.nivel_ansiedad,
                   a.fecha_analisis, au.duracion
            FROM recomendaciones r
            JOIN resultado_analisis ra ON r.id_resultado = ra.id_resultado
            JOIN analisis a ON ra.id_analisis = a.id_analisis
            JOIN audio au ON a.id_audio = au.id_audio
            WHERE au.id_usuario = %s
            ORDER BY r.fecha_creacion DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def generate_for_result(id_resultado: int) -> List[Dict]:
        """Genera recomendaciones usando Groq para un resultado."""
        resultado = ResultadoAnalisis.get_by_id(id_resultado)
        
        # Obtener historial para evitar repetición
        recent = Recomendacion.get_recent_by_user(...)
        
        # Llamar a Groq
        from services.groq_service import generate_recommendations_with_groq
        recommendations = generate_recommendations_with_groq(
            payload={...},
            recent_recommendations=recent
        )
        
        # Guardar en BD
        for rec in recommendations:
            Recomendacion.create(
                id_resultado=id_resultado,
                tipo_recomendacion=rec['tipo_recomendacion'],
                contenido=rec['contenido']
            )
        
        return recommendations
```

### Crear Nuevos Componentes

#### Nueva Ruta (Blueprint)

```python
# backend/routes/nueva_ruta_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.nueva_service import NuevaService
from utils.helpers import Helpers
from utils.seguridad import role_required
from utils.security_middleware import limiter

bp = Blueprint('nueva_ruta', __name__, url_prefix='/api/nueva-ruta')

@bp.route('/', methods=['GET'])
@jwt_required()
@limiter.limit("30 per minute")
def get_items():
    """
    Obtener todos los items del usuario
    ---
    tags:
      - NuevaRuta
    security:
      - Bearer: []
    responses:
      200:
        description: Lista de items
    """
    user_id = get_jwt_identity()
    items = NuevaService.get_user_items(user_id)
    return Helpers.format_response(success=True, data=items)
```

#### Nuevo Servicio

```python
# backend/services/nueva_service.py
from typing import List, Dict, Optional
from database.connection import DatabaseConnection
from models.nueva_model import NuevaModel

class NuevaService:
    """Servicio para gestión de [entidad]."""
    
    @staticmethod
    def get_user_items(id_usuario: int) -> List[Dict]:
        """
        Obtener items de un usuario.
        
        Args:
            id_usuario: ID del usuario autenticado.
        
        Returns:
            Lista de items del usuario.
        """
        return NuevaModel.get_by_user(id_usuario)
    
    @staticmethod
    def create_item(id_usuario: int, data: Dict) -> Optional[int]:
        """
        Crear nuevo item.
        
        Args:
            id_usuario: ID del usuario.
            data: Datos del item a crear.
        
        Returns:
            ID del item creado o None si falla.
        """
        # Validación de negocio aquí
        return NuevaModel.create(id_usuario, **data)
```

#### Nuevo Modelo

```python
# backend/models/nueva_model.py
from database.connection import DatabaseConnection
from typing import List, Dict, Optional

class NuevaModel:
    """Modelo para la tabla nueva_tabla."""
    
    @staticmethod
    def create(**kwargs) -> Optional[int]:
        """Crear registro y devolver ID."""
        query = """
            INSERT INTO nueva_tabla (campo1, campo2, id_usuario)
            VALUES (%s, %s, %s)
        """
        result = DatabaseConnection.execute_query(
            query,
            (kwargs['campo1'], kwargs['campo2'], kwargs['id_usuario']),
            fetch=False
        )
        return result.get('last_id')
    
    @staticmethod
    def get_by_id(id_registro: int) -> Optional[Dict]:
        """Obtener registro por ID."""
        query = "SELECT * FROM nueva_tabla WHERE id = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (id_registro,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_user(id_usuario: int, limit: int = 50) -> List[Dict]:
        """Obtener registros de un usuario."""
        query = """
            SELECT * FROM nueva_tabla 
            WHERE id_usuario = %s AND activo = 1
            ORDER BY fecha_creacion DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def delete(id_registro: int) -> bool:
        """Soft delete de registro."""
        query = "UPDATE nueva_tabla SET activo = 0, eliminado = 1 WHERE id = %s"
        DatabaseConnection.execute_query(query, (id_registro,), fetch=False)
        return True
```

---

## 📝 Convenciones de Código

### Type Hints (Obligatorio - PEP 484)

```python
# ✅ CORRECTO
from typing import List, Dict, Optional, Tuple, Union

def procesar_audio(
    filepath: str, 
    duracion: float,
    usuario_id: Optional[int] = None
) -> Dict[str, any]:
    """Procesa audio y retorna resultados."""
    pass

def validar_password(password: str) -> Tuple[bool, str]:
    """Retorna (es_valido, mensaje)."""
    pass

# ❌ INCORRECTO
def procesar_audio(filepath, duracion, usuario_id=None):
    pass
```

### Docstrings (Google Style)

```python
def analyze_audio(
    filepath: str, 
    duration: float, 
    user_id: Optional[int] = None
) -> Dict[str, any]:
    """
    Analiza un archivo de audio y extrae emociones.
    
    Args:
        filepath: Ruta absoluta al archivo de audio.
        duration: Duración en segundos.
        user_id: ID del usuario (opcional para modo invitado).
    
    Returns:
        Diccionario con:
            - emotions: Lista de emociones detectadas
            - confidence: Confianza del modelo (0-1)
            - features: Características extraídas
    
    Raises:
        ValueError: Si el archivo no existe o está corrupto.
        AudioProcessingError: Si falla el análisis.
    
    Example:
        >>> result = analyze_audio('/tmp/audio.wav', 30.5, user_id=123)
        >>> print(result['emotions'][0]['name'])
        'Felicidad'
    """
    pass
```

### Naming Conventions

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Archivos | snake_case | `audio_routes.py`, `user_service.py` |
| Clases | PascalCase | `AudioService`, `Usuario` |
| Funciones/Métodos | snake_case | `get_user_by_id()`, `analyze_audio()` |
| Constantes | UPPER_SNAKE_CASE | `MAX_AUDIO_SIZE`, `ALLOWED_EXTENSIONS` |
| Variables | snake_case | `user_id`, `audio_file` |
| Blueprints | snake_case prefix `bp` | `bp = Blueprint('audio', ...)` |

### Imports (Orden)

```python
# 1. Standard library
import os
import json
from datetime import datetime
from typing import List, Dict, Optional

# 2. Third-party packages
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import numpy as np

# 3. Local imports
from database.connection import DatabaseConnection
from models.usuario import Usuario
from services.auth_service import AuthService
from utils.helpers import Helpers
from utils.seguridad import Seguridad
```

### Herramientas de Calidad

```bash
# Linting y formato (ejecutar antes de commit)
ruff check backend/             # Linting rápido
ruff format backend/            # Auto-formato
black backend/                  # Formato alternativo
mypy backend/                   # Type checking
bandit -r backend/              # Security scanning
```

Configuración recomendada en `pyproject.toml`:

```toml
[tool.ruff]
line-length = 100
target-version = "py311"
select = ["E", "F", "W", "I", "N", "S", "B"]

[tool.black]
line-length = 100
target-version = ['py311']

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
ignore_missing_imports = true
```

---

## 🔒 Seguridad de Software (Obligatorio)

### ⚠️ DATOS SENSIBLES - Clasificación

| Tipo de Dato | Clasificación | Tratamiento |
|--------------|---------------|-------------|
| Grabaciones de voz | **CRÍTICO** | No loguear, encriptar, retención limitada |
| Niveles emocionales | **ALTO** | Anonimizar en logs, agregar para reportes |
| Emails, nombres | **MEDIO** | Enmascarar en logs |
| Tokens, contraseñas | **CRÍTICO** | NUNCA loguear, solo hashes |
| IPs de usuarios | **MEDIO** | Hash para rate limiting |

### Protección de Datos de Voz

```python
# ❌ PROHIBIDO - NUNCA hacer esto
import logging
logging.info(f"Audio recibido: {audio_data}")  # NO
logging.info(f"Emociones detectadas: {emotions}")  # NO
print(f"Nivel de ansiedad del usuario {user_id}: {nivel}")  # NO

# ✅ CORRECTO - Usar SecureLogger
from utils.security_middleware import secure_log

# Solo loguear metadatos agregados, nunca datos raw
secure_log.info("Audio procesado", data={
    "duracion_segundos": duration,
    "formato": "wav",
    "analisis_exitoso": True
})

# Para métricas emocionales, agregar/anonimizar
secure_log.info("Análisis completado", data={
    "clasificacion": "normal",  # Solo categoría, no valores
    "confianza_rango": "alta"   # No valor exacto
})
```

### Retención y Eliminación de Datos

```python
# Política de retención (implementar en jobs programados)
RETENTION_POLICIES = {
    'audio_files': 30,           # Días antes de eliminar archivos físicos
    'analisis_detallado': 90,    # Días antes de anonimizar
    'datos_agregados': 365,      # Mantener estadísticas anónimas
}

# Eliminación segura de archivos de audio
import os
import secrets

def secure_delete_audio(filepath: str) -> bool:
    """
    Elimina archivo de audio de forma segura.
    Sobreescribe contenido antes de eliminar.
    """
    try:
        if os.path.exists(filepath):
            # Sobreescribir con datos aleatorios
            file_size = os.path.getsize(filepath)
            with open(filepath, 'wb') as f:
                f.write(secrets.token_bytes(file_size))
            # Eliminar archivo
            os.remove(filepath)
            return True
    except Exception:
        return False
```

### Validación y Sanitización de Inputs

```python
from utils.seguridad import Seguridad

# ✅ Siempre validar y sanitizar
@bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")  # Rate limit estricto
def register():
    data = request.get_json()
    
    # 1. Sanitizar inputs de texto
    nombre = Seguridad.sanitize_input(data.get('nombre', ''))
    apellido = Seguridad.sanitize_input(data.get('apellido', ''))
    
    # 2. Validar formato de email
    correo = data.get('correo', '').lower().strip()
    if not Seguridad.validate_email(correo):
        return Helpers.format_response(False, "Email inválido", status=400)
    
    # 3. Validar fuerza de contraseña
    password_valid, password_msg = Seguridad.validate_password_strength(
        data.get('contrasena', '')
    )
    if not password_valid:
        return Helpers.format_response(False, password_msg, status=400)
    
    # 4. Validar archivos subidos
    if 'foto' in request.files:
        file = request.files['foto']
        if not allowed_file(file.filename):
            return Helpers.format_response(False, "Tipo de archivo no permitido", status=400)
```

### Prevención de Inyecciones SQL

```python
# ✅ SIEMPRE usar consultas parametrizadas
query = "SELECT * FROM usuario WHERE correo = %s AND activo = 1"
results = DatabaseConnection.execute_query(query, (correo,))

# ❌ NUNCA concatenar strings en queries
query = f"SELECT * FROM usuario WHERE correo = '{correo}'"  # VULNERABLE

# ❌ NUNCA usar format()
query = "SELECT * FROM usuario WHERE correo = '{}'".format(correo)  # VULNERABLE
```

### Secrets Management

```python
# ✅ CORRECTO - Siempre desde variables de entorno
import os
from database.config import Config

jwt_secret = Config.JWT_SECRET_KEY  # Viene de os.getenv()
groq_key = os.getenv("GROQ_API_KEY")
db_password = os.getenv("DB_PASSWORD")

# ❌ PROHIBIDO - Nunca hardcodear
JWT_SECRET = "mi-secreto-hardcodeado"  # NUNCA
API_KEY = "sk-12345..."  # NUNCA

# Archivo .env.example (versionar como template)
"""
# .env.example - Copiar a .env y llenar valores reales
FLASK_ENV=development
JWT_SECRET_KEY=  # Generar con: python -c "import secrets; print(secrets.token_hex(32))"
DB_HOST=localhost
DB_USER=
DB_PASSWORD=
DB_NAME=serenvoice
GROQ_API_KEY=
"""
```

### Rate Limiting (Implementado)

```python
from utils.security_middleware import limiter

# Límites por tipo de endpoint
@bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute, 20 per hour")  # Auth: muy estricto
def login():
    pass

@bp.route('/audio/analyze', methods=['POST'])
@limiter.limit("10 per minute")  # Upload: moderado
def analyze():
    pass

@bp.route('/usuarios/perfil', methods=['GET'])
@limiter.limit("60 per minute")  # Lectura: más permisivo
def get_profile():
    pass
```

### Security Headers (Implementado en `security_middleware.py`)

Headers configurados automáticamente:
- `X-Frame-Options: SAMEORIGIN` - Previene clickjacking
- `X-Content-Type-Options: nosniff` - Previene MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Protección XSS
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (en producción)
- `Strict-Transport-Security` (en producción con HTTPS)
- `Cache-Control: no-store` para rutas sensibles

### CORS Seguro (Implementado)

```python
# En database/config.py
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 
    'http://localhost:5173,http://localhost:5174'
).split(',')

# ❌ NUNCA usar wildcard en producción
CORS(app, resources={r"/api/*": {"origins": "*"}})  # INSEGURO

# ✅ Lista explícita de orígenes
CORS(app, resources={r"/api/*": get_cors_config()})
```

---

## 🔐 Autenticación y Autorización

### JWT Configuration (Actual)

```python
# database/config.py
JWT_SECRET_KEY = _get_secure_jwt_secret()  # Generado/cargado seguro
JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=900)  # 15 min en prod
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
JWT_TOKEN_LOCATION = ['headers']
JWT_HEADER_NAME = 'Authorization'
JWT_HEADER_TYPE = 'Bearer'
JWT_ALGORITHM = 'HS256'
```

### Proteger Endpoints

```python
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.seguridad import role_required

# Endpoint que requiere autenticación
@bp.route('/perfil', methods=['GET'])
@jwt_required()
def get_perfil():
    user_id = get_jwt_identity()  # Obtener ID del token
    # ...

# Endpoint solo para admins
@bp.route('/admin/usuarios', methods=['GET'])
@jwt_required()
@role_required('admin')
def admin_get_users():
    # Solo usuarios con rol 'admin' pueden acceder
    pass

# Endpoint con roles múltiples
@bp.route('/reportes', methods=['GET'])
@jwt_required()
@role_required('admin', 'moderador')
def get_reportes():
    pass
```

### Implementación de `role_required`

```python
# utils/seguridad.py
def role_required(*roles):
    """
    Decorador para verificar roles de usuario.
    
    Args:
        *roles: Roles permitidos (ej: 'admin', 'moderador')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            user_roles = RolUsuario.get_user_roles(user_id)
            role_names = [r.get('nombre_rol') for r in user_roles]
            
            if not any(role in role_names for role in roles):
                return jsonify({
                    'success': False,
                    'error': 'No tienes permisos para esta acción'
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
```

---

## 🗃 Base de Datos y Modelos

### Pool de Conexiones (Implementación Real)

```python
# database/connection.py
class DatabaseConnection:
    """Manejo global (estático) del pool de conexiones."""
    pool = None

    @staticmethod
    def initialize_pool():
        """Inicializa el pool - llamar una sola vez al arrancar."""
        DatabaseConnection.pool = pooling.MySQLConnectionPool(
            pool_name="serenvoice_pool",
            pool_size=32,              # Conexiones concurrentes
            pool_reset_session=True,   # Reset al devolver
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'serenvoice'),
            port=int(os.getenv('DB_PORT', 3306)),
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci',
            use_unicode=True,
            connection_timeout=10,
            autocommit=True,           # Auto-commit para lecturas
        )

    @staticmethod
    def get_connection():
        """
        Obtiene conexión del pool.
        Usar como context manager: with get_connection() as conn:
        """
        if DatabaseConnection.pool is None:
            raise RuntimeError("Pool no inicializado")
        return _ConnectionContext(DatabaseConnection.pool.get_connection())

    @staticmethod
    def execute_query(query: str, params=None, fetch=True):
        """
        Ejecuta query de forma segura.
        
        Args:
            query: SQL con placeholders %s
            params: Tupla de parámetros
            fetch: True para SELECT, False para INSERT/UPDATE/DELETE
        
        Returns:
            Si fetch=True: List[Dict] con resultados
            Si fetch=False: {'ok': True, 'last_id': int, 'rowcount': int}
        """
        conn = None
        cursor = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params)
            
            if fetch:
                return cursor.fetchall()
            
            conn.commit()
            return {
                "ok": True,
                "last_id": cursor.lastrowid,
                "rowcount": cursor.rowcount
            }
        finally:
            if cursor: cursor.close()
            if conn: DatabaseConnection.release_connection(conn)
```

### Patrón de Modelo (Data Access Layer)

```python
# Todos los modelos siguen este patrón EXACTO
# models/ejemplo_model.py

from database.connection import DatabaseConnection
from typing import List, Dict, Optional

class EjemploModel:
    """Modelo para la tabla ejemplo."""
    
    # ============ CREATE ============
    @staticmethod
    def create(**kwargs) -> Optional[int]:
        """Crear registro y devolver ID."""
        query = """
            INSERT INTO ejemplo (campo1, campo2, id_usuario)
            VALUES (%s, %s, %s)
        """
        result = DatabaseConnection.execute_query(
            query,
            (kwargs['campo1'], kwargs['campo2'], kwargs['id_usuario']),
            fetch=False
        )
        return result.get('last_id')
    
    # ============ READ ============
    @staticmethod
    def get_by_id(id_registro: int) -> Optional[Dict]:
        """Obtener registro por ID (solo activos)."""
        query = "SELECT * FROM ejemplo WHERE id = %s AND activo = 1"
        results = DatabaseConnection.execute_query(query, (id_registro,))
        return results[0] if results else None
    
    @staticmethod
    def get_by_user(id_usuario: int, limit: int = 50) -> List[Dict]:
        """Obtener registros de un usuario."""
        query = """
            SELECT * FROM ejemplo 
            WHERE id_usuario = %s AND activo = 1
            ORDER BY fecha_creacion DESC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_usuario, limit))
    
    @staticmethod
    def get_all(limit: int = 100) -> List[Dict]:
        """Obtener todos los registros activos."""
        query = "SELECT * FROM ejemplo WHERE activo = 1 LIMIT %s"
        return DatabaseConnection.execute_query(query, (limit,))
    
    # ============ UPDATE ============
    @staticmethod
    def update(id_registro: int, **kwargs) -> bool:
        """Actualizar registro."""
        fields = ', '.join(f"{k} = %s" for k in kwargs.keys())
        query = f"UPDATE ejemplo SET {fields}, fecha_actualizacion = NOW() WHERE id = %s"
        params = tuple(kwargs.values()) + (id_registro,)
        result = DatabaseConnection.execute_query(query, params, fetch=False)
        return result.get('rowcount', 0) > 0
    
    # ============ DELETE (SOFT) ============
    @staticmethod
    def delete(id_registro: int) -> bool:
        """Soft delete de registro - NUNCA DELETE físico."""
        query = "UPDATE ejemplo SET activo = 0, eliminado = 1 WHERE id = %s"
        result = DatabaseConnection.execute_query(query, (id_registro,), fetch=False)
        return result.get('rowcount', 0) > 0
```

### Soft Delete (OBLIGATORIO)

```python
# TODAS las tablas usan soft delete con estos campos:
# - activo: TINYINT(1) DEFAULT 1
# - eliminado: TINYINT(1) DEFAULT 0

# ✅ CORRECTO - Siempre filtrar por activo
query = "SELECT * FROM usuarios WHERE id = %s AND activo = 1"

# ✅ CORRECTO - Soft delete
query = "UPDATE usuarios SET activo = 0, eliminado = 1 WHERE id = %s"

# ❌ PROHIBIDO - Delete físico
query = "DELETE FROM usuarios WHERE id = %s"  # NUNCA
```

### Queries con Joins (Ejemplo Real)

```python
# services/recomendaciones_service.py
def get_for_user(id_usuario: int, limit: int = 10) -> List[Dict]:
    """Obtiene recomendaciones con contexto completo."""
    query = """
        SELECT 
            r.id_recomendacion,
            r.tipo_recomendacion,
            r.contenido,
            r.fecha_creacion,
            ra.nivel_estres,
            ra.nivel_ansiedad,
            a.fecha_analisis,
            au.duracion
        FROM recomendaciones r
        JOIN resultado_analisis ra ON r.id_resultado = ra.id_resultado
        JOIN analisis a ON ra.id_analisis = a.id_analisis
        JOIN audio au ON a.id_audio = au.id_audio
        WHERE au.id_usuario = %s
          AND r.activo = 1
        ORDER BY r.fecha_creacion DESC
        LIMIT %s
    """
    return DatabaseConnection.execute_query(query, (id_usuario, limit))
```

---

## 🤖 Integración con Groq AI

### Configuración

```python
# Variables de entorno requeridas
GROQ_API_KEY=gsk_xxxxxxxxxxxx  # API key de Groq
GROQ_RECS_MODEL=llama-3.1-8b-instant  # Modelo por defecto
```

### Tipos de Recomendación Válidos (INMUTABLE)

```python
# services/groq_service.py
# ⚠️ SOLO estos tipos son válidos - NO agregar nuevos sin aprobación
TIPOS_RECOMENDACION_VALIDOS = [
    'respiracion',      # Técnicas de respiración (4-7-8, box breathing, etc.)
    'pausa_activa',     # Descansos, pausas, tiempo al aire libre
    'meditacion',       # Meditación, mindfulness, visualización
    'ejercicio',        # Actividad física, yoga, estiramientos
    'profesional'       # Recomendación de buscar ayuda profesional
]

# ❌ PROHIBIDO usar estos tipos (Groq a veces los sugiere):
# 'habito', 'general', 'ocio', 'social', 'alimentacion'
```

### Prompt Engineering (Estructura Actual)

```python
def generate_recommendations_with_groq(payload, recent_recommendations=None):
    # 1. Construir contexto de historial para evitar repetición
    historial_context = ""
    if recent_recommendations:
        recent_texts = [r.get('contenido', '')[:60] for r in recent_recommendations[:5]]
        historial_context = "\n\nRECOMENDACIONES PREVIAS (EVITA repetir):\n" + \
                           "\n".join(f"- {t}..." for t in recent_texts)
    
    # 2. Prompt estructurado con tipos EXACTOS
    user_content = f"""
    Genera EXACTAMENTE 4 recomendaciones prácticas en español.
    Responde SOLO JSON válido sin markdown.
    
    REQUISITO CRÍTICO - tipos válidos:
    - 'respiracion', 'pausa_activa', 'meditacion', 'ejercicio', 'profesional'
    
    Datos del análisis: {payload}
    {historial_context}
    """
    
    # 3. Llamada a Groq
    response = client.chat.completions.create(
        model=os.getenv("GROQ_RECS_MODEL", "llama-3.1-8b-instant"),
        messages=[
            {"role": "system", "content": "Eres un asistente de bienestar..."},
            {"role": "user", "content": user_content},
        ],
        temperature=0.7,   # Creatividad moderada
        max_tokens=600,
    )
    
    # 4. Parsear respuesta (strip_markdown_json para limpiar)
    # 5. Validar tipos de recomendación
    # 6. Filtrar inválidos
```

### Manejo de Errores de Groq

```python
try:
    resp = client.chat.completions.create(...)
except Exception as e:
    err_str = str(e).lower()
    
    # Error específico de organización restringida
    if "organization_restricted" in err_str:
        print("[groq_service] ERROR: Organización restringida en Groq")
        # Notificar a admin o usar fallback
    
    # Siempre retornar lista vacía, nunca crashear
    return []
```

### Validación de Respuesta JSON

```python
def strip_markdown_json(text: str) -> str:
    """Remove markdown code fences from JSON response."""
    pattern = r'```(?:json)?\s*([\s\S]*?)\s*```'
    match = re.search(pattern, text)
    return match.group(1).strip() if match else text.strip()

# Parsear con manejo de múltiples objetos JSON
cleaned = strip_markdown_json(content)
try:
    data = json.loads(cleaned)
except json.JSONDecodeError:
    # Groq a veces devuelve múltiples objetos
    # Usar regex para extraer todos los objetos JSON
    json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    matches = re.findall(json_pattern, cleaned, re.DOTALL)
    for match in matches:
        obj = json.loads(match)
        # Validar y agregar
```

---

## 📡 API y Contratos

### Formato de Respuesta Estándar

```python
# Usar SIEMPRE Helpers.format_response()
from utils.helpers import Helpers

# Éxito
return Helpers.format_response(
    success=True,
    data={"usuario": usuario_data},
    message="Usuario obtenido correctamente",
    status=200
)

# Error
return Helpers.format_response(
    success=False,
    message="Usuario no encontrado",
    status=404
)

# Estructura de respuesta:
{
    "success": true/false,
    "message": "Mensaje descriptivo",
    "data": { ... }  // Solo si success=true
}
```

### Códigos HTTP Estándar

| Código | Uso |
|--------|-----|
| 200 | Éxito en GET, PUT, PATCH |
| 201 | Éxito en POST (recurso creado) |
| 400 | Error de validación / Request inválido |
| 401 | No autenticado / Token inválido |
| 403 | No autorizado / Sin permisos |
| 404 | Recurso no encontrado |
| 429 | Rate limit excedido |
| 500 | Error interno del servidor |

### Documentación OpenAPI (Flasgger)

```python
@bp.route('/analisis/<int:id_analisis>', methods=['GET'])
@jwt_required()
def get_analisis(id_analisis):
    """
    Obtener detalle de un análisis
    ---
    tags:
      - Análisis
    security:
      - Bearer: []
    parameters:
      - name: id_analisis
        in: path
        type: integer
        required: true
        description: ID del análisis
    responses:
      200:
        description: Detalle del análisis
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                analisis:
                  type: object
                resultado:
                  type: object
                recomendaciones:
                  type: array
      404:
        description: Análisis no encontrado
      403:
        description: Sin permisos
    """
    pass
```

### Versionado de API

```python
# Actual: /api/...
# Si se necesita versionado futuro:
# /api/v1/...
# /api/v2/...

# Blueprint con versión
bp = Blueprint('usuarios_v1', __name__, url_prefix='/api/v1/usuarios')
```

---

## 🧪 Testing

### Estructura de Tests

```
backend/tests/
├── __init__.py
├── conftest.py          # Fixtures compartidos
├── test_routes.py       # Tests de rutas/endpoints
├── test_services.py     # Tests de servicios
├── test_models.py       # Tests de modelos
├── test_security.py     # Tests de seguridad
└── test_integration.py  # Tests de integración
```

### Ejemplo de Test

```python
# tests/test_routes.py
import pytest
from app import create_app

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code in (200, 500)  # OK o DB disconnected
    data = response.get_json()
    assert 'status' in data

def test_register_validation(client):
    # Test sin campos requeridos
    response = client.post('/api/auth/register', json={})
    assert response.status_code == 400
    
    # Test con email inválido
    response = client.post('/api/auth/register', json={
        'nombre': 'Test',
        'apellido': 'User',
        'correo': 'invalid-email',
        'contrasena': 'Password123'
    })
    assert response.status_code == 400

def test_protected_route_requires_auth(client):
    response = client.get('/api/usuarios/perfil')
    assert response.status_code == 401
```

### Mocking de Servicios Externos

```python
from unittest.mock import patch, MagicMock

def test_groq_recommendations_failure():
    """Test que el sistema maneja errores de Groq gracefully."""
    with patch('services.groq_service.Groq') as mock_groq:
        mock_groq.return_value.chat.completions.create.side_effect = Exception("API Error")
        
        # El servicio debe retornar lista vacía, no crashear
        result = generate_recommendations_with_groq({})
        assert result == []
```

### Cobertura Mínima

```bash
# Ejecutar tests con cobertura
pytest --cov=backend --cov-report=html

# Cobertura mínima requerida: 70%
# Áreas críticas (80%+): auth_service, seguridad, audio_service
```

---

## 🔄 CI/CD y Calidad

### Checks Obligatorios (Pre-Merge)

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main, develop]
    paths: ['backend/**']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          pip install ruff mypy bandit pytest pytest-cov
      
      - name: Lint with ruff
        run: ruff check backend/
      
      - name: Type check with mypy
        run: mypy backend/ --ignore-missing-imports
      
      - name: Security scan with bandit
        run: bandit -r backend/ -ll -ii
      
      - name: Run tests
        run: pytest backend/tests/ --cov=backend --cov-fail-under=70
      
      - name: Dependency scan
        uses: pyupio/safety@v2
        with:
          api-key: ${{ secrets.SAFETY_API_KEY }}
```

### SAST (Static Application Security Testing)

```bash
# Bandit - Security linting
bandit -r backend/ -f json -o bandit-report.json

# Semgrep - Pattern-based analysis
semgrep --config=p/python backend/
```

### SBOM (Software Bill of Materials)

```bash
# Generar SBOM con syft
syft backend/ -o cyclonedx-json > sbom.json

# O con pip
pip-audit --format=cyclonedx-json > sbom.json
```

---

## 📊 Observabilidad

### Health/Readiness Endpoints (Actuales)

```python
# Implementados en app.py
@app.route('/api/health', methods=['GET'])
def health_check():
    db_status = DatabaseConnection.test_connection()
    return {
        'status': 'ok' if db_status else 'error',
        'database': 'connected' if db_status else 'disconnected',
        'message': 'SerenVoice API funcionando correctamente'
    }, 200 if db_status else 500
```

### Structured Logging

```python
from utils.security_middleware import secure_log

# ✅ Logging estructurado y seguro
secure_log.info("Operación completada", data={
    "operacion": "analisis_audio",
    "duracion_ms": 1500,
    "exitoso": True
})

# Los campos sensibles se sanitizan automáticamente
secure_log.info("Usuario autenticado", data={
    "user_id": 123,
    "correo": "user@example.com",  # Se enmascara a "us***le.com"
    "ip": request.remote_addr
})
```

### Métricas Recomendadas

```python
# Para integración futura con Prometheus/OpenTelemetry
METRICAS_CLAVE = {
    'audio_analisis_total': 'Contador de análisis realizados',
    'audio_analisis_duracion': 'Histograma de duración de análisis',
    'auth_login_total': 'Contador de intentos de login',
    'auth_login_fallidos': 'Contador de logins fallidos',
    'api_requests_total': 'Total de requests por endpoint',
    'api_latencia_segundos': 'Latencia de respuesta',
    'groq_llamadas_total': 'Llamadas a API de Groq',
    'groq_errores_total': 'Errores en llamadas a Groq',
}
```

---

## 🚫 Reglas Estrictas

### ❌ PROHIBIDO (NO HACER)

1. **Refactors masivos sin aprobación**
   - No renombrar carpetas existentes (`routes/`, `services/`, `models/`)
   - No cambiar patrones de arquitectura sin RFC
   - No migrar de MySQL a otra BD sin plan completo

2. **Cambios breaking en API**
   - No cambiar URLs de endpoints existentes
   - No modificar estructura de responses sin versionar
   - No eliminar campos de respuestas

3. **Seguridad**
   - NUNCA loguear datos de voz o emociones raw
   - NUNCA hardcodear secretos
   - NUNCA desactivar rate limiting en producción
   - NUNCA usar `*` en CORS en producción

4. **Base de datos**
   - NUNCA concatenar strings en queries SQL
   - NUNCA hacer DELETE físico (usar soft delete)
   - NUNCA exponer IDs internos sin validar permisos

### ✅ SIEMPRE HACER

1. **Antes de crear nuevo código**
   - Verificar si ya existe funcionalidad similar
   - Seguir patrones existentes en el directorio
   - Agregar type hints y docstrings

2. **Para cambios en endpoints**
   - Documentar en Flasgger/OpenAPI
   - Agregar tests
   - Validar inputs con Seguridad.*

3. **Para datos sensibles**
   - Usar SecureLogger
   - Anonimizar/agregar antes de loguear
   - Verificar permisos del usuario

### Cuándo Pedir Revisión Arquitectónica

- Nuevo servicio externo (API, base de datos)
- Cambios en autenticación/autorización
- Nuevo tipo de dato sensible
- Cambios en estructura de carpetas
- Migración de dependencias mayores

---

## ✅ Checklist para Nuevas Contribuciones

```markdown
### Pre-Código
- [ ] Leí las instrucciones del proyecto
- [ ] Verifiqué que no existe funcionalidad similar
- [ ] La ubicación del archivo sigue la estructura existente

### Código
- [ ] Type hints en todas las funciones
- [ ] Docstrings en funciones públicas
- [ ] Inputs validados y sanitizados
- [ ] Queries SQL parametrizadas
- [ ] Sin datos sensibles en logs
- [ ] Rate limiting en endpoints nuevos

### Seguridad
- [ ] No hay secretos hardcodeados
- [ ] Permisos verificados (jwt_required, role_required)
- [ ] Datos de voz/emociones protegidos

### Testing
- [ ] Tests unitarios agregados
- [ ] Tests de integración si aplica
- [ ] Cobertura >= 70%

### Documentación
- [ ] OpenAPI/Flasgger actualizado
- [ ] README actualizado si hay nuevo setup

### CI
- [ ] Linting pasa (ruff)
- [ ] Type checking pasa (mypy)
- [ ] Security scan pasa (bandit)
- [ ] Tests pasan
```

---

## 📚 Referencias

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [PEP 484 - Type Hints](https://peps.python.org/pep-0484/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)

---

*Esta documentación es la fuente autoritativa para contribuciones al backend de SerenVoice. Cualquier desviación requiere aprobación explícita del equipo.*
