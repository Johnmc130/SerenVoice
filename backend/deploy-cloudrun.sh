#!/bin/bash
# ============================================
# Script de Despliegue a Google Cloud Run
# SerenVoice Backend
# ============================================

# Variables
PROJECT_ID="boreal-dock-481001-k0"
REGION="us-central1"
SERVICE_NAME="serenvoice-backend"

echo "==================================="
echo "Desplegando SerenVoice Backend"
echo "Proyecto: $PROJECT_ID"
echo "Region: $REGION"
echo "==================================="

# Construir y desplegar
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --timeout 300 \
  --set-env-vars "FLASK_ENV=production" \
  --set-env-vars "DB_HOST=TU_HOST_DE_BD" \
  --set-env-vars "DB_USER=TU_USUARIO" \
  --set-env-vars "DB_PASSWORD=TU_PASSWORD" \
  --set-env-vars "DB_NAME=serenvoice" \
  --set-env-vars "DB_PORT=3306" \
  --set-env-vars "JWT_SECRET_KEY=$(openssl rand -hex 32)"

echo ""
echo "==================================="
echo "Despliegue completado!"
echo "==================================="
