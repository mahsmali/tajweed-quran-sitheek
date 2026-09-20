'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type WaveSurfer from 'wavesurfer.js';
import {
  compareDurations,
  envelopeShape,
  envelopeThirds,
  formatMsShort,
  type ComparisonResult,
  type EnvelopeKey,
  type LengthVerdict,
} from '@/lib/audio/compare';
import { announcementText, durationText, envelopeText, verdictText } from '@/lib/audio/describe';
import {
  errorName,
  gumErrorKey,
  micBlockReason,
  secureAddress,
  type SecureAddress,
} from '@/lib/audio/micAvailability';
import { MicCheck } from './MicAvailabilityNotice';
import { useT } from '@/lib/i18n/useT';
import type { Translator } from '@/lib/i18n';

type Status =
  | 'idle'
  | 'arming'
  | 'recording'
  | 'decoding'
  | 'ready'
  | 'denied'
  | 'unsupported'
  | 'insecure';

export interface WaveformCompareProps {
  masterUrl: string | null;
  /** Re-mount key so switching words resets the comparison. */
  resetKey: string;
  label?: string;
  /** The word being practised, for accessible names. */
  wordLabel?: string;
  maxSeconds?: number;
}

const MASTER_COLOR = 'rgb(166 124 62 / 0.55)';
const MASTER_PROGRESS = 'rgb(166 124 62)';
const USER_COLOR = 'rgb(29 91 214 / 0.45)';
const USER_PROGRESS = 'rgb(29 91 214)';

const VERDICT_CLASS: Record<LengthVerdict, string> = {
  short: 'border-madd/40 bg-madd/[0.07] text-madd',
  long: 'border-makharij/40 bg-makharij/[0.07] text-makharij',
  match: 'border-ghunnah/40 bg-ghunnah/[0.07] text-ghunnah',
  unknown: 'border-line bg-ink/[0.03] text-muted',
};

/**
 * "Listen & repeat" — the reciter's waveform above, the learner's below.
 *
 * ACCESSIBILITY
 * -------------
 * A waveform is a picture of a sound, which makes it the least accessible way
 * to give feedback about a sound. Everything the canvas shows is therefore
 * also available as text:
 *
 *  • each track is a <figure> with a <figcaption> stating its duration and
 *    where its energy sits ("builds towards the end — consistent with a madd
 *    held at the finish"); the canvas itself is aria-hidden
 *  • the verdict carries a symbol (↓ ✓ ↑) and a sentence, so colour is never
 *    the only channel
 *  • the length ratio is exposed as a role="meter" with aria-valuetext
 *  • a polite live region announces arming, recording, and the full result
 *  • errors land in a role="alert"
 *  • R / P / Y keyboard shortcuts, declared with aria-keyshortcuts
 *  • focus moves to "Play yours" once a recording decodes
 *  • when the microphone is blocked or absent, an file-upload path gives the
 *    identical comparison — this is the fallback that keeps the feature usable
 *    on locked-down machines, and it is not hidden away as a second-class path
 */
