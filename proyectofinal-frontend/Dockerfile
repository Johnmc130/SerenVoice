# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción con la URL del backend
ARG VITE_API_URL=https://serenvoice-backend-11587771642.us-central1.run.app
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de nginx para SPA
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
