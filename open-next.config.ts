import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext's Cloudflare adapter config.
 *
 * The defaults are right for this app, so this is deliberately bare. Two
 * choices are worth stating explicitly, because their absence is the
 * interesting part:
 *
 * NO INCREMENTAL CACHE BINDING
 * ----------------------------
 * `/api/chapter/[surah]` declares `revalidate = 86400`. With no cache adapter
 * that revalidation is per-isolate rather than shared: each isolate that has
 * not seen a surah fetches it from quran.com once and holds it. For a reader
 * app serving a fixed set of surahs that is perfectly serviceable, and it keeps
 * the deployment to a single Worker with no storage to provision. Adding R2
 * later is a two-line change — see CLOUDFLARE.md.
 *
 * NO IMAGE LOADER
 * ---------------
 * Nothing in this app uses `next/image`. The YouTube thumbnail and the brand
 * logo are plain `<img>` tags by design (the thumbnail is remote with a runtime
 * fallback, the logo is a fixed-size asset), so there is no image optimisation
 * pipeline to replace and none of the usual Workers image-loader setup applies.
 */
const config = defineCloudflareConfig();

/**
 * Build with `next build` directly — NOT `npm run build`.
 *
 * OpenNext's default is `npm run build`, and this project's `build` script is
 * `node --max-old-space-size=3072 ./node_modules/next/dist/bin/next build
 * --webpack`. That `--webpack` exists only because Application Control on the
 * Windows development machine blocks Turbopack's native binary; on Cloudflare's
 * Linux builders nothing is blocked, and opting out of the default bundler
 * there is pure loss.
 *
 * The companion workaround, `.babelrc`, has been deleted outright: it forced
 * the Babel transform by its mere presence, which no build command could have
 * overridden. Next falls back to WASM SWC when the native binary is blocked, so
 * it was never actually needed. See CLOUDFLARE.md.
 */
config.buildCommand = 'npx --no-install next build';

export default config;
