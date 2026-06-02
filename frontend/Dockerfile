# =============================================================================
# Multi-stage Dockerfile for the React + Vite frontend.
# - builder  : install deps and produce /app/dist
# - runtime  : nginx:alpine serving the static bundle
# =============================================================================

FROM node:20-alpine AS builder
WORKDIR /app

# Allow the API URL to be injected at build time.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

RUN rm -rf /usr/share/nginx/html/* \
 && addgroup -S app 2>/dev/null || true \
 && adduser -S -G app app 2>/dev/null || true

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
