/**
 * ============================================================================
 *  RECITATION COMPARISON — pure, locale-neutral analysis
 * ============================================================================
 *  No DOM, no Web Audio, and — deliberately — no prose. This module decides
 *  *what is true* about a recording; `describe.ts` decides how to say it in
 *  the learner's language. Keeping the two apart is what lets the analysis be
 *  tested without a microphone and translated without touching the maths.
 *
 *  The useful signal for a Tajweed learner is DURATION and WHERE THE ENERGY
 *  SITS, not pitch. A madd held for two counts instead of four is a shorter
 *  block; a ghunnah that collapses shows up as energy missing from the middle.
 */

export type LengthVerdict = 'short' | 'match' | 'long' | 'unknown';

/** Shape of the energy envelope — maps to a sentence in `envelope.*`. */
export type EnvelopeKey = 'silent' | 'dip' | 'end' | 'front' | 'middle' | 'even';

/** Below this ratio the learner is clipping the word. */
export const SHORT_RATIO = 0.8;
/** Above this ratio they are over-stretching it. */
export const LONG_RATIO = 1.25;

export interface ComparisonResult {
  verdict: LengthVerdict;
  /** user / master. null when either duration is unknown. */
  ratio: number | null;
  /** user − master, in milliseconds. */
  deltaMs: number | null;
  /** Whole-percent deviation from the reciter, for the headline. */
  pctOff: number | null;
  /** Non-colour channel: a glyph that carries the verdict on its own. */
  symbol: string;
}

const UNKNOWN: ComparisonResult = {
  verdict: 'unknown', ratio: null, deltaMs: null, pctOff: null, symbol: '·',
};

export function compareDurations(masterMs: number | null, userMs: number | null): ComparisonResult {
  if (!masterMs || !userMs || masterMs <= 0 || userMs <= 0) return UNKNOWN;

  const ratio = userMs / masterMs;
  const deltaMs = Math.round(userMs - masterMs);
  const pctOff = Math.round(Math.abs(ratio - 1) * 100);

  if (ratio < SHORT_RATIO) return { verdict: 'short', ratio, deltaMs, pctOff, symbol: '↓' };
  if (ratio > LONG_RATIO) return { verdict: 'long', ratio, deltaMs, pctOff, symbol: '↑' };
  return { verdict: 'match', ratio, deltaMs, pctOff, symbol: '✓' };
}

/** Root-mean-square energy of a slice — a decent stand-in for loudness. */
function rms(channel: Float32Array, from: number, to: number): number {
  let sum = 0;
  const n = Math.max(1, to - from);
  for (let i = from; i < to; i++) sum += channel[i] * channel[i];
  return Math.sqrt(sum / n);
}

/**
 * Split the signal into thirds and return each third's share of total energy.
 * Returns values summing to ~1, or three zeros for silence.
 */
export function envelopeThirds(channel: Float32Array): [number, number, number] {
  const n = channel.length;
  if (n < 3) return [0, 0, 0];
  const a = rms(channel, 0, Math.floor(n / 3));
  const b = rms(channel, Math.floor(n / 3), Math.floor((2 * n) / 3));
  const c = rms(channel, Math.floor((2 * n) / 3), n);
  const total = a + b + c;
  if (total <= 0) return [0, 0, 0];
  return [a / total, b / total, c / total];
}

/**
 * Classify an energy envelope.
 *
 * This is the text alternative for the waveform picture. It is not decoration:
 * "the sound fades through the middle" is exactly how a collapsed ghunnah
 * presents, and a learner who cannot see the canvas still needs to know it.
 */
export function envelopeShape(thirds: [number, number, number]): EnvelopeKey {
  const [a, b, c] = thirds;
  if (a + b + c === 0) return 'silent';

  const DOMINANT = 0.4; // one third holding >40% of the energy is a real skew
  const MARGIN = 0.05; // ...but only if it clearly beats the others

  // Checked first because it is the most specific shape: both ends carry the
  // sound and the middle drops out. Two loud outer thirds can be near-equal,
  // so a plain "which third is largest" test would misread this as end- or
  // front-weighted on nothing more than floating-point noise.
  if (b < 0.2 && a > 0.2 && c > 0.2) return 'dip';

  if (c > DOMINANT && c > a + MARGIN && c > b + MARGIN) return 'end';
  if (a > DOMINANT && a > b + MARGIN && a > c + MARGIN) return 'front';
  if (b > DOMINANT && b > a + MARGIN && b > c + MARGIN) return 'middle';
  return 'even';
}

/** Compact, locale-neutral duration for the visual badge. */
export function formatMsShort(ms: number | null): string {
  return ms === null ? '—' : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
}
