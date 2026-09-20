import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * A liveness probe for the container healthcheck and for whatever sits in front
 * of it. Deliberately the cheapest thing in the app: it touches no upstream and
 * allocates nothing.
 *
 * It exists because the obvious alternative — probing `/api/chapter/1` — makes
 * the health of this service depend on quran.com being reachable. That is the
 * wrong question. The reader degrades to the bundled Uthmani text when the API
 * is down and stays perfectly usable, so an upstream outage must not make an
 * orchestrator kill and restart a container that is working exactly as designed.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  // `process.uptime` is a Node API. It is there under Docker, and under
  // Cloudflare's `nodejs_compat` it is polyfilled — but a probe is the one
  // endpoint that must never be the thing that breaks, and "uptime" means very
  // little on a Worker isolate that is created and discarded per burst of
  // traffic anyway. So it is reported when available and omitted when not,
  // rather than being allowed to throw inside a healthcheck.
  const uptimeSeconds =
    typeof process !== 'undefined' && typeof process.uptime === 'function'
      ? Math.round(process.uptime())
      : null;

  return NextResponse.json(
    { status: 'ok', uptimeSeconds },
    { headers: { 'cache-control': 'no-store' } },
  );
}
