FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
  PORT=8734 \
    BUDGET_SIGNAL_DATA_DIR=/data

WORKDIR /app

RUN mkdir -p /data && chown -R node:node /data /app

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/dist ./dist

USER node

EXPOSE 8734

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8734/api/health || exit 1

CMD ["node", "server/index.mjs"]