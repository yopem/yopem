FROM oven/bun:alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @repo/admin --docker

FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .

ENV CI=true

ARG PUBLIC_SITE_TITLE
ARG PUBLIC_ADMIN_URL
ARG PUBLIC_API_URL

RUN bun x turbo run build --filter=@repo/admin

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:appgroup /app/apps/admin/.output ./.output
COPY --from=builder --chown=appuser:appgroup /app/apps/admin/public ./public

USER appuser

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", ".output/server/index.mjs"]
