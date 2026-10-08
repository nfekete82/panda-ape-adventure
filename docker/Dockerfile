FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/game/package.json apps/game/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS server
ENV NODE_ENV=production PORT=3001 SAVE_DIR=/app/data
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/apps/game/package.json apps/game/package.json
COPY --from=build /app/apps/server/package.json apps/server/package.json
COPY --from=build /app/packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev && mkdir data && chown node:node data
COPY --from=build --chown=node:node /app/apps/server/dist apps/server/dist
COPY --from=build --chown=node:node /app/packages/shared/dist packages/shared/dist
USER node
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s CMD node -e "fetch('http://127.0.0.1:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/server/dist/index.js"]

FROM nginxinc/nginx-unprivileged:stable-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/game/dist /usr/share/nginx/html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1

FROM build AS development
RUN chown -R node:node /app
USER node
CMD ["npm", "run", "dev"]
