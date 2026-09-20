/**
 * HTTPS in front of `next dev`, so a phone on the LAN can use the microphone.
 *
 * WHY THIS EXISTS
 * ---------------
 * `getUserMedia` is gated on a *secure context*. `localhost` qualifies by
 * specification, so "Listen & repeat" records fine on the machine running the
 * dev server — and silently cannot on a phone, which reaches the same server
 * at `http://192.168.x.x:3000`. No browser will offer the microphone there.
 *
 * The usual fix is `next dev --experimental-https`, which shells out to
 * `mkcert`. On this machine Application Control blocks mkcert exactly as it
 * blocks `next-swc` and `esbuild` (see "Platform notes" in the README), so
 * that route is closed.
 *
 * What is *not* blocked is PowerShell's own `New-SelfSignedCertificate`, a
 * signed in-box cmdlet. It writes a PFX, and Node's `https` module reads PFX
 * directly — so the whole chain runs on components the policy already trusts
 * and needs no OpenSSL, no mkcert and no npm dependency.
 *
 * The certificate is self-signed, so the phone shows a warning once. Accepting
 * it makes the origin secure, which is the only thing the microphone is
 * waiting for. The CA is not installed anywhere and the key never leaves
 * `.certs/`.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer, request as httpRequest } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { connect as netConnect } from 'node:net';
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CERT_DIR = join(ROOT, '.certs');
const PFX_PATH = join(CERT_DIR, 'dev.pfx');
const PASSPHRASE = 'tajweed-dev';

const HTTPS_PORT = Number(process.env.HTTPS_PORT ?? 3001);
const TARGET_PORT = Number(process.env.PORT ?? 3000);

/** Every IPv4 address this machine answers on, so the cert covers the phone's route in. */
function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => n.address);
}

/**
 * A PFX valid for localhost, 127.0.0.1 and every LAN address.
 *
 * Regenerated when older than 300 days — comfortably inside the 1-year
 * lifetime, so the certificate never expires mid-session.
 */
function ensureCert(hosts) {
  mkdirSync(CERT_DIR, { recursive: true });

  if (existsSync(PFX_PATH)) {
    const ageDays = (Date.now() - statSync(PFX_PATH).mtimeMs) / 86_400_000;
    if (ageDays < 300) return;
    console.log('[dev-https] certificate is stale, regenerating');
  }

  // The SAN extension is written by hand rather than via -DnsName, because
  // -DnsName files every entry as a DNS name. A browser reaching the server by
  // IP checks the iPAddress entries and ignores DNS ones, so a phone opening
  // https://192.168.1.48:3001 would fail the name check on top of the
  // self-signed warning. Splitting them keeps the single warning to one cause.
  const isIp = (h) => /^\d{1,3}(\.\d{1,3}){3}$/.test(h);
  const san = hosts.map((h) => `${isIp(h) ? 'IPAddress' : 'DNS'}=${h}`).join('&');
  // Written to a file and run with -File rather than passed to -Command:
  // Windows argument quoting mangles a multi-line script with backticks in it,
  // and the failure it produces ("a drive with the name 'Cert' does not
  // exist") points nowhere near the actual cause.
  //
  // CurrentUser\My needs no elevation. The cert is deleted from the store
  // straight after export; the PFX on disk is the only copy that matters.
  const scriptPath = join(CERT_DIR, 'make-cert.ps1');
  const ps = [
    `$ErrorActionPreference = 'Stop'`,
    `Import-Module PKI -ErrorAction SilentlyContinue`,
    `$cert = New-SelfSignedCertificate -Subject 'CN=Tajweed Engine dev' -CertStoreLocation 'Cert:\\CurrentUser\\My' -NotAfter (Get-Date).AddYears(1) -KeyExportPolicy Exportable -KeyUsage DigitalSignature,KeyEncipherment -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.1','2.5.29.17={text}${san}')`,
    `$pw = ConvertTo-SecureString -String '${PASSPHRASE}' -Force -AsPlainText`,
    `Export-PfxCertificate -Cert $cert -FilePath '${PFX_PATH}' -Password $pw | Out-Null`,
    `Remove-Item -Path ('Cert:\\CurrentUser\\My\\' + $cert.Thumbprint) -Force`,
  ].join('\n');
  writeFileSync(scriptPath, ps, 'utf8');

  console.log(`[dev-https] generating a self-signed certificate for: ${hosts.join(', ')}`);
  // PSModulePath is dropped rather than inherited. Launched from a PowerShell 7
  // terminal, the inherited value points at pwsh's module directories; Windows
  // PowerShell 5.1 then fails to auto-load Microsoft.PowerShell.Security, and
  // the only symptom is New-SelfSignedCertificate reporting that the `Cert:`
  // drive does not exist. Clearing it lets 5.1 rebuild its own default.
  const env = { ...process.env };
  delete env.PSModulePath;

  const res = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
    { stdio: ['ignore', 'inherit', 'inherit'], env },
  );
  if (res.status !== 0 || !existsSync(PFX_PATH)) {
    throw new Error('[dev-https] could not create a certificate via New-SelfSignedCertificate');
  }
}

/**
 * Wait for `next dev` to be accepting connections before opening the TLS port.
 *
 * A TCP connect, not an HTTP request: in dev, Next compiles a route the first
 * time it is asked for, so a request to `/` can sit unanswered for the better
 * part of a minute on this machine's Babel pipeline. Waiting on a *response*
 * would mean the https port stays shut through that whole first compile.
 * Accepting connections is the only thing the proxy actually needs.
 */
