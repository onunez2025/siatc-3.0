# Dockerfile para el Frontend (Angular)
# Multi-stage build: primero compila, luego sirve con nginx

# Stage 1: Build Angular
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Stage 2: Servir con Nginx
FROM nginx:alpine

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Puerto
EXPOSE 80

# Nginx en foreground
CMD ["nginx", "-g", "daemon off;"]