export function WaveformCompare({
  masterUrl,
  resetKey,
  label,
  wordLabel,
  maxSeconds = 8,
}: WaveformCompareProps) {
  const t = useT();
  const title = label ?? t.t('recorder.title');
  const masterHost = useRef<HTMLDivElement | null>(null);
  const userHost = useRef<HTMLDivElement | null>(null);
  const masterWs = useRef<WaveSurfer | null>(null);
  const userWs = useRef<WaveSurfer | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const blobUrl = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const capRef = useRef<number | null>(null);
  const playYoursRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [masterMs, setMasterMs] = useState<number | null>(null);
  const [userMs, setUserMs] = useState<number | null>(null);
  const [masterShape, setMasterShape] = useState<EnvelopeKey | null>(null);
  const [userShape, setUserShape] = useState<EnvelopeKey | null>(null);
  const [masterPlaying, setMasterPlaying] = useState(false);
  const [userPlaying, setUserPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState('');
  const [error, setError] = useState<string | null>(null);

  const id = useId();
  const masterCapId = `${id}-master-cap`;
  const userCapId = `${id}-user-cap`;
  const titleId = `${id}-title`;
  const hintId = `${id}-hint`;
  const micNoteId = `${id}-mic-note`;

  const result: ComparisonResult = useMemo(() => compareDurations(masterMs, userMs), [masterMs, userMs]);

  /** Read the decoded buffer out of a Wavesurfer instance and classify it. */
  const describe = useCallback((ws: WaveSurfer | null): EnvelopeKey | null => {
    try {
      const buf = ws?.getDecodedData();
      if (!buf) return null;
      return envelopeShape(envelopeThirds(buf.getChannelData(0)));
    } catch {
      return null;
    }
  }, []);

  // Wavesurfer touches `window` at import time, so it is pulled in lazily.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { default: WS } = await import('wavesurfer.js');
      if (cancelled || !masterHost.current || !userHost.current) return;

      masterWs.current?.destroy();
      userWs.current?.destroy();

      const common = {
        height: 52, barWidth: 2, barGap: 2, barRadius: 3, normalize: true,
        // The canvas is decorative: everything it conveys is in the caption.
        interact: true,
      } as const;

      masterWs.current = WS.create({
        container: masterHost.current,
        waveColor: MASTER_COLOR, progressColor: MASTER_PROGRESS,
        cursorColor: 'rgb(166 124 62 / 0.8)', ...common,
      });
      userWs.current = WS.create({
        container: userHost.current,
        waveColor: USER_COLOR, progressColor: USER_PROGRESS,
        cursorColor: 'rgb(29 91 214 / 0.8)', ...common,
      });

      masterWs.current.on('ready', () => {
        setMasterMs(Math.round((masterWs.current?.getDuration() ?? 0) * 1000));
        setMasterShape(describe(masterWs.current));
      });
      masterWs.current.on('play', () => setMasterPlaying(true));
      masterWs.current.on('pause', () => setMasterPlaying(false));
      masterWs.current.on('finish', () => setMasterPlaying(false));
      masterWs.current.on('error', () => setError(t.t('recorder.errMaster')));

      userWs.current.on('ready', () => {
        setUserMs(Math.round((userWs.current?.getDuration() ?? 0) * 1000));
        setUserShape(describe(userWs.current));
      });
      userWs.current.on('play', () => setUserPlaying(true));
      userWs.current.on('pause', () => setUserPlaying(false));
      userWs.current.on('finish', () => setUserPlaying(false));

      if (masterUrl) masterWs.current.load(masterUrl).catch(() => setError(t.t('recorder.errMaster')));
    })();

    return () => {
      cancelled = true;
      masterWs.current?.destroy();
      userWs.current?.destroy();
      masterWs.current = null;
      userWs.current = null;
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
      blobUrl.current = null;
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (capRef.current) window.clearTimeout(capRef.current);
    };
  }, [resetKey, masterUrl, describe]);

  // Changing word clears the learner's side.
  useEffect(() => {
    setUserMs(null);
    setUserShape(null);
    setStatus('idle');
    setLive('');
    setError(null);
  }, [resetKey]);

  // Announce the full result once a recording has decoded.
  useEffect(() => {
    if (status !== 'ready' || userMs === null) return;
    setLive(announcementText(t, result, masterMs, userMs));
    playYoursRef.current?.focus();
  }, [status, userMs, masterMs, result]);

  const loadIntoUserTrack = useCallback((url: string) => {
    setStatus('decoding');
    userWs.current
      ?.load(url)
      .then(() => setStatus('ready'))
      .catch(() => {
        setStatus('idle');
        setError(t.t('recorder.errDecode'));
      });
  }, [t]);

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  const record = useCallback(async () => {
    setError(null);
    const blocked = micBlockReason();
    if (blocked) {
      setStatus(blocked);
      setError(t.t(blocked === 'insecure' ? 'recorder.errInsecure' : 'recorder.errNoSupport'));
      setLive(t.t('recorder.liveUnavailable'));
      return;
    }

    setStatus('arming');
    setLive(t.t('recorder.liveArming'));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      chunks.current = [];
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) =>
        MediaRecorder.isTypeSupported(m),
      );
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.current = rec;

      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) window.clearInterval(timerRef.current);
        if (capRef.current) window.clearTimeout(capRef.current);
        const blob = new Blob(chunks.current, { type: mime || 'audio/webm' });
        if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
        blobUrl.current = URL.createObjectURL(blob);
        setLive(t.t('recorder.liveStopped'));
        loadIntoUserTrack(blobUrl.current);
      };

      rec.start();
      setStatus('recording');
      setElapsed(0);
      setLive(t.t('recorder.liveRecording', { word: wordLabel ?? '' }));

      timerRef.current = window.setInterval(() => setElapsed((s) => s + 0.1), 100);
      capRef.current = window.setTimeout(() => {
        if (rec.state === 'recording') rec.stop();
      }, maxSeconds * 1000);
    } catch (e) {
      // Four distinct problems arrive here as four distinct DOMException names,
      // and they need four different actions from the learner: grant the
      // permission, plug something in, close the app holding the device, or
      // give up and upload. Collapsing them into "no microphone" — which this
      // used to do — hides the only one they can actually fix. The raw name is
      // appended too, because it is the single most useful thing to quote when
      // the failure turns out to be none of the four.
      const key = gumErrorKey(e);
      const name = errorName(e);
      setStatus(key === 'errDenied' ? 'denied' : 'unsupported');
      setError(
        [t.t(`recorder.${key}`), name && t.t('recorder.errDetail', { name })]
          .filter(Boolean)
          .join(' '),
      );
      setLive(t.t('recorder.liveUnavailable'));
    }
  }, [loadIntoUserTrack, maxSeconds, wordLabel, t]);

  const onFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      setError(null);
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
      blobUrl.current = URL.createObjectURL(file);
      setLive(`Loaded ${file.name}.`);
      loadIntoUserTrack(blobUrl.current);
    },
    [loadIntoUserTrack],
  );

  // R / P / Y, scoped to this panel so they never fight the page.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'r') {
        e.preventDefault();
        status === 'recording' ? stop() : void record();
      } else if (k === 'p') {
        e.preventDefault();
        void masterWs.current?.playPause();
      } else if (k === 'y' && status === 'ready') {
        e.preventDefault();
        void userWs.current?.playPause();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [status, record, stop]);

  const recording = status === 'recording';
  const hasUser = status === 'ready' && userMs !== null;

  // Checked on mount rather than on the first tap: if the page can never reach
  // a microphone, the learner should see why before pressing a button that is
  // guaranteed to fail — and the upload path should be the one that looks
  // like the primary action.
  const [blocked, setBlocked] = useState<'insecure' | 'unsupported' | null>(null);
  const [secure, setSecure] = useState<SecureAddress | null>(null);
  useEffect(() => {
    const reason = micBlockReason();
    setBlocked(reason);
    if (reason === 'insecure') setSecure(secureAddress());
  }, []);

  return (
    <section
      ref={rootRef}
      aria-labelledby={titleId}
      aria-describedby={hintId}
      className="panel p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h4 id={titleId} className="text-sm font-semibold text-ink">
          {title}
        </h4>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void masterWs.current?.playPause()}
            aria-pressed={masterPlaying}
            aria-keyshortcuts="p"
            className="min-h-[36px] rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-ink"
          >
            {masterPlaying ? '❚❚' : '▶'} <span className="ml-0.5">{t.t('recorder.reciter')}</span>
          </button>

          <button
            ref={playYoursRef}
            type="button"
            disabled={!hasUser}
            onClick={() => void userWs.current?.playPause()}
            aria-pressed={userPlaying}
            aria-keyshortcuts="y"
            className="min-h-[36px] rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition enabled:hover:border-accent/50 enabled:hover:text-ink disabled:opacity-40"
          >
            {userPlaying ? '❚❚' : '▶'} <span className="ml-0.5">{t.t('recorder.you')}</span>
          </button>

          <button
            type="button"
            disabled={blocked !== null && !recording}
            onClick={recording ? stop : () => void record()}
            aria-keyshortcuts="r"
            aria-describedby={blocked ? micNoteId : undefined}
            aria-label={
              recording
                ? t.t('recorder.stopAria', { seconds: elapsed.toFixed(1) })
                : hasUser
                  ? t.t('recorder.recordAgain')
                  : t.t('recorder.recordAria', { word: wordLabel ? ` — ${wordLabel}` : '' })
            }
            className={[
              'inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              recording ? 'bg-madd text-white' : 'bg-accent text-white enabled:hover:brightness-110',
              'disabled:cursor-not-allowed disabled:bg-ink/25',
            ].join(' ')}
          >
            <MicIcon pulsing={recording} />
            {recording
              ? `${t.t('recorder.stop')} ${elapsed.toFixed(1)}s`
              : hasUser
                ? t.t('recorder.retry')
                : t.t('recorder.record')}
          </button>
        </div>
      </div>

      {/* ── the two tracks ────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <Track
          t={t}
          title={t.t('recorder.reciter')}
          accent="text-accent"
          ms={masterMs}
          shape={masterShape}
          captionId={masterCapId}
        >
          <div ref={masterHost} className="ws-wrap" aria-hidden="true" />
        </Track>

        <Track
          t={t}
          title={t.t('recorder.you')}
          accent="text-qalqalah"
          ms={userMs}
          shape={userShape}
          captionId={userCapId}
        >
          <div ref={userHost} className="ws-wrap min-h-[52px]" aria-hidden="true" />
          {!hasUser && (
            <p className="pointer-events-none absolute inset-x-3 bottom-2 top-7 flex items-center justify-center text-center text-[11px] text-muted">
              {recording
                ? t.t('recorder.promptRecording', { elapsed: elapsed.toFixed(1), max: maxSeconds })
                : status === 'arming'
                  ? t.t('recorder.promptArming')
                  : status === 'decoding'
                    ? t.t('recorder.promptDecoding')
                    : blocked
                      ? t.t('recorder.promptUploadOnly')
                      : t.t('recorder.promptRecord')}
            </p>
          )}
        </Track>
      </div>

      {/* ── the verdict ───────────────────────────────────────────────────── */}
      <ComparisonVerdict result={result} />

      {/* ── why the microphone is off, when it is ──────────────────────────
          An insecure origin is the one cause the learner can actually fix, so
          it gets the exact address to open rather than generic advice. */}
      {blocked && (
        <div
          id={micNoteId}
          className="mt-3 rounded-xl border border-makharij/40 bg-makharij/[0.07] px-3.5 py-3"
        >
          <p className="text-[12.5px] font-semibold text-makharij">
            {t.t(blocked === 'insecure' ? 'recorder.blockedInsecureTitle' : 'recorder.blockedUnsupportedTitle')}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink/75">
            {t.t(blocked === 'insecure' ? 'recorder.blockedInsecureBody' : 'recorder.blockedUnsupportedBody')}
          </p>
          {secure && (
            <p className="mt-2 break-all font-ui text-[12px] tabular-nums text-ink">
              <a className="font-semibold underline decoration-accent/60 underline-offset-4" href={secure.url}>
                {secure.url}
              </a>
            </p>
          )}
          <MicCheck className="mt-2.5" />
        </div>
      )}

      {/* ── fallback path: equally prominent, not a consolation prize ─────── */}
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
        <label
          className={[
            'inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium transition',
            blocked ? 'text-ink' : 'text-muted hover:text-ink',
          ].join(' ')}
        >
          <span
            className={[
              'rounded-lg px-2.5 py-1.5',
              blocked
                ? 'bg-accent font-semibold text-white hover:brightness-110'
                : 'border border-line',
            ].join(' ')}
          >
            {t.t('recorder.uploadInstead')}
          </span>
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        <p id={hintId} className="text-[11.5px] leading-snug text-muted">
          {t.t('recorder.keyboardHint', { seconds: maxSeconds })}
        </p>
      </div>

      {/* ── assistive output ──────────────────────────────────────────────── */}
      <p role="status" aria-live="polite" className="sr-only">
        {live}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-[12px] text-madd">
          {error}
        </p>
      )}
    </section>
  );
}

