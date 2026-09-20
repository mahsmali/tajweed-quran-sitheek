'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DEV_HTTPS_PORT,
  DEV_LAN_HOSTS,
  isTrustedHost,
  micBlockReason,
  micFacts,
  micPermission,
  secureAddress,
  type MicFacts,
  type SecureAddress,
} from '@/lib/audio/micAvailability';
import { useT } from '@/lib/i18n/useT';

const DISMISS_KEY = 'tajweed-mic-notice-dismissed';
const HANDOFF_KEY = 'tajweed-phone-handoff-dismissed';

/**
 * Page-level notice that the microphone cannot work on this address.
 *
 * WHY THIS IS NOT LEFT TO THE RECORDER PANEL
 * ------------------------------------------
 * The recorder already explains itself — but it lives *inside* the word
 * inspector, four taps deep: open the reader, tap a word, scroll past the rule
 * breakdown, and there it is. A learner on a phone who opened the address the
 * dev server printed (`http://192.168.1.48:3000`) taps Record, nothing happens,
 * and the explanation is somewhere they have not looked. The cause is a
 * property of the whole page, so it is stated at the top of the whole page,
 * with the one address that fixes it as a link they can tap rather than an
 * instruction they have to retype.
 */
export function MicAvailabilityNotice() {
  const t = useT();
  const [state, setState] = useState<'hidden' | 'insecure' | 'handoff'>('hidden');
  const [secure, setSecure] = useState<SecureAddress | null>(null);

  useEffect(() => {
    const blocked = micBlockReason();

    if (blocked === 'insecure') {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
      setSecure(secureAddress());
      setState('insecure');
      return;
    }

    // Recording works *here*. If this is the machine running the dev server and
    // the TLS proxy is up, the useful thing to say is how to reach it from a
    // phone — the device where the microphone will otherwise fail.
    if (
      blocked === null &&
      isTrustedHost(window.location.hostname) &&
      DEV_HTTPS_PORT &&
      DEV_LAN_HOSTS.length > 0 &&
      localStorage.getItem(HANDOFF_KEY) !== '1'
    ) {
      setState('handoff');
    }
  }, []);

  const dismiss = () => {
    if (state === 'insecure') sessionStorage.setItem(DISMISS_KEY, '1');
    if (state === 'handoff') localStorage.setItem(HANDOFF_KEY, '1');
    setState('hidden');
  };

  return (
    <AnimatePresence initial={false}>
      {state === 'insecure' && (
        <motion.div
          key="insecure"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="mb-5 overflow-hidden rounded-2xl border border-makharij/40 bg-makharij/[0.06]"
          role="status"
        >
          <div className="flex flex-wrap items-start gap-x-4 gap-y-3 px-4 py-4 sm:px-5">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-makharij/15 text-makharij"
            >
              <MicOffIcon />
            </span>

            <div className="min-w-0 flex-1">
              <p className="display text-[15px] leading-snug text-ink">{t.t('mic.bannerTitle')}</p>
              <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-ink/75">
                {t.t(secure?.guessed ? 'mic.guessedBody' : 'mic.bannerBody')}
              </p>

              {secure && (
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <a
                    href={secure.url}
                    className="group inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:brightness-110"
                  >
                    {t.t('mic.openSecure')}
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </a>
                  <code className="break-all rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[11.5px] tabular-nums text-muted">
                    {secure.url}
                  </code>
                </div>
              )}

              <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted">
                {t.t('mic.uploadStillWorks')}
              </p>

              <MicCheck className="mt-3" />
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="ml-auto shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-muted transition hover:text-ink"
            >
              {t.t('mic.dismiss')}
            </button>
          </div>
        </motion.div>
      )}

      {state === 'handoff' && (
        <motion.div
          key="handoff"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 overflow-hidden rounded-2xl border border-line bg-raised px-4 py-3"
        >
          <span aria-hidden="true" className="text-accent">
            <PhoneIcon />
          </span>
          <p className="text-[12.5px] font-semibold text-ink">{t.t('mic.phoneHandoffTitle')}</p>
          <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-muted">
            {t.t('mic.phoneHandoffBody')}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {DEV_LAN_HOSTS.map((host) => (
              <code
                key={host}
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] tabular-nums text-ink"
              >
                https://{host}:{DEV_HTTPS_PORT}
              </code>
            ))}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t.t('mic.dismiss')}
            className="rounded-lg border border-line px-2 py-1 text-[11px] text-muted transition hover:text-ink"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The facts, verbatim.
 *
 * "The recorder is not working" is not a diagnosis, and the difference between
 * an insecure origin, a missing `MediaRecorder` and a permission the learner
 * denied last week is invisible from the outside. Five rows settle it, and they
 * are the five rows worth quoting when reporting the problem to somebody else.
 */
export function MicCheck({ className = '' }: { className?: string }) {
  const t = useT();
  const [facts, setFacts] = useState<MicFacts | null>(null);

  useEffect(() => {
    setFacts(micFacts());
    void micPermission().then((permission) =>
      setFacts((f) => (f ? { ...f, permission } : f)),
    );
  }, []);

  if (!facts) return null;

  const yesNo = (v: boolean) => (v ? t.t('mic.yes') : t.t('mic.no'));
  const rows: Array<[string, string, boolean | null]> = [
    [t.t('mic.checkOrigin'), facts.origin, null],
    [t.t('mic.checkSecure'), yesNo(facts.secureContext), facts.secureContext],
    [t.t('mic.checkDevices'), yesNo(facts.mediaDevices), facts.mediaDevices],
    [t.t('mic.checkRecorder'), yesNo(facts.mediaRecorder), facts.mediaRecorder],
    [t.t('mic.checkPermission'), facts.permission ?? t.t('mic.unknown'), null],
  ];

  return (
    <details className={`group ${className}`}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[11.5px] font-semibold text-muted transition hover:text-ink">
        <span aria-hidden="true" className="transition-transform group-open:rotate-90">
          ▸
        </span>
        {t.t('mic.checkTitle')}
      </summary>
      <dl className="mt-2 grid gap-x-4 gap-y-1 rounded-xl border border-line bg-raised px-3 py-2.5 text-[11.5px] sm:grid-cols-[auto_minmax(0,1fr)]">
        {rows.map(([label, value, ok]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd
              className={[
                'min-w-0 break-all font-medium tabular-nums',
                ok === null ? 'text-ink' : ok ? 'text-ghunnah' : 'text-madd',
              ].join(' ')}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function MicOffIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
    >
      <path d="M9 5a3 3 0 0 1 6 0v4M15 13.5A3 3 0 0 1 9 12v-1M5 11a7 7 0 0 0 11.2 5.6M19 11v1M12 18v3" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18.5h2" />
    </svg>
  );
}
