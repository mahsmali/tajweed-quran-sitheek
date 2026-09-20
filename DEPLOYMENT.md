# Deploying Tajweed Engine

```bash
docker compose up -d --build
# → http://127.0.0.1:3000   (put TLS in front of it — see "The microphone")
```

That is the whole deployment. There is no database, no migration step and no
volume: the app holds no state. Every chapter is fetched from quran.com and
analysed per request, with the bundled Uthmani text as the offline fallback, so
a container can be replaced at any moment without losing anything.

---

## Why not a static export

`/api/chapter/[surah]` reads `reciter` and `locale` off `request.url`, which
makes it a dynamic route handler. `output: 'export'` cannot serve it, so this
needs a Node runtime. That is also the right call on the merits: the Tajweed
engine and the Arabic tables stay on the server instead of being shipped to
every reader.

---

## The Windows workarounds

This project was built on a Windows machine with **Application Control**
enabled, which blocks unsigned native binaries — including `next-swc` and
Turbopack. Two workarounds existed for that machine:

- `.babelrc`, whose mere presence made Next use the Babel transform.
  **Deleted.** It was never needed: when the native binary is blocked Next falls
  back to WASM SWC and the build completes fine. Removing it means local and
  production builds now run the same transform.
- `--webpack` in the `build` and `dev` scripts. **Still there**, because
  Turbopack has no WASM fallback — it genuinely cannot run on that machine.

Only the second one still needs handling, and the `Dockerfile` does it by
running `npx --no-install next build` rather than `npm run build`, so
`--webpack` is never passed inside the container.

`.dockerignore` keeps a defensive `.babelrc` entry so the file cannot creep back
into a build context if anyone re-adds it locally.

For the same reason the image installs with plain `npm ci`, not the README's
local `npm install --ignore-scripts`: that flag exists to stop a lifecycle
script from spawning a blocked binary, and skipping scripts in the container
would leave the platform-specific SWC and Turbopack binaries uninstalled.

---

## The microphone — put TLS in front of this

"Listen & repeat" calls `getUserMedia`, which browsers only grant in a **secure
context**. Serve this over plain http on a public address and the recorder is
dead for every visitor, with no error in your logs — the app will simply tell
them their address is the problem.

`compose.yaml` therefore publishes to `127.0.0.1:3000`, not `0.0.0.0`, so the
container cannot be exposed unencrypted by accident. Terminate TLS in front of
it:

```nginx
server {
  listen 443 ssl http2;
  server_name tajweed.example.com;

  ssl_certificate     /etc/letsencrypt/live/tajweed.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/tajweed.example.com/privkey.pem;

  location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Forwarded-Proto $scheme;   # Next generates https URLs from this
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   Upgrade           $http_upgrade;
    proxy_set_header   Connection        "upgrade";
  }
}
```

A real certificate also retires the whole `npm run dev:https` apparatus: that
proxy and its self-signed certificate exist **only** so a phone on the LAN can
reach a secure origin during development. `.dockerignore` keeps both the script
and `.certs/` out of the image.

---

## Health

`GET /api/health` → `{"status":"ok","uptimeSeconds":N}`, used by the Docker
healthcheck.

It deliberately touches no upstream. Probing `/api/chapter/1` instead would make
this service's health depend on quran.com being reachable, and that is the wrong
question: when the API is down the reader falls back to the bundled text and
stays usable, so an upstream outage must not cause an orchestrator to kill a
container that is working as designed.

---

## Upstream dependencies

Outbound only. Nothing needs to be allow-listed inbound beyond port 3000.

| Host | Used for | If unreachable |
|---|---|---|
| `api.quran.com` | Uthmani text, word timings, translations | bundled seed text, estimated timings, banner shown |
| `verses.quran.com`, `everyayah.com` | per-ayah recitation audio | playback unavailable |
| `audio.qurancdn.com` | isolated word clips | sliced from the verse audio |
| `fonts.googleapis.com` | Amiri Quran, Newsreader, Plus Jakarta Sans | falls back to local/system faces |
| `i.ytimg.com` | the lesson video thumbnail | facade shows its placeholder |

No API key is required and no secret needs to be configured.

---

## Resources

- **Build:** the peak is `next build`, which is why the builder stage sets
  `NODE_OPTIONS=--max-old-space-size=3072`. Give the build host **at least 4GB**
  or it will be OOM-killed in a way that looks like a random failure.
- **Runtime:** comfortable in 512MB.
- **Image:** the runner carries only Next's traced output — no toolchain, no
  full `node_modules`.

---

## Updating

```bash
git pull
docker compose up -d --build
```

The build runs in a new image; the running container is only replaced once it
has built. Roll back with the previous image tag if you tag your builds.

---

## Deploying elsewhere

**Vercel** — push the repo; it detects Next automatically. Drop `--webpack` from
the `build` script first (or set a custom build command of `next build`), and
note that `output: 'standalone'` in `next.config.ts` is ignored there (Vercel
does its own packaging), so it can stay.

**Bare Node on a VPS** — `npm ci && npx next build`, then run
`node .next/standalone/server.js` under systemd with `HOSTNAME=0.0.0.0` and
`PORT` set, copying `public/` and `.next/static/` beside it exactly as the
Dockerfile does. Same nginx block as above.
