FROM oven/bun:alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @repo/web --docker

FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .

ENV CI=true

ARG PUBLIC_SITE_DOMAIN
ARG PUBLIC_SITE_TITLE
ARG PUBLIC_SITE_DESCRIPTION
ARG PUBLIC_SITE_TAGLINE
ARG PUBLIC_SUPPORT_EMAIL
ARG PUBLIC_LOGO_URL
ARG PUBLIC_LOGO_OG_URL
ARG PUBLIC_LOGO_OG_WIDTH
ARG PUBLIC_LOGO_OG_HEIGHT
ARG PUBLIC_GA_MEASUREMENT_ID
ARG PUBLIC_UMAMI_TRACKING_ID
ARG PUBLIC_FACEBOOK_USERNAME
ARG PUBLIC_INSTAGRAM_USERNAME
ARG PUBLIC_TIKTOK_USERNAME
ARG PUBLIC_WHATSAPP_CHANNEL_USERNAME
ARG PUBLIC_X_USERNAME
ARG PUBLIC_YOUTUBE_USERNAME
ARG PUBLIC_ADMIN_URL
ARG PUBLIC_API_URL

RUN bun x turbo run build --filter=@repo/web

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:appgroup /app/apps/web/.output ./.output
COPY --from=builder --chown=appuser:appgroup /app/apps/web/public ./public

USER appuser

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", ".output/server/index.mjs"]
