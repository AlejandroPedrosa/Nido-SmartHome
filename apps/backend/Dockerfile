# ============================================================
# NIDO SmartHome — Imagen de producción del backend (NestJS)
# Multi-stage: compila con todas las dependencias y publica una
# imagen final liviana con solo lo necesario para ejecutar.
#
#   docker build -t nido-backend apps/backend
# ============================================================

# Misma versión mayor que .nvmrc
ARG NODE_VERSION=24

# --- 1) Dependencias completas (para compilar) ---------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- 2) Compilación TypeScript → dist/ -----------------------
FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# --- 3) Solo dependencias de producción ----------------------
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --- 4) Imagen final ------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
# Certificado raíz público de Supabase (DATABASE_SSL_CA_PATH=certs/supabase-ca.crt)
COPY --chown=node:node certs ./certs

# No ejecutar como root
USER node

EXPOSE 3000

# Docker marca el contenedor como "unhealthy" si /health deja de responder.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1

# Node como proceso principal recibe SIGTERM y cierra el pool de PostgreSQL
# gracias a enableShutdownHooks() en main.ts.
CMD ["node", "dist/main"]
