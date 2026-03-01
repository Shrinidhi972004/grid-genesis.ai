# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config — SPA fallback + caching
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
