# syntax=docker/dockerfile:1.7
#
# Nexa CRM SPA — built as static files (Vite), then served by nginx. No
# Node.js process is kept alive at runtime, which removes the single largest
# memory consumer from the stack.
#
# The API base URL is compiled into the bundle. /api/v1 (the default) keeps
# the browser on the same origin, so nginx can proxy to php-fpm without CORS.

FROM node:22-alpine AS build

WORKDIR /app

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Dependencies first so npm ci layers with package-lock.json are cached.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run build

FROM nginx:1.28-alpine AS runtime

COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80
