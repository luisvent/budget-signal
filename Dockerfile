FROM node:22-alpine AS api

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8734 \
    BUDGET_SIGNAL_DATA_DIR=/data

WORKDIR /app

RUN mkdir -p /data && chown -R node:node /data /app

COPY --chown=node:node package.json ./package.json
COPY --chown=node:node apps/api/src ./apps/api/src

USER node

EXPOSE 8734

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8734/api/health || exit 1

CMD ["node", "apps/api/src/index.mjs"]

FROM node:22-alpine AS web-build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS web

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/dist/apps/web/browser /usr/share/nginx/html

EXPOSE 4210

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4210/ || exit 1