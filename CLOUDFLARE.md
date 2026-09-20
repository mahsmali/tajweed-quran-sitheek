# Deploying to Cloudflare Workers

```bash
npm install
npm run cf:preview     # build + run it locally on workerd, exactly as deployed
npm run cf:deploy      # build + push to Cloudflare
```

Next.js does not run on Cloudflare unmodified — Workers execute on **workerd**,
not Node. [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) builds
the app normally and then rewrites the server output into a Worker.

| File | What it is |
|---|---|
| `open-next.config.ts` | the adapter's config, and the build-command override |
| `wrangler.jsonc` | the Worker: entry point, compatibility flags, static assets |
| `cf:*` scripts in `package.json` | build / preview / deploy / typegen |

Version support is real, not assumed: `@opennextjs/cloudflare@1.20.6` declares
`next: ">=15.5.24 <16 || >=16.3.3"`, and this project is on **16.3.5**.

---

## The Windows workarounds, and why they no longer leak

This project was developed on a Windows machine with **Application Control**
enabled, which blocks unsigned native binaries. Three workarounds existed for
that machine; none of them reaches Cloudflare's builders any more:

| Workaround | Why it existed | Status |
|---|---|---|
| `.babelrc` | `next-swc` is blocked | **deleted** — Next falls back to WASM SWC, which works |
| `--webpack` in `npm run build` | Turbopack's binary is blocked | overridden by `buildCommand` in `open-next.config.ts` |
| `npm install --ignore-scripts` | a lifecycle script spawns a blocked binary | local only; CI uses plain `npm ci` |

`.babelrc` was the dangerous one, because **its mere presence makes Next use the
Babel transform** whatever build command runs — the `buildCommand` override
could not have saved you from it. It turned out to be unnecessary even locally:
when the native binary is blocked, Next loads **WASM SWC bindings** instead and
the build completes (verified on the original machine: `✓ Compiled successfully
in 18.4s`, full build 151s). Deleting it means local and Cloudflare builds now
run the same transform, which is the real win.

Nothing to do before your first build.

---

One workaround does remain, and it is local-only: `npm run build` still passes
`--webpack`, because Turbopack needs the native binary that the policy blocks.
`open-next.config.ts` overrides the build command so Cloudflare gets the default
bundler.

---

## Deploying from a zip

Cloudflare has no "upload a zip" path for a Next.js Worker — the app has to be
**built**, and the build produces a Worker plus an assets directory that
`wrangler` uploads. So the zip contains **source**, and you build from it:

```bash
unzip tajweed-engine-cloudflare.zip -d tajweed
cd tajweed
npm install
npx wrangler login
npm run cf:deploy
```

Or connect the repository under **Workers & Pages → Create → Connect to Git**
and set:

- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx wrangler deploy`

---

## What runs where

| Route | How it is served |
|---|---|
| `/`, `/quiz`, `/curriculum`, `/curriculum/1…30` | prerendered, served from Cloudflare's edge as static assets — the Worker never wakes |
| `/icon.png`, `/rahmah-logo.png`, `/famico.png` | static assets |
| `/api/chapter/[surah]` | the Worker: fetches quran.com and runs the Tajweed engine |
| `/api/health` | the Worker, `no-store` |

The 30 curriculum pages come from `generateStaticParams`, so the great majority
of traffic costs no Worker invocation at all.

---

## Two limits worth knowing before you deploy

**Worker size.** Compressed, a Worker may be **3 MiB on the free plan** and 10
MiB on paid. A Next server bundle plus this app's payload — the bundled Uthmani
seed text (~190 KB of source), the three i18n dictionaries, the 30-day
curriculum and the rule tables — is not obviously under 3 MiB. `npm run
cf:build` prints the final size; if it exceeds the free limit, that is a plan
question, not a code bug.

**CPU time.** 10 ms per request on the free plan, 30 s on paid. `/api/chapter/1`
is fine, but `/api/chapter/2` analyses 286 verses character by character in one
request, and that is the call most likely to be cut short on the free plan. If
you serve long surahs, be on paid.

---

## Caching: the deliberate omission

`/api/chapter/[surah]` sets `revalidate = 86400`, and `wrangler.jsonc`
configures **no incremental cache binding**. Each Worker isolate therefore
fetches a surah from quran.com once and keeps it for its own lifetime — correct
behaviour, but not shared between isolates.

To make it global, create an R2 bucket and bind it:

```ts
// open-next.config.ts
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';

const config = defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
```

```jsonc
// wrangler.jsonc
"r2_buckets": [
  { "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "tajweed-cache" }
]
```

---

## The microphone

Nothing to do. Workers are HTTPS-only, so "Listen & repeat" has the secure
context `getUserMedia` requires, and the app's insecure-origin banner correctly
stays silent. `npm run dev:https` and `.certs/` exist purely so a phone on the
LAN can reach a secure origin **during local development**; neither is in the
deployment.

---

## Building on the development machine

`npm run cf:build` **fails on the Windows machine this was written on**:

```
Error: An Application Control policy has blocked this file.
\\?\…\node_modules\@ast-grep\napi-win32-x64-msvc\ast-grep-napi.win32-x64-msvc.node
```

The adapter uses `@ast-grep/napi` to patch the Next server, and that native
binary is blocked by the same policy that blocks `next-swc`, Turbopack and
`esbuild`. It is a property of that machine, not of the configuration — the
build runs normally on Cloudflare's builders, in CI, or on any machine without
the policy. **The Cloudflare build has therefore not been verified end to end
here**; the configuration has been typechecked and the version support confirmed
against the adapter's own peer range.

---

## Also in this repository

`Dockerfile`, `compose.yaml` and `DEPLOYMENT.md` describe a self-hosted Node
deployment. They are independent of this one — keep whichever you use. Note that
`output: 'standalone'` in `next.config.ts` is there for Docker; the Cloudflare
adapter sets standalone mode itself (`NEXT_PRIVATE_STANDALONE`), so leaving it
set is harmless for both.
