/**
 * Whether this page can reach a microphone — and, when it cannot, the address
 * that would fix it.
 *
 * WHY THIS IS NOT A ONE-LINER
 * ---------------------------
 * `getUserMedia` is gated on a *secure context*, not on browser support. Open
 * the dev server from a phone on the LAN — `http://192.168.1.48:3000` — and
 * `navigator.mediaDevices` is `undefined` in every modern browser, exactly as
 * it would be in a browser that never implemented it. Reporting that as "this
 * browser does not support recording" sends the learner looking for a
 * different browser, which cannot help: every browser behaves this way.
 *
 * `localhost` is a trusted origin by specification, which is why the same
 * build records happily on the machine running the dev server and silently
 * refuses on the phone reading from it. That asymmetry is the single most
 * confusing thing about this feature, so the app names the origin as the cause
 * and hands over the exact https address rather than offering generic advice.
 */

export type MicBlock = 'insecure' | 'unsupported' | null;

/**
 * The https port the companion TLS proxy listens on, injected by
 * `scripts/dev-https.mjs` when the server is started through `npm run dev:https`.
 * Absent under a plain `npm run dev`, which is itself worth telling the learner:
 * there is no https address to open until that script is running.
 */
export const DEV_HTTPS_PORT: string | null = process.env.NEXT_PUBLIC_DEV_HTTPS_PORT || null;

/** Every LAN address the dev server answers on, for the desktop hand-off hint. */
export const DEV_LAN_HOSTS: string[] = (process.env.NEXT_PUBLIC_DEV_LAN_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

export function micBlockReason(): MicBlock {
  if (typeof window === 'undefined') return 'unsupported';
  const hasApi =
    Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';
  if (hasApi) return null;
  return window.isSecureContext ? 'unsupported' : 'insecure';
}

/** True for the origins a browser trusts without a certificate. */
export function isTrustedHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export interface SecureAddress {
  url: string;
  /**
   * `true` when the port was inferred rather than reported by the dev script —
   * i.e. nothing is necessarily listening there yet. The copy changes to say so
   * instead of promising an address that will refuse the connection.
   */
  guessed: boolean;
}

/**
 * The https equivalent of the current page, or `null` if we are already on one.
 *
 * The *hostname* has to come from the page rather than the server: the phone
 * reached us by one of several LAN addresses and only it knows which, so
 * rewriting the protocol and port in place is the one construction guaranteed
 * to stay reachable.
 */
export function secureAddress(loc: Location = window.location): SecureAddress | null {
  if (loc.protocol === 'https:') return null;
  const guessed = !DEV_HTTPS_PORT;
  const port = DEV_HTTPS_PORT ?? String(Number(loc.port || '80') + 1);
  return { url: `https://${loc.hostname}:${port}${loc.pathname}`, guessed };
}

export interface MicFacts {
  origin: string;
  secureContext: boolean;
  mediaDevices: boolean;
  mediaRecorder: boolean;
  /** Resolved asynchronously; `null` where the Permissions API is absent. */
  permission: PermissionState | null;
}

/** The synchronous half of the diagnosis — safe to read during render. */
export function micFacts(): MicFacts {
  return {
    origin: window.location.origin,
    secureContext: window.isSecureContext,
    mediaDevices: Boolean(navigator.mediaDevices?.getUserMedia),
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    permission: null,
  };
}

/**
 * The permission state, where the browser exposes it.
 *
 * Wrapped because `query({name: 'microphone'})` throws rather than rejecting on
 * some engines, and Safari has historically not recognised the descriptor at
 * all — a diagnostic panel that can itself throw is worse than one gap in it.
 */
export async function micPermission(): Promise<PermissionState | null> {
  try {
    const status = await navigator.permissions?.query({
      name: 'microphone' as PermissionName,
    });
    return status?.state ?? null;
  } catch {
    return null;
  }
}

/**
 * The DOMException names `getUserMedia` rejects with, mapped to the distinct
 * problems they actually represent. Collapsing these into "no microphone" —
 * which the panel used to do — hides the difference between a permission the
 * learner can grant and a device another app is holding open.
 */
export function gumErrorKey(e: unknown): string {
  const name = e instanceof DOMException || e instanceof Error ? e.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'errDenied';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'errNoDevice';
    case 'NotReadableError':
    case 'AbortError':
      return 'errDeviceBusy';
    default:
      return 'errNoDevice';
  }
}

/** The raw name, for the diagnostic line under the message. */
export function errorName(e: unknown): string | null {
  return e instanceof DOMException || e instanceof Error ? e.name : null;
}
