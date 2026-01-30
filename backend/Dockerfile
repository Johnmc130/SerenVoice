# Dockerfile optimizado para Google Cloud Run
FROM python:3.11-slim

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

# Copiar todo el código a /app/backend para mantener estructura de imports
COPY . ./backend/

# Crear symlinks para que los imports funcionen desde ambas rutas
RUN ln -s /app/backend/app.py /app/app.py && \
    ln -s /app/backend/database /app/database && \
    ln -s /app/backend/models /app/models && \
    ln -s /app/backend/routes /app/routes && \
    ln -s /app/backend/services /app/services && \
    ln -s /app/backend/utils /app/utils && \
    ln -s /app/backend/extensions.py /app/extensions.py

# Crear directorio uploads
RUN mkdir -p /app/backend/uploads /app/uploads

# Puerto que usa Cloud Run
ENV PORT=8080
ENV PYTHONPATH=/app:/app/backend
EXPOSE 8080

# Ejecutar con gunicorn
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 300 app:app
