FROM oven/bun:1 AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# --- Builder ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL
ARG AUTH_SECRET
ARG BETTER_AUTH_URL
ARG NEXT_PUBLIC_APP_URL
ARG DB_DRIVER=pg

ENV DATABASE_URL=$DATABASE_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV DB_DRIVER=$DB_DRIVER

RUN bun run build

# --- Runner ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
