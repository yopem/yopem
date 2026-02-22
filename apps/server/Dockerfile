FROM oven/bun:alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @repo/server --docker

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN bun build apps/server/src/index.ts --outdir dist --target bun --minify --external sharp

FROM oven/bun:alpine AS runner
RUN apk add --no-cache libc6-compat vips

WORKDIR /app

RUN addgroup --system --gid 1001 honojs && \
    adduser --system --uid 1001 hono

COPY --from=builder /app/dist/index.js ./index.js

RUN bun add sharp@^0.34.2

USER hono

ENV NODE_ENV=production
ENV APP_ENV=production

EXPOSE 4000
ENV SERVER_PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "index.js"]
