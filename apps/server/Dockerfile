FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS pruner
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
COPY . .
RUN pnpm add -g turbo@^2
RUN turbo prune server --docker

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter server exec tsdown src/index.ts --outdir dist --minify --external sharp

FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat vips

WORKDIR /app

RUN addgroup --system --gid 1001 honojs && \
  adduser --system --uid 1001 hono

COPY --from=builder /app/dist/index.js ./index.js

RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN pnpm add sharp@^0.34.2

USER hono

ENV NODE_ENV=production
ENV APP_ENV=production

EXPOSE 4000
ENV SERVER_PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "index.js"]
