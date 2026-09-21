/* eslint-disable no-restricted-globals */
/**
 * ============================================================================
 *  TAJWEED ENGINE — SERVICE WORKER
 * ============================================================================
 *  What this buys: a learner who opened the site once can open it again on a
 *  plane, on a train, or on the half-bar of signal a mosque basement gives
 *  them, and still get the reader, the 30-day roadmap and the quiz. It is also
 *  the second half of the installability contract — a browser will not offer
 *  "Install" for a manifest alone; it wants a service worker with a fetch
 *  handler behind it.
 *
 *  FIVE ROUTES, FIVE STRATEGIES
 *  ----------------------------
 *  Nothing here is a blanket "cache everything". Each class of request gets
 *  the strategy that matches what going stale would cost:
 *
 *    navigations      network-first  fresh pages when online; the last good
 *                                    copy, then /offline, when not.
 *    /_next/static/*  cache-first    content-hashed filenames, so a hit is
 *                                    always correct and a miss is a new build.
 *    Google Fonts     cache-first    the Arabic face is ~200KB and never
 *                                    changes under a given URL.
 *    /api/chapter/*   stale-while-   the analysed, colour-coded verses. Serve
 *                     revalidate     instantly from cache, refresh behind.
 *    recitation audio cache-first    with Range served from the stored body;
 *                     (+ range)      see RANGE REQUESTS below.
 *
 *  Everything else — /api/health above all — is left alone and goes straight
 *  to the network. A liveness probe answered from a cache is not a probe.
 *
 *  RANGE REQUESTS
 *  --------------
 *  `new Audio()` asks for media with `Range: bytes=0-`, and the Cache API
 *  refuses to store the 206 that comes back. So audio is fetched a second
 *  time without the Range header, the whole 200 is stored, and any Range the
 *  element asks for afterwards is sliced out of that stored body here. This is
 *  the one place the worker synthesises a response rather than passing one
 *  through, and it is what makes a verse playable offline once heard.
 *
 *  Slicing needs a readable body, which means a CORS fetch, which the audio
 *  CDNs are under no obligation to allow — the app's own `<audio>` elements
 *  never ask them to. So every failure in that path falls through to the plain
 *  network request that would have happened with no worker at all. Offline
 *  audio is a bonus this can win or lose; it is never a regression.
 *
 *  UPDATES
 *  -------
 *  Bump `VERSION`. `install` claims immediately and `activate` deletes every
 *  cache whose name does not carry the current version, so a deploy cannot
 *  leave a learner pinned to last week's bundle. `next.config.ts` sends this
 *  file with `no-store`, which is what lets the browser notice the bump.
 */

const VERSION = 'v1';
const SHELL = `tajweed-shell-${VERSION}`;
const STATIC = `tajweed-static-${VERSION}`;
const DATA = `tajweed-data-${VERSION}`;
const AUDIO = `tajweed-audio-${VERSION}`;
const CURRENT = [SHELL, STATIC, DATA, AUDIO];

/** Where the app can be entered, plus the page shown when a route was never visited. */
const OFFLINE_URL = '/offline';
const PRECACHE = [
  '/',
  '/curriculum',
  '/quiz',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/famico.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
];

/**
 * Recitation comes from three CDNs, none of them ours. They are listed rather
 * than matched on `destination === 'audio'` so that a stray media element
 * somewhere else on the page can never fill the cache.
 */
const AUDIO_HOSTS = ['verses.quran.com', 'audio.qurancdn.com', 'everyayah.com'];

/** Roughly a juz' of verse audio. Past this the oldest entries are dropped. */
const AUDIO_MAX_ENTRIES = 240;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // `reload` so a precache never picks up a stale HTTP-cached copy of a
      // page, and one unreachable URL never fails the whole install.
      await Promise.allSettled(
        PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith('tajweed-') && !CURRENT.includes(n))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') void self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET is cacheable, and only http(s) — a `chrome-extension://` request
  // reaching `cache.put` throws.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (AUDIO_HOSTS.includes(url.hostname)) {
    event.respondWith(handleAudio(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/_next/static/')) {
      event.respondWith(cacheFirst(request, STATIC));
      return;
    }
    if (url.pathname.startsWith('/api/chapter/')) {
      event.respondWith(staleWhileRevalidate(request, DATA));
      return;
    }
    // Icons, the logo lockups, the manifest: small, stable, and needed by the
    // install prompt itself.
    if (/\.(png|svg|ico|webmanifest)$/.test(url.pathname)) {
      event.respondWith(staleWhileRevalidate(request, SHELL));
      return;
    }
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, STATIC));
  }
});

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

/**
 * Network first, because a cached HTML page pins the learner to the JS bundle
 * it references, and a deploy would then be invisible until the cache expired.
 * Offline, the last good copy of *this* page is tried before /offline, so a
 * route already visited comes back in full rather than as an apology.
 */
async function handleNavigation(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(request, { ignoreSearch: true })) ??
      (await cache.match(OFFLINE_URL)) ??
      Response.error()
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  // `type === 'opaque'` is the Google Fonts case: a no-cors stylesheet or font
  // has status 0 and cannot be inspected, but it can be stored and replayed.
  if (response.ok || response.type === 'opaque') {
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Analysed chapter data: hand over whatever is stored immediately, and refresh
 * it in the background. The colour coding for a surah is derived from the
 * Uthmani text and does not change between deploys, so a stale read is
 * indistinguishable from a fresh one — but the wait for the upstream Qur'an
 * API very much is.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (hit) {
    // Not awaited: the point of the strategy is that the refresh never blocks.
    void network;
    return hit;
  }
  const response = await network;
  return response ?? Response.error();
}

/**
 * Cache-first audio, with the Range dance described at the top of the file.
 * The stored entry is always the complete file keyed by URL alone, so one
 * download satisfies every subsequent seek.
 */
async function handleAudio(request) {
  const cache = await caches.open(AUDIO);
  // A CORS request, because the body has to be *readable* to be sliced. The
  // app itself only ever uses `<audio src>`, which is no-cors and needs no
  // permission from the CDN — so this may well be refused, and every failure
  // path below ends at the plain network fetch that would have happened with
  // no worker installed at all. Caching audio is a bonus; never a regression.
  const key = new Request(request.url, { mode: 'cors', credentials: 'omit' });
  let full = await cache.match(key);

  if (!full) {
    try {
      // Deliberately not `request`: it carries the Range header, and a 206 is
      // not storable. Ask for the whole thing once instead.
      const response = await fetch(key);
      if (response.ok) {
        await cache.put(key, response.clone());
        await trimCache(AUDIO, AUDIO_MAX_ENTRIES);
        full = response;
      }
    } catch {
      /* no CORS, or no network — fall through */
    }
  }

  if (full) {
    try {
      return await sliceRange(request, full);
    } catch {
      /* a malformed stored entry must not take the verse down with it */
    }
  }

  return fetch(request);
}

/**
 * Turn a stored 200 into the 206 the media element asked for.
 * Returns the whole body untouched when there was no Range header.
 */
async function sliceRange(request, response) {
  const range = request.headers.get('range');
  if (!range) return response;

  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) return response;

  const buffer = await response.clone().arrayBuffer();
  const size = buffer.byteLength;
  const start = match[1] === '' ? size - Number(match[2]) : Number(match[1]);
  const end = match[1] === '' || match[2] === '' ? size - 1 : Number(match[2]);

  if (!Number.isFinite(start) || start < 0 || start >= size || end < start) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${size}` },
    });
  }

  const slice = buffer.slice(start, end + 1);
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(slice.byteLength));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(slice, { status: 206, statusText: 'Partial Content', headers });
}

/** Oldest-first eviction. `cache.keys()` returns insertion order. */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
}
