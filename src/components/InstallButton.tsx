'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useT } from '@/lib/i18n/useT';

/**
 * The install control, and the thing that registers the service worker.
 *
 * WHY ONE SQUARE IN THE MASTHEAD AND NOT A BANNER
 * -----------------------------------------------
 * Most people meet this app through a link someone shared — a WhatsApp group,
 * a QR code taped to a classroom wall — and will not come back by typing the
 * address, so the offer to keep it has to be visible rather than filed behind
 * a ⋮ menu. It does not follow that it should be loud: a banner across the top
 * of every page pushed the reader down the screen on the device that has least
 * of it, and said three sentences about offline caching to someone who had not
 * yet read a verse. A single square beside the credit is permanently in view,
 * costs no vertical space, and is the whole offer.
 *
 * It renders NOTHING unless the app can actually be installed here. On Firefox
 * desktop, in an already-installed window, or once the browser has fired
 * `appinstalled`, the masthead is exactly as it was.
 *
 * TWO PATHS, BECAUSE THERE ARE TWO WORLDS
 * ---------------------------------------
 * Chromium fires `beforeinstallprompt`, which can be held and replayed against
 * a control of our own — one tap, no explanation needed. Safari fires nothing
 * and exposes no API: on iOS the only route is Share ▸ Add to Home Screen, so
 * there the same square opens a short popover teaching that gesture. Offering
 * an identical-looking button that cannot install anything would be worse than
 * offering none.
 *
 * WHY THE WORKER IS REGISTERED HERE AND ONLY IN PRODUCTION
 * --------------------------------------------------------
 * Installability is not granted for a manifest alone; Chromium wants a service
 * worker with a fetch handler, so the two belong to the same component — and
 * this one mounts on every page, which the banner also did. In dev it stays
 * unregistered: `public/sw.js` caches `/_next/static/*` first-hand, which is
 * exactly the traffic Fast Refresh depends on being live. Test the install
 * flow with `npm run build && npm start`.
 */

/** Not in lib.dom yet — Chromium-only, and still non-standard. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/** True once the app is running from the home screen rather than in a tab. */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // Safari's own flag, which predates the standard media query and is still
    // the only one it sets on iOS.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; the touch-point count is what gives it away.
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Chrome and Firefox on iOS are Safari underneath but cannot add to the home
  // screen at all, so the instructions would be a dead end there.
  return iOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

/**
 * `className` carries the plate — size, shape and tint — from `BrandCredit`,
 * which owns the masthead row. It is passed in rather than imported so that
 * the two squares' tints are written next to each other in the one file, where
 * "these must differ" is visible, and so the two components do not import each
 * other in a cycle.
 */
export function InstallButton({ className }: { className: string }) {
  const t = useT();
  const [mode, setMode] = useState<'hidden' | 'prompt' | 'ios'>('hidden');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      // After load, so the registration never competes with the first paint
      // for bandwidth on the slow connection this is meant to rescue.
      const register = () => {
        void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
          // A failed registration costs the offline mode and nothing else, so
          // it stays silent rather than throwing in a learner's face.
        });
      };
      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register, { once: true });
    }

    const onBeforeInstall = (event: Event) => {
      // Holding the event is what lets the offer be made in our own type, in
      // the learner's own language, instead of Chrome's mini-infobar.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode('prompt');
    };

    const onInstalled = () => {
      setMode('hidden');
      setOpen(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // Safari never fires the event, so the iOS branch is decided up front.
    if (isIOSSafari()) setMode('ios');

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // The popover is the only thing on this row that covers content, so it
  // closes the way a menu does: anywhere else, or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activate = useCallback(async () => {
    if (mode === 'ios') {
      setOpen((v) => !v);
      return;
    }
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* the browser withdrew it; nothing useful to say about that */
    }
    // Single-use either way: Chromium fires a fresh one on a later visit if
    // the app is still uninstalled, and `appinstalled` handles the other case.
    setDeferred(null);
    setMode('hidden');
  }, [deferred, mode]);

  if (mode === 'hidden') return null;

  const label = t.t('install.label');

  return (
    <span ref={wrap} className="relative inline-flex">
      <button
        type="button"
        onClick={() => void activate()}
        title={label}
        aria-label={label}
        aria-expanded={mode === 'ios' ? open : undefined}
        className={className}
      >
        <DownloadIcon />
      </button>

      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            // Pinned to the right edge: this sits near the end of the masthead,
            // and a popover growing rightwards would run off a phone.
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[248px] rounded-xl border border-line bg-raised p-3 text-left shadow-card"
            role="dialog"
            aria-label={t.t('install.iosTitle')}
          >
            <span className="display block text-[13px] leading-snug text-ink">
              {t.t('install.iosTitle')}
            </span>
            <span className="mt-1 block text-[11.5px] leading-relaxed text-muted">
              {t.t('install.iosBody')}
            </span>
            <span className="mt-2 flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1.5 text-[11px]">
              <ShareIcon />
              <span className="text-muted">{t.t('install.iosShareLabel')}</span>
              <span aria-hidden="true" className="text-muted">
                →
              </span>
              <span className="font-semibold text-ink">{t.t('install.iosAddLabel')}</span>
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/** An arrow coming down into a tray: install, not download-a-file. */
function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v10" />
      <path d="M8 9.5l4 4 4-4" />
      <path d="M5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-1.5" />
    </svg>
  );
}

/** iOS's own share glyph — a box with an arrow leaving the top. */
function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-accent"
    >
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 13v6a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6" />
    </svg>
  );
}
