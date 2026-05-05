FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime

LABEL org.opencontainers.image.title="bpmt-oauth-demo"
LABEL org.opencontainers.image.description="BPMT OAuth authorization-code demo"
LABEL org.opencontainers.image.source="https://github.com/wodenwang/bpmt-oauth-demo"
LABEL org.opencontainers.image.version="v1.0.0"
LABEL org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production
ENV PORT=81

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src
COPY views ./views
COPY public ./public
COPY scripts ./scripts

EXPOSE 81

CMD ["npm", "start"]
