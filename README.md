# 🎙️ SerenVoice

**SerenVoice** es una plataforma integral de análisis de voz con inteligencia artificial diseñada para la detección temprana de estrés y ansiedad a través del análisis de patrones vocales. El sistema combina técnicas avanzadas de procesamiento de señales de audio, aprendizaje automático y modelos de deep learning para proporcionar evaluaciones precisas del estado emocional de los usuarios.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Documentation](#-api-documentation)
- [Características Técnicas](#-características-técnicas)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características Principales

### 🎯 Análisis de Voz con IA
- **Detección de Emociones**: Análisis en tiempo real de patrones vocales para identificar emociones
- **Nivel de Estrés**: Evaluación cuantitativa del nivel de estrés basado en características acústicas
- **Nivel de Ansiedad**: Medición de indicadores de ansiedad en el habla
- **Clasificación Multiclase**: Sistema de clasificación emocional con confianza del modelo

### 👥 Gestión de Usuarios y Sesiones
- Autenticación segura con JWT
- Roles de usuario (Paciente, Administrador)
- Gestión de perfiles personalizados
- Historial completo de análisis

### 🎮 Juegos Terapéuticos
- Actividades interactivas para terapia
- Seguimiento de progreso en sesiones de juego
- Métricas de participación y resultados

### 👨‍👩‍👧‍👦 Gestión de Grupos Terapéuticos
- Creación y administración de grupos
- Actividades grupales colaborativas
- Seguimiento de participación individual

### 📊 Reportes y Análisis
- Generación de reportes en PDF y Excel
- Visualización de tendencias y patrones
- Gráficos y métricas de progreso
- Exportación de datos históricos

### 🔔 Sistema de Alertas y Notificaciones
- Alertas automáticas basadas en análisis
- Notificaciones personalizables
- Preferencias de notificación por usuario

### 🤖 Recomendaciones con IA
- Sugerencias personalizadas usando Groq AI
- Recomendaciones basadas en historial de análisis
- Intervenciones terapéuticas sugeridas

### 📱 Multi-Plataforma
- **Web**: Aplicación React moderna con Material-UI
- **Mobile**: App nativa con Expo (iOS y Android)
- **Backend API**: RESTful API con Flask

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTES                                 │
├──────────────────────┬──────────────────────────────────────┤
│   React Web App      │   React Native Mobile App            │
│   (Vite + MUI)       │   (Expo)                             │
└──────────┬───────────┴──────────────┬───────────────────────┘
           │                          │
           └──────────┬───────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │   Flask Backend API  │
           │   (Python 3.x)       │
           └──────────┬───────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   ┌────────┐   ┌─────────┐   ┌─────────┐
   │ MySQL  │   │ ML Model│   │ Groq AI │
   │   DB   │   │ (CNN)   │   │   API   │
   └────────┘   └─────────┘   └─────────┘
```

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Flask** - Framework web de Python
- **Flask-JWT-Extended** - Autenticación JWT
- **Flask-CORS** - Manejo de CORS
- **SQLAlchemy** - ORM para base de datos
- **MySQL** - Base de datos relacional
- **Librosa** - Procesamiento de audio
- **Scikit-learn** - Machine Learning
- **TensorFlow/Keras** - Deep Learning (CNN para emociones)
- **Pandas** - Análisis de datos
- **ReportLab** - Generación de PDFs
- **Groq API** - Inteligencia artificial generativa

### Frontend Web
- **React** - Biblioteca de UI
- **Vite** - Build tool
- **Material-UI (MUI)** - Componentes de interfaz
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Chart.js / Recharts** - Visualización de datos
- **React Hot Toast** - Notificaciones

### Mobile
- **Expo** - Framework React Native
- **React Navigation** - Navegación móvil
- **Axios** - Cliente HTTP

### DevOps
- **Docker & Docker Compose** - Contenedorización
- **phpMyAdmin** - Administración de base de datos

---

## 📦 Requisitos Previos

- **Node.js** >= 18.x
- **Python** >= 3.10
- **Docker** y **Docker Compose** (para desarrollo con contenedores)
- **MySQL** 8.0+ (si no se usa Docker)
- **npm** o **yarn**
- **Git**

---

## 🚀 Instalación

### Opción 1: Con Docker (Recomendado)

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Kenny010604/SERENVOICE.git
   cd serenvoice
   ```

2. **Configurar variables de entorno**
   ```bash
   # Copiar archivo de ejemplo
   cp .env.example .env
   ```
   
   ℹ️ **Nota**: El proyecto usa un único archivo `.env` en la raíz para todos los componentes (backend, frontend, mobile). Ver [.env.README.md](.env.README.md) para más detalles.

3. **Editar el archivo .env** con tus credenciales

4. **Iniciar con Docker Compose**
   ```bash
   docker-compose up --build
   ```

5. **Acceder a los servicios**
   - Frontend Web: http://localhost:5173
   - Backend API: http://localhost:5000
   - phpMyAdmin: http://localhost:8080

### Opción 2: Instalación Manual

#### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env (en la raíz del proyecto, no en backend/)
cd ..
cp .env.example .env
# Editar .env con tus credenciales
cd backend

# Ejecutar migraciones (importar serenvoice.sql)
mysql -u root -p estudiantes_db < ../serenvoice.sql

# Entrenar modelos (opcional)
python train_models.py

# Iniciar servidor
python app.py
```

#### Frontend Web

```bash
cd proyectofinal-frontend

# Instalar dependencias
npEl .env ya está configurado en la raíz del proyecto
# Vite cargará automáticamente las variables VITE_* desde la raíz.env
cp .env.example .env
# Editar .env

# Iniciar servidor de desarrollo
npm run dev
```

#### Mobile App

```bash
cd proyectofinal-mobile

# Instalar dependencias
npm install

# Iniciar Expo
npm start

# Escanear QR con Expo Go app
```

---

## 📖 Uso

### 1. Registro e Inicio de Sesión

```javascript
// Ejemplo de registro
POST /api/auth/register
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "fecha_nacimiento": "1990-01-01"
}

// Ejemplo de login
POST /api/auth/login
{
  "email": "juan@example.com",
  "password": "password123"
}
```

### 2. Subir y Analizar Audio

```javascript
// Subir audio
POST /api/audio/upload
Content-Type: multipart/form-data
Headers: { Authorization: "Bearer <token>" }

FormData:
- audio: <archivo.wav>
- nombre_archivo: "mi_audio.wav"

// Analizar audio
POST /api/analisis/analyze
{
  "id_audio": 123
}
```

### 3. Obtener Resultados

```javascript
// Obtener análisis detallado
GET /api/analisis/{id_analisis}

// Obtener historial
GET /api/resultados/usuario/{id_usuario}?limit=10
```

---

## 📁 Estructura del Proyecto

```
SerenVoice/
├── backend/                      # Backend Flask
│   ├── app.py                   # Aplicación principal
│   ├── requirements.txt         # Dependencias Python
│   ├── Dockerfile              # Contenedor backend
│   ├── database/               # Configuración BD
│   ├── models/                 # Modelos de datos
│   │   ├── usuario.py
│   │   ├── audio.py
│   │   ├── analisis.py
│   │   ├── emotion_cnn.h5     # Modelo CNN entrenado
│   │   └── ...
│   ├── routes/                 # Rutas/Endpoints API
│   │   ├── auth_routes.py
│   │   ├── audio_routes.py
│   │   ├── analisis_routes.py
│   │   └── ...
│   ├── services/               # Lógica de negocio
│   │   ├── audio_service.py
│   │   ├── analisis_service.py
│   │   ├── groq_service.py
│   │   └── ...
│   └── utils/                  # Utilidades
│       ├── audio_processor.py
│       ├── feature_extractor.py
│       └── stress_detector.py
│
├── proyectofinal-frontend/      # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── context/            # Context API
│   │   ├── hooks/              # Custom hooks
│   │   └── App.jsx            # Componente principal
│   ├── Dockerfile
│   └── package.json
│
├── proyectofinal-mobile/        # App móvil Expo
│   ├── app/                    # Pantallas
│   ├── components/             # Componentes móviles
│   └── package.json
│
├── docker-compose.yml          # Orquestación Docker
├── serenvoice.sql             # Schema de base de datos
└── README.md                  # Este archivo
```

---

## 🔬 Características Técnicas

### Procesamiento de Audio

El sistema utiliza **Librosa** para extraer características acústicas avanzadas:

- **MFCC** (Mel-Frequency Cepstral Coefficients)
- **Chroma Features**
- **Spectral Centroid**
- **Spectral Rolloff**
- **Zero Crossing Rate**
- **Pitch y Harmonics**
- **Energy y RMS**

### Modelo de Machine Learning

- **Arquitectura**: Convolutional Neural Network (CNN)
- **Entrada**: Espectrogramas de audio
- **Salida**: Clasificación de emociones (7 clases)
- **Framework**: TensorFlow/Keras
- **Archivo del modelo**: `emotion_cnn.h5`

### Algoritmo de Detección de Estrés

Combina múltiples características:
1. Análisis de frecuencia fundamental (pitch)
2. Jitter y shimmer vocal
3. Velocidad de habla
4. Energía de la señal
5. Características espectrales

---

## 🧪 Testing

### Backend

```bash
cd backend
pytest tests/
```

### Frontend

```bash
cd proyectofinal-frontend
npm run test
```

---

## 🔐 Seguridad

- **Autenticación JWT** con tokens de acceso
- **Bcrypt** para hash de contraseñas
- **Validación de entrada** en todos los endpoints
- **CORS configurado** para orígenes permitidos
- **Límite de tamaño de archivo** (16MB)
- **Sanitización de nombres de archivo**
- **Variables de entorno** para secretos

---

## 👥 Equipo

Desarrollado con ❤️ por el equipo de SerenVoice

---

## 🙏 Agradecimientos

- **Librosa** - Procesamiento de audio
- **Groq** - API de IA para recomendaciones
- **Material-UI** - Componentes de interfaz
- **Expo** - Framework móvil
- **Flask** - Framework web

---