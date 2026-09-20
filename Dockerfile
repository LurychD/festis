# ==========================================
# Etapa 1: Construcción (Builder)
# ==========================================
FROM node:20-alpine AS builder

# Directorio de trabajo
WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para compilar Vite y esbuild)
RUN npm install

# Copiar el código fuente completo
COPY . .

# Generar la compilación de producción (Vite + Bundling del servidor con esbuild a dist/server.cjs)
RUN npm run build

# Depurar dependencias de desarrollo conservando únicamente las de producción
RUN npm prune --omit=dev

# ==========================================
# Etapa 2: Ejecución en Producción (Runner)
# ==========================================
FROM node:20-alpine AS runner

# Directorio de trabajo
WORKDIR /app

# Variables de entorno para producción
ENV NODE_ENV=production
ENV PORT=3000

# Copiar manifiestos de dependencias y módulos compilados desde la etapa de construcción
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copiar artefactos compilados desde la etapa de construcción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Exponer el puerto interno configurado en fly.toml (3000)
EXPOSE 3000

# Comando para iniciar el servidor compilado de Node.js
CMD ["node", "dist/server.cjs"]
