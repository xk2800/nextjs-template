# Docs site image. Build context is this docs/ directory
# (Dokploy: Docker Context Path = "docs", Dockerfile Path = "docs/Dockerfile").
# All stages are Debian (glibc) so native deps installed by bun (sharp,
# pagefind) match the runtime.

# --- Dependencies ---
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY scripts/ ./scripts/
RUN bun install --frozen-lockfile

# --- Builder ---
# Built with Node, not Bun: next build under Bun's runtime has crashed before
# (see the root Dockerfile).
FROM node:22-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next build --webpack + pagefind search index (public/_pagefind)
RUN npm run build

# --- Runner ---
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# public/ holds the search index; without it the search box fails to load
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
