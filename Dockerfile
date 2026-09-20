# syntax=docker/dockerfile:1

# =============================================================================
#  Tajweed Engine — production image
# =============================================================================
#  Three stages, so the thing that ships carries neither the toolchain nor a
#  full `node_modules`: install, build, then copy only Next's traced output.
#
#  WHY DEBIAN SLIM AND NOT ALPINE
#  ------------------------------
#  Next 16 builds through Turbopack, which is a native Rust binary. Both musl
#  and glibc builds of it exist, so Alpine does work — but every native
#  dependency added later has to keep working on musl too, and the saving is
#  ~30MB on an image whose Next runtime dwarfs it. Debian slim is the boring
#  choice and boring is correct for a base image.
# =============================================================================

ARG NODE_VERSION=22-bookworm-slim

# ── deps ─────────────────────────────────────────────────────────────────────
# Split from the build so a source-only change reuses the installed layer.
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# `npm ci` — not `npm install` — so the lockfile is authoritative and the build
# is reproducible. Note this is a deliberate departure from the README's local
# `npm install --ignore-scripts`: that flag exists only because this project was
# developed on a Windows machine whose Application Control policy blocks
# unsigned native binaries. Inside the container nothing is blocked, and
# skipping lifecycle scripts here would leave the platform-specific SWC and
# Turbopack binaries uninstalled.
COPY package.json package-lock.json ./
RUN npm ci

# ── build ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# `next build` is memory-hungry on a project this size; the default heap on a
# small build host is not always enough, and the failure looks like a random
# OOM kill rather than anything to do with the build.
ENV NODE_OPTIONS=--max-old-space-size=3072

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `npx next build`, not `npm run build`.
#
# The package.json script passes `--webpack`, which exists only because the
# Application Control policy on the development machine stops Turbopack's native
# binary from loading. That does not apply in here, so this stage takes the
# default path — Turbopack and SWC — which is faster and is what Next 16 is
# actually tested against.
#
# (`.babelrc`, the other half of that workaround, has been deleted from the
# repository; `.dockerignore` still excludes it defensively, because its mere
# presence would silently force the Babel transform.)
RUN npx --no-install next build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Without this the standalone server binds to localhost inside the container and
# nothing outside it can connect — the single most common way this image looks
# broken while the logs say "ready".
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# `output: 'standalone'` (see next.config.ts) emits a server with only the
# node_modules each route actually reaches. It deliberately does NOT copy
# `public` or `.next/static`, on the assumption that a CDN serves them — with no
# CDN here, they are copied in beside it and the server picks them up.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Node 22 has a global fetch, so this needs no curl in the image.
# `--start-period` is generous because the first request compiles nothing but
# the process still has to come up on a cold, possibly throttled host.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
