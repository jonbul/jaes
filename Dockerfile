# Usar imagen oficial de Node LTS
FROM node:20-alpine

# Crear directorio de la app dentro del contenedor
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json primero (para cachear dependencias)
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código de la aplicación
COPY . .

# Exponer el puerto que tu app usará
# HTTPS
EXPOSE 80
EXPOSE 3000
# HTTP
EXPOSE 443
EXPOSE 3001

# Definir variable de entorno opcional
ENV NODE_ENV=production

# Comando para ejecutar la app
CMD ["node", "server.js"]
