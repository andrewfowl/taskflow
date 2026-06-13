# Multi-stage build producing a small, self-hostable image.
# Build with:  docker build --build-arg BUILD_STANDALONE=true -t taskflow .
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile || pnpm install

# ── build ─────────────────────────────────────────────────────────────────────
FROM base AS build
ENV BUILD_STANDALONE=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate && pnpm build

# ── runtime ───────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
CMD ["node", "server.js"]
