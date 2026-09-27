# ── Stage 1: Instalar dependencias ────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Instalar openssl para Prisma
RUN apk add --no-cache openssl

# Copiar manifiestos de dependencias
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (incluyendo devDeps para prisma CLI)
RUN npm ci

# Generar el Prisma Client
RUN npx prisma generate

# ── Stage 2: Producción ────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Instalar curl, dos2unix y openssl para healthchecks, conversión de line endings y Prisma
RUN apk add --no-cache curl dos2unix openssl

WORKDIR /app

ENV NODE_ENV=production

# Copiar dependencias instaladas y el Prisma client generado
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copiar el código fuente
COPY src ./src
COPY prisma ./prisma
COPY package.json ./
COPY docker-entrypoint.sh ./

# Convertir line endings (Windows CRLF → Unix LF) y dar permisos al script
RUN dos2unix docker-entrypoint.sh && chmod +x docker-entrypoint.sh

# Crear directorio de uploads local (fallback sin S3)
RUN mkdir -p /app/uploads

# Usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

ENTRYPOINT ["sh", "docker-entrypoint.sh"]
