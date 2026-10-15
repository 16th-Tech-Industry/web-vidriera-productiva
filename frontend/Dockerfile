# Tres etapas: Railway construye la última (producción); docker-compose usa
# la de desarrollo (target: desarrollo en docker-compose.yml).

# --- desarrollo: servidor de Vite con recarga en caliente ----------------
# Vite 8 exige Node ^20.19 o >=22.12 (con node:18 no arranca).
FROM node:22-slim AS desarrollo
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# --- compilacion: arma los archivos estáticos en dist/ -------------------
FROM desarrollo AS compilacion
# La URL del backend queda grabada en los archivos al compilar. En Railway
# se toma de la variable VITE_API_URL del servicio.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- produccion: solo los archivos compilados, servidos por Caddy --------
# Node y node_modules quedan en las etapas anteriores: la imagen final pesa
# unas decenas de MB en vez de cientos.
FROM caddy:2-alpine AS produccion
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=compilacion /app/dist /srv
