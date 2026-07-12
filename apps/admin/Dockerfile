FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS pruner
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
COPY . .
RUN pnpm add -g turbo@^2
RUN turbo prune admin --docker

FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .

ENV CI=true

ARG PUBLIC_SITE_TITLE
ARG PUBLIC_ADMIN_URL
ARG PUBLIC_API_URL

RUN npx turbo run build --filter=admin

FROM node:24-alpine AS runner
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
