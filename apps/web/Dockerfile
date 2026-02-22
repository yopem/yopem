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
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_SITE_DOMAIN
ARG NEXT_PUBLIC_SITE_TITLE
ARG NEXT_PUBLIC_SITE_DESCRIPTION
ARG NEXT_PUBLIC_SITE_TAGLINE
ARG NEXT_PUBLIC_SUPPORT_EMAIL
ARG NEXT_PUBLIC_LOGO_URL
ARG NEXT_PUBLIC_LOGO_OG_URL
ARG NEXT_PUBLIC_LOGO_OG_WIDTH
ARG NEXT_PUBLIC_LOGO_OG_HEIGHT
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_UMAMI_TRACKING_ID
ARG NEXT_PUBLIC_FACEBOOK_USERNAME
ARG NEXT_PUBLIC_INSTAGRAM_USERNAME
ARG NEXT_PUBLIC_TIKTOK_USERNAME
ARG NEXT_PUBLIC_WHATSAPP_CHANNEL_USERNAME
ARG NEXT_PUBLIC_X_USERNAME
ARG NEXT_PUBLIC_YOUTUBE_USERNAME
ARG NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_API_URL

RUN bun x turbo run build --filter=@repo/web

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "apps/web/server.js"]