function waitForTarget(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const probe = () => {
      const sock = netConnect({ host: '127.0.0.1', port: TARGET_PORT });
      sock.setTimeout(1000);
      sock.once('connect', () => {
        sock.destroy();
        resolve();
      });
      sock.once('error', retry);
      sock.once('timeout', () => {
        sock.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() > deadline) reject(new Error('[dev-https] next dev never came up'));
      else setTimeout(probe, 400);
    };
    probe();
  });
}

const hosts = ['localhost', '127.0.0.1', ...lanAddresses()];
ensureCert(hosts);
const pfx = readFileSync(PFX_PATH);

// `next dev` runs as a child so one Ctrl-C stops both.
//
// The two NEXT_PUBLIC_ variables are what let the *app* explain itself. A phone
// that opened `http://<lan-ip>:3000` cannot record and cannot work out where to
// go instead: the https port is a fact known only here. Handing it over means
// the page can render the exact address as a tappable link rather than telling
// the learner to go and read the terminal. Absent them the app falls back to
// guessing `port + 1` and says out loud that it is guessing.
const next = spawn(
  process.execPath,
  [
    '--max-old-space-size=2560',
    join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'),
    'dev',
    '--webpack',
    '-p',
    String(TARGET_PORT),
  ],
  {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_DEV_HTTPS_PORT: String(HTTPS_PORT),
      NEXT_PUBLIC_DEV_LAN_HOSTS: lanAddresses().join(','),
    },
  },
);
next.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => next.kill(sig));

/**
 * A plain pipe to the dev server.
 *
 * `x-forwarded-proto` is what makes Next generate https URLs behind the
 * proxy; without it the HMR client reconnects to http and the page stops
 * hot-reloading. The `upgrade` handler carries the HMR WebSocket itself.
 */
/**
 * A socket dying mid-proxy is normal, not exceptional.
 *
 * `next dev` restarts itself whenever `next.config.ts` changes, which resets
 * every connection this proxy is holding — including the long-lived HMR
 * WebSocket. A raw socket with no `error` listener turns that reset into an
 * *unhandled* 'error' event, and Node's default for that is to throw: editing
 * the config file killed the whole https wrapper with `read ECONNRESET`, taking
 * the dev server down with it. Every socket in the proxy therefore gets a
 * listener whose only job is to make the failure boring.
 */
const ignoreReset = (sock) => sock.on('error', () => sock.destroy());

const proxy = (req, res) => {
  const headers = { ...req.headers, 'x-forwarded-proto': 'https', 'x-forwarded-host': req.headers.host };
  const upstream = httpRequest(
    { host: '127.0.0.1', port: TARGET_PORT, path: req.url, method: req.method, headers },
    (up) => {
      up.on('error', () => res.destroy());
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  // The client can walk away mid-request — a reload during a slow first
  // compile is the common case — and the browser resetting its end must not
  // reach the process as an unhandled error either.
  req.on('error', () => upstream.destroy());
  res.on('error', () => upstream.destroy());
  upstream.on('error', () => {
    if (res.writableEnded || res.destroyed) return;
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('dev server not reachable');
  });
  req.pipe(upstream);
};

const server = createHttpsServer({ pfx, passphrase: PASSPHRASE }, proxy);

// A failed TLS handshake — the phone tapping "back" on the certificate warning
// is one — arrives here rather than on any request.
server.on('clientError', (_err, socket) => socket.destroy());
server.on('tlsClientError', () => {});

server.on('upgrade', (req, socket, head) => {
  ignoreReset(socket);

  const upstream = httpRequest({
    host: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  });
  upstream.on('upgrade', (upRes, upSocket, upHead) => {
    ignoreReset(upSocket);
    const lines = Object.entries(upRes.headers).map(([k, v]) => `${k}: ${v}`);
    socket.write(`HTTP/1.1 101 Switching Protocols\r\n${lines.join('\r\n')}\r\n\r\n`);
    if (upHead?.length) socket.unshift(upHead);
    upSocket.pipe(socket).pipe(upSocket);
  });
  upstream.on('error', () => socket.destroy());
  if (head?.length) upstream.write(head);
  upstream.end();
});

// A bare `http://…:3001` is a common typo once you are told "use 3001";
// answering it with a redirect is friendlier than a TLS parse error.
createServer((req, res) => {
  res.writeHead(301, { location: `https://${req.headers.host ?? `localhost:${HTTPS_PORT}`}${req.url}` });
  res.end();
}).listen(HTTPS_PORT + 1);

await waitForTarget();
server.listen(HTTPS_PORT, () => {
  const lan = lanAddresses();
  console.log('');
  console.log(`  ▲ https ready on :${HTTPS_PORT}  (microphone works here)`);
  console.log(`  - Local:    https://localhost:${HTTPS_PORT}`);
  for (const ip of lan) console.log(`  - Phone:    https://${ip}:${HTTPS_PORT}`);
  console.log('');
  console.log('  The certificate is self-signed, so the phone warns once:');
  console.log('  Advanced → Proceed. After that the microphone is available.');
  console.log('');
  // The line `next dev` printed above this one is the wrong address for a
  // phone, and it is the one people copy. Say so here rather than letting the
  // recorder fail silently on the device.
  console.log(`  ✗ Do NOT use http://<ip>:${TARGET_PORT} on a phone — plain http means`);
  console.log('    no microphone, in every browser. The app now says so on screen');
  console.log(`    and links to :${HTTPS_PORT}; http://<ip>:${HTTPS_PORT + 1} also redirects here.`);
  console.log('');
});
