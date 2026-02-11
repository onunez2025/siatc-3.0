# Dockerfile para el Backend (Node.js/Express)
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Puerto de la aplicación
EXPOSE 3001

# Comando de inicio
CMD ["node", "index.js"]
