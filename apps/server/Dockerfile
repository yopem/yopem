FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN cd apps/server && bun build src/index.ts --outdir dist --target bun

FROM oven/bun:1-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 honojs && \
  adduser --system --uid 1001 hono

COPY --from=build /app/apps/server/dist/index.js ./index.js

USER hono

ENV NODE_ENV=production

EXPOSE 4000
ENV SERVER_PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "index.js"]
