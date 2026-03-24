# ── Etapa: Desarrollo ───
FROM node:20-alpine

WORKDIR /app

# Instalar primero las dependencias (mejor almacenamiento en caché de capas)
COPY package*.json ./
RUN npm install

# Copiar origen (sobrescrito por el volumen en modo desarrollador)
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]