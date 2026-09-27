# ── Stage 1: Build de la app React ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build args para que Vite los incluya en el bundle
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar código fuente y buildear
COPY . .
RUN npm run build

# ── Stage 2: Nginx para servir el build ───────────────────────────────────
FROM nginx:alpine AS runner

# Copiar configuración de Nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el build de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
