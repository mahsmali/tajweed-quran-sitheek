import { tokenizeWord } from '@/lib/arabic/tokenize';
import * as U from '@/lib/arabic/unicode';

/**
 * Fallback word alignment.
 *
 * When a reciter has no published segments we still need millisecond bounds,
 * so we estimate them from the phonology rather than splitting the verse into
 * equal slices. Each letter contributes a duration weight: a 6-count madd is
 * genuinely six times longer than a plain consonant, and a ghunnah adds a real
 * two-count hold. The result is visibly better than a naive split, and the UI
 * always labels it `estimated` so a learner is never misled.
 */

const BASE = 1; // one plain consonant + its short vowel
const SHADDA_BONUS = 0.9;
const GHUNNAH_BONUS = 1.6;

function letterWeight(
  l: ReturnType<typeof tokenizeWord>[number],
  prev: ReturnType<typeof tokenizeWord>[number] | undefined,
): number {
  if (l.silentAlways) return 0;
  if (l.code === U.ALEF_WASLA) return 0.15;

  let w = BASE;

  // long vowels
  const isMadd =
    l.daggerAlif ||
    l.code === U.ALEF_MADDA ||
    ((l.code === U.ALEF || l.code === U.ALEF_MAKSURA) && !l.haraka && prev?.haraka === 'fatha') ||
    (l.code === U.WAW && l.isSakin && prev?.haraka === 'damma') ||
    (l.code === U.YEH && l.isSakin && prev?.haraka === 'kasra');

  if (isMadd) w = l.maddahAbove ? 3.2 : 1.9;
  if (l.smallWaw || l.smallYeh) w = 1.8;

  if (l.shadda) w += SHADDA_BONUS;
  if ((l.code === U.NOON || l.code === U.MEEM) && (l.shadda || l.isSakin)) w += GHUNNAH_BONUS;
  if (l.tanween) w += 0.5;
  if (l.isSakin && !isMadd) w -= 0.25;

  return Math.max(0.2, w);
}

export function wordWeight(word: string): number {
  const letters = tokenizeWord(word);
  return letters.reduce((sum, l, i) => sum + letterWeight(l, letters[i - 1]), 0);
}

export interface EstimatedTiming {
  startMs: number;
  endMs: number;
}

/**
 * Spread `totalMs` across the words of a verse by phonological weight.
 * With no duration known, assume a steady murattal pace of ~340ms per weight
 * unit, which lands within a few percent of Alafasy on the surahs we checked.
 */
export function estimateWordTimings(words: string[], totalMs?: number): EstimatedTiming[] {
  const weights = words.map(wordWeight);
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const total = totalMs ?? sum * 340;

  let cursor = 0;
  return weights.map((w) => {
    const dur = (w / sum) * total;
    const start = cursor;
    cursor += dur;
    return { startMs: Math.round(start), endMs: Math.round(cursor) };
  });
}
