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
    ];
  },
};

export default nextConfig;
