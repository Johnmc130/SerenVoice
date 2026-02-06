# Dockerfile optimizado para Google Cloud Run
FROM python:3.11-slim

# Invalidar caché en cada build
ARG CACHE_BUST=2026-02-02-00-45

# Instalar ffmpeg para soportar formatos de audio
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Configurar UTF-8 y Python
ENV PYTHONIOENCODING=utf-8
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copiar requirements primero para aprovechar cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar gunicorn para producción
RUN pip install gunicorn

# Copiar código a /app/backend para mantener estructura de imports
COPY . ./backend/

# Crear directorio uploads
RUN mkdir -p /app/uploads

# Puerto para producción
ENV PORT=5000
ENV PYTHONPATH=/app
EXPOSE 5000

# Ejecutar con gunicorn desde el módulo correcto
CMD exec gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 300 backend.app:app
