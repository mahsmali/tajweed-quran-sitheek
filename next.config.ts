import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * Emit `.next/standalone` — a self-contained server plus only the traced
   * `node_modules` each route actually reaches.
   *
   * This is what lets the Docker runner stage carry no `node_modules` install
   * of its own: the image ends up with the server, the traced dependencies and
   * the static assets, and nothing else. See `Dockerfile` and `DEPLOYMENT.md`.
   */
  output: 'standalone',
  /**
   * Allow the dev server's HMR + chunk assets to be fetched from the LAN
   * address as well as localhost, so the reader can be tested on a phone
   * (where the Arabic line breaking and the mic recorder behave differently).
   */
  allowedDevOrigins: ['192.168.1.48', '127.0.0.1', 'localhost'],
  // Upstream Quran text/audio CDNs used by the automated ingestion pipeline.
  async headers() {
    return [
      {
        /**
         * Every API route EXCEPT the health probe.
         *
         * This rule wins over whatever a route handler sets on itself, so a
         * bare `/api/:path*` was stamping `s-maxage=86400` onto `/api/health`
         * and overriding its `no-store`. Directly against the container that is
         * harmless — Docker's healthcheck talks to it with no cache in between
         * — but behind the CDN or reverse proxy that DEPLOYMENT.md tells you to
         * put in front, an uptime monitor would have gone on reading a cached
         * 200 for a day after the app stopped answering. A day-long cache is
         * right for analysed chapter data and wrong for liveness.
         */
        source: '/api/:path((?!health).*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=86400' }],
      },
      {
        /**
         * The service worker must never be served from a cache.
         *
         * Browsers re-fetch `/sw.js` to decide whether a new version exists,
         * and `public/` is otherwise served with long-lived caching. Left
         * alone, a deploy would ship a new worker that nobody's browser asks
         * for — the old one keeps answering from the old caches, and the
         * update is invisible until the HTTP cache happens to expire. This is
         * the single header that makes the version bump in `sw.js` mean
         * anything.
         *
         * `Service-Worker-Allowed` is what lets a worker served from any path
         * claim the root scope; it registers at `/sw.js` today, so this is
         * belt and braces rather than load-bearing.
         */
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
