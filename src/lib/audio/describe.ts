import type { Translator } from '@/lib/i18n';
import type { ComparisonResult, EnvelopeKey } from './compare';

/**
 * Turns the locale-neutral analysis in `compare.ts` into sentences the learner
 * can read — or, more to the point, that a screen reader can speak.
 */

/** "820 milliseconds" / "1.50 seconds", in the active language. */
export function durationText(t: Translator, ms: number | null): string {
  if (ms === null) return t.t('verdict.unknownDuration');
  return ms < 1000
    ? t.t('verdict.msUnit', { n: Math.round(ms) })
    : t.t('verdict.sUnit', { n: (ms / 1000).toFixed(2) });
}

export function verdictText(t: Translator, r: ComparisonResult): { headline: string; detail: string } {
  switch (r.verdict) {
    case 'short':
      return {
        headline: t.t('verdict.shortHeadline', { pct: r.pctOff ?? 0 }),
        detail: t.t('verdict.shortDetail'),
      };
    case 'long':
      return {
        headline: t.t('verdict.longHeadline', { pct: r.pctOff ?? 0 }),
        detail: t.t('verdict.longDetail'),
      };
    case 'match':
      return { headline: t.t('verdict.matchHeadline'), detail: t.t('verdict.matchDetail') };
    default:
      return { headline: t.t('verdict.unknownHeadline'), detail: t.t('verdict.unknownDetail') };
  }
}

export const envelopeText = (t: Translator, key: EnvelopeKey | null): string | null =>
  key ? t.t(`envelope.${key}`) : null;

/** The one sentence the live region speaks when a recording lands. */
export function announcementText(
  t: Translator,
  r: ComparisonResult,
  masterMs: number | null,
  userMs: number | null,
): string {
  if (r.verdict === 'unknown') return t.t('verdict.announceUnknown');
  const delta = r.deltaMs ?? 0;
  const amount = durationText(t, Math.abs(delta));
  const direction =
    delta === 0
      ? t.t('verdict.dirSame')
      : delta > 0
        ? t.t('verdict.dirLonger', { amount })
        : t.t('verdict.dirShorter', { amount });
  const { headline, detail } = verdictText(t, r);
  return t.t('verdict.announce', {
    user: durationText(t, userMs),
    master: durationText(t, masterMs),
    direction,
    headline,
    detail,
  });
}