/**
 * The verdict block: symbol, sentence, and a meter showing length relative to
 * the reciter.
 *
 * Split out from the panel so it can be rendered — and checked — for any
 * comparison state without needing a microphone or a decoded waveform.
 */
export function ComparisonVerdict({ result, t: given }: { result: ComparisonResult; t?: Translator }) {
  const fallback = useT();
  const t = given ?? fallback;
  const { headline, detail } = verdictText(t, result);
  const ratioPct = result.ratio === null ? null : Math.min(200, Math.round(result.ratio * 100));

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      className={`mt-3 rounded-xl border px-3.5 py-3 ${VERDICT_CLASS[result.verdict]}`}
    >
      <div className="flex items-start gap-2.5">
        {/* aria-hidden because `headline` already states the verdict in words */}
        <span aria-hidden="true" className="text-lg font-bold leading-none">
          {result.symbol}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">
            {headline}
            {result.deltaMs !== null && (
              <span className="ml-1.5 font-normal opacity-80">
                ({result.deltaMs > 0 ? '+' : ''}
                {result.deltaMs} ms)
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink/75">{detail}</p>

          {ratioPct !== null && (
            <div
              role="meter"
              aria-valuemin={0}
              aria-valuemax={200}
              aria-valuenow={ratioPct}
              aria-valuetext={t.t('recorder.meterText', { pct: ratioPct, headline })}
              aria-label={t.t('recorder.meterLabel')}
              className="relative mt-2.5 h-2 w-full overflow-hidden rounded-full bg-ink/[0.08]"
            >
              {/* the 100% mark — the target the learner is aiming at */}
              <span aria-hidden="true" className="absolute left-1/2 top-0 h-full w-px bg-ink/30" />
              <motion.span
                aria-hidden="true"
                className="absolute left-0 top-0 h-full rounded-full bg-current opacity-70"
                initial={false}
                animate={{ width: `${Math.min(100, ratioPct / 2)}%` }}
                transition={{ type: 'spring', stiffness: 180, damping: 26 }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * One waveform track. The <figcaption> is the text alternative: it states the
 * duration and the shape of the sound, so the panel is fully usable with the
 * canvas unseen.
 */
function Track({
  t,
  title,
  ms,
  accent,
  shape,
  captionId,
  children,
}: {
  t: Translator;
  title: string;
  ms: number | null;
  accent: string;
  shape: EnvelopeKey | null;
  captionId: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="relative m-0 rounded-lg bg-ink/[0.03] px-3 py-2" aria-labelledby={captionId}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${accent}`}>{title}</span>
        <span aria-hidden="true" className="font-ui text-[11px] tabular-nums text-muted">
          {formatMsShort(ms)}
        </span>
      </div>
      {children}
      <figcaption id={captionId} className="mt-1 text-[11px] leading-snug text-muted">
        <span className="sr-only">
          {t.t('recorder.waveformOf', { track: title, duration: durationText(t, ms) })}{' '}
        </span>
        {envelopeText(t, shape) ?? <span className="sr-only">{t.t('recorder.notRecorded')}</span>}
      </figcaption>
    </figure>
  );
}

function MicIcon({ pulsing }: { pulsing: boolean }) {
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
      className={pulsing ? 'animate-pulse-word' : undefined}
    >
      <rect x="9" y="2" width="6" height="12" rx="3" fill={pulsing ? 'currentColor' : 'none'} />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
    </svg>
  );
}
