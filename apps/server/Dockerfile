FROM oven/bun:alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @repo/server --docker

FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .

ENV NODE_ENV=production
ENV APP_ENV=production

RUN addgroup --system --gid 1001 honojs
RUN adduser --system --uid 1001 hono

USER hono

EXPOSE 4000
ENV SERVER_PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "apps/server/src/index.ts"]
