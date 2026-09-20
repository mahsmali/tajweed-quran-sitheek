import * as U from '@/lib/arabic/unicode';
import { type Letter, isLinLetter, tokenizeVerse } from '@/lib/arabic/tokenize';
import { getRule } from './rules';
import { formatNoteEn } from '@/lib/i18n/notes';
import type { NoonSource, NoteKey, NoteParams } from '@/lib/i18n/notes/keys';
import type { GlyphRun, TajweedRuleId, TajweedSpan } from '@/types/tajweed';

export const ENGINE_VERSION = '1.4.0';

/**
 * ============================================================================
 *  THE TAJWEED ENGINE
 * ============================================================================
 *  Input : the Uthmani words of one verse.
 *  Output: character-level `TajweedSpan`s per word.
 *
 *  Nothing here is verse-specific. Every rule is derived from the orthography
 *  itself — the vowel marks, the shadda, the Uthmani annotation signs (۟ ۢ ٰ ۥ)
 *  and the letter classes. That is what makes the curriculum automatable:
 *  point the pipeline at any surah and the colouring falls out.
 *
 *  Reading convention: the engine analyses a verse as it is recited in
 *  CONTINUOUS flow, stopping only at the end of the verse. That single
 *  assumption decides hamzat-wasl elision, qalqalah kubra and madd ‘arid.
 */

interface Ctx {
  letters: Letter[];
  byWord: Letter[][];
  words: string[];
  out: TajweedSpan[][];
}

/**
 * Record one span.
 *
 * The explanation is emitted as a translatable key plus parameters; the English
 * sentence is rendered here so `span.note` stays populated for the API payload,
 * the SQL export and the seed JSON.
 */
function push(
  ctx: Ctx,
  letter: Letter,
  ruleId: TajweedRuleId,
  noteKey: NoteKey,
  noteParams: NoteParams = {},
  opts: { end?: number; start?: number; trigger?: string; counts?: number } = {},
) {
  const start = opts.start ?? letter.start;
  const end = opts.end ?? letter.end;
  const word = ctx.words[letter.wordIndex];
  ctx.out[letter.wordIndex].push({
    ruleId,
    family: getRule(ruleId).family,
    start,
    end,
    text: word.slice(start, end),
    trigger: opts.trigger,
    counts: opts.counts,
    note: formatNoteEn(noteKey, noteParams),
    noteKey,
    noteParams,
  });
}

/** Map a tanween/noon letter onto the note's `src` parameter. */
function noonSource(l: Letter): NoonSource {
  if (l.tanween === 'fath') return 'tanween_fath';
  if (l.tanween === 'damm') return 'tanween_damm';
  if (l.tanween === 'kasr') return 'tanween_kasr';
  return 'noon';
}

/**
 * The next letter that is actually *sounded as a consonant*, which is what
 * every assimilation rule keys off. Three things get skipped:
 *   • glyphs marked silent in the rasm (۟)
 *   • hamzat al-wasl, elided in continuous flow
 *   • the bare alif that merely seats a tanween fath (كُفُوًا أَحَدٌ), so the
 *     noon of the tanween can still see the hamza that follows it.
 */
function effectiveNext(ctx: Ctx, k: number): Letter | undefined {
  for (let i = k + 1; i < ctx.letters.length; i++) {
    const l = ctx.letters[i];
    if (l.silentAlways) continue;
    if (l.code === U.ALEF_WASLA) continue;
    const bareCarrier =
      (l.code === U.ALEF || l.code === U.ALEF_MAKSURA) && !l.haraka && !l.tanween && !l.shadda;
    if (bareCarrier) continue;
    return l;
  }
  return undefined;
}

const prevInWord = (ctx: Ctx, k: number): Letter | undefined => {
  const p = ctx.letters[k - 1];
  return p && p.wordIndex === ctx.letters[k].wordIndex ? p : undefined;
};
const nextInWord = (ctx: Ctx, k: number): Letter | undefined => {
  const n = ctx.letters[k + 1];
  return n && n.wordIndex === ctx.letters[k].wordIndex ? n : undefined;
};
const isVerseFinal = (ctx: Ctx, k: number) => k === ctx.letters.length - 1;

const NAME: Record<number, string> = {
  [U.BEH]: 'ب', [U.TEH]: 'ت', [U.THEH]: 'ث', [U.JEEM]: 'ج', [U.HAH]: 'ح', [U.KHAH]: 'خ',
  [U.DAL]: 'د', [U.THAL]: 'ذ', [U.REH]: 'ر', [U.ZAIN]: 'ز', [U.SEEN]: 'س', [U.SHEEN]: 'ش',
  [U.SAD]: 'ص', [U.DAD]: 'ض', [U.TAH]: 'ط', [U.ZAH]: 'ظ', [U.AIN]: 'ع', [U.GHAIN]: 'غ',
  [U.FEH]: 'ف', [U.QAF]: 'ق', [U.KAF]: 'ك', [U.LAM]: 'ل', [U.MEEM]: 'م', [U.NOON]: 'ن',
  [U.HEH]: 'ه', [U.WAW]: 'و', [U.YEH]: 'ي', [U.HAMZA]: 'ء',
};
const nm = (l: Letter) => NAME[l.code] ?? l.ch;

// ─────────────────────────────────────────────────────────────────────────────
// 1. NOON SAKINAH & TANWEEN  →  ikhfa / idgham / iqlab / izhar
// ─────────────────────────────────────────────────────────────────────────────
function detectNoonRules(ctx: Ctx) {
  ctx.letters.forEach((l, k) => {
    const isNoonSakin = l.code === U.NOON && l.isSakin && !l.shadda;
    const isTanween = l.tanween !== null;
    if (!isNoonSakin && !isTanween) return;

    const next = effectiveNext(ctx, k);
    if (!next) return; // verse-final: nothing follows, no assimilation

    const src = noonSource(l);
    const sameWord = next.wordIndex === l.wordIndex;

    if (U.IKHFA_LETTERS.has(next.code)) {
      push(ctx, l, 'ikhfa', 'ikhfa', { src, letter: nm(next) }, { trigger: nm(next), counts: 2 });
      return;
    }
    // The small ۢ corroborates iqlab but never creates it: the Uthmani rasm
    // also prints it where no ب actually follows (e.g. verse-final تَوَّابًۢا).
    if (next.code === U.BEH) {
      push(ctx, l, 'iqlab', 'iqlab', { src }, { trigger: 'ب', counts: 2 });
      return;
    }
    if (U.IDGHAM_GHUNNAH_LETTERS.has(next.code)) {
      // Izhar mutlaq: within a single word, ن + و/ي stays clear (دُنْيَا, بُنْيَٰن).
      if (sameWord && (next.code === U.WAW || next.code === U.YEH)) {
        push(ctx, l, 'izhar_halqi', 'izhar_mutlaq', { src, letter: nm(next) }, { trigger: nm(next) });
        return;
      }
      push(ctx, l, 'idgham_ghunnah', 'idgham_ghunnah', { src, letter: nm(next) }, { trigger: nm(next), counts: 2 });
      return;
    }
    if (U.IDGHAM_NO_GHUNNAH_LETTERS.has(next.code)) {
      push(ctx, l, 'idgham_no_ghunnah', 'idgham_no_ghunnah', { src, letter: nm(next) }, { trigger: nm(next) });
      return;
    }
    if (U.HALQI_LETTERS.has(next.code)) {
      push(ctx, l, 'izhar_halqi', 'izhar_halqi', { src, letter: nm(next) }, { trigger: nm(next) });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MEEM SAKINAH  →  ikhfa / idgham / izhar shafawi
// ─────────────────────────────────────────────────────────────────────────────
function detectMeemRules(ctx: Ctx) {
  ctx.letters.forEach((l, k) => {
    if (l.code !== U.MEEM || !l.isSakin || l.shadda) return;
    const next = effectiveNext(ctx, k);
    if (!next) return;
    if (next.code === U.BEH) {
      push(ctx, l, 'ikhfa_shafawi', 'ikhfa_shafawi', {}, { trigger: 'ب', counts: 2 });
    } else if (next.code === U.MEEM) {
      push(ctx, l, 'idgham_shafawi', 'idgham_shafawi', {}, { trigger: 'م', counts: 2 });
    } else {
      push(ctx, l, 'izhar_shafawi', 'izhar_shafawi', { letter: nm(next) }, { trigger: nm(next) });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GHUNNAH MUSHADDADAH  →  نّ / مّ
// ─────────────────────────────────────────────────────────────────────────────
function detectMushaddadah(ctx: Ctx) {
  for (const l of ctx.letters) {
    if (!l.shadda) continue;
    if (l.code === U.NOON || l.code === U.MEEM) {
      push(ctx, l, 'ghunnah_mushaddadah', 'ghunnah_mushaddadah', { letter: nm(l) }, { counts: 2 });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. QALQALAH
// ─────────────────────────────────────────────────────────────────────────────
function detectQalqalah(ctx: Ctx) {
  ctx.letters.forEach((l, k) => {
    if (!U.QALQALAH_LETTERS.has(l.code)) return;
    const final = isVerseFinal(ctx, k);

    if (final) {
      // Stopping makes the final letter sakin whatever vowel is written.
      if (l.tanween === 'fath') return; // becomes madd ‘iwad instead
      const id: TajweedRuleId = l.shadda ? 'qalqalah_akbar' : 'qalqalah_kubra';
      push(ctx, l, id, l.shadda ? 'qalqalah_akbar' : 'qalqalah_kubra', { letter: nm(l) });
      return;
    }
    if (l.isSakin && !l.shadda) {
      push(ctx, l, 'qalqalah_sughra', 'qalqalah_sughra', { letter: nm(l) });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MADD — the full ladder from 2 to 6 counts
// ─────────────────────────────────────────────────────────────────────────────
function detectMadd(ctx: Ctx) {
  const L = ctx.letters;

  L.forEach((l, k) => {
    const prev = prevInWord(ctx, k);
    const nextAny = L[k + 1];
    const nextSame = nextInWord(ctx, k);
    const final = isVerseFinal(ctx, k);

    // ── madd ‘iwad: tanween fath dropped at a stop ────────────────────────
    if (l.tanween === 'fath') {
      const isLastSounded = final || (nextAny && isVerseFinal(ctx, k + 1) && nextAny.code === U.ALEF);
      if (isLastSounded) {
        const end = nextAny && nextAny.wordIndex === l.wordIndex ? nextAny.end : l.end;
        push(ctx, l, 'madd_iwad', 'madd_iwad', {}, { end, counts: 2 });
        return;
      }
    }

    // ── silah: the hidden و/ي of a pronoun ه ──────────────────────────────
    if (l.smallWaw || l.smallYeh) {
      const nxt = L[k + 1];
      const hamzaNext = nxt && nxt.wordIndex !== l.wordIndex && U.HAMZA_FORMS.has(nxt.code);
      if (hamzaNext) {
        push(ctx, l, 'madd_silah_kubra', 'silah_kubra', {}, { counts: 4 });
      } else {
        push(ctx, l, 'madd_silah_sughra', 'silah_sughra', {}, { counts: 2 });
      }
      return;
    }

    // ── madd lazim harfi: a maddah sign on a non-madd letter (الٓمٓ) ───────
    if (l.maddahAbove && !isCarrier(l, prev)) {
      push(ctx, l, 'madd_lazim_harfi', 'lazim_harfi', { letter: nm(l) }, { counts: 6 });
      return;
    }

    // ── madd lin: و/ي sakin after fatha, lengthened only at a stop ────────
    if (isLinLetter(l, prev)) {
      const stops = final || (nextSame !== undefined && isVerseFinal(ctx, k + 1));
      if (stops) {
        push(ctx, l, 'madd_lin', 'madd_lin', { letter: nm(l) }, { counts: 2 });
      }
      return;
    }

    if (!isCarrier(l, prev)) return;

    // The madd letter is found. Now classify it by what follows.
    const badal = prev !== undefined && U.HAMZA_FORMS.has(prev.code);

    // (a) permanent sukun / shadda inside the same word → 6 counts
    if (nextSame && (nextSame.shadda || nextSame.explicitSukun)) {
      push(ctx, l, 'madd_lazim_kalimi', 'lazim_kalimi',
        { obstacle: nextSame.shadda ? 'shadda' : 'sukun', letter: nm(nextSame) },
        { counts: 6, trigger: nm(nextSame) });
      return;
    }
    // (b) hamza in the same word → 4–5 counts, obligatory
    if (nextSame && U.HAMZA_FORMS.has(nextSame.code)) {
      push(ctx, l, 'madd_muttasil', 'muttasil', {}, { counts: 4, trigger: 'ء' });
      return;
    }
    // (c) word-final madd, next word opens with a hamza → 4–5 counts
    if (!nextSame && nextAny && U.HAMZA_FORMS.has(nextAny.code)) {
      push(ctx, l, 'madd_munfasil', 'munfasil', {}, { counts: 4, trigger: 'ء' });
      return;
    }
    // (d) one letter away from the end of the verse → accidental sukun
    if (nextSame && isVerseFinal(ctx, k + 1)) {
      push(ctx, l, 'madd_aarid', 'aarid', {}, { counts: 4, trigger: nm(nextSame) });
      return;
    }
    // (e) hamza *before* the madd letter → substitute madd, stays at 2
    if (badal) {
      push(ctx, l, 'madd_badal', 'badal', {}, { counts: 2 });
      return;
    }
    // (f) everything else is the natural madd
    push(ctx, l, 'madd_tabee', 'tabee', {}, { counts: 2 });
  });
}

/** Is this letter acting as a long vowel here? */
function isCarrier(l: Letter, prev: Letter | undefined): boolean {
  if (l.silentAlways) return false;
  if (l.daggerAlif) return true;
  if (l.code === U.ALEF_MADDA) return true;
  if (l.code === U.ALEF) {
    return !l.haraka && !l.tanween && prev?.haraka === 'fatha';
  }
  // ى is written for both a long "aa" (مُوسَىٰ) and a long "ii" (ٱلَّذِى, فِى).
  if (l.code === U.ALEF_MAKSURA) {
    return !l.haraka && !l.tanween && (prev?.haraka === 'fatha' || prev?.haraka === 'kasra');
  }
  if (l.code === U.WAW) return l.isSakin && !l.shadda && prev?.haraka === 'damma';
  if (l.code === U.YEH) return l.isSakin && !l.shadda && prev?.haraka === 'kasra';
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. TAFKHEEM / TARQEEQ
// ─────────────────────────────────────────────────────────────────────────────
function detectWeight(ctx: Ctx) {
  const L = ctx.letters;

  L.forEach((l, k) => {
    // Always-heavy isti‘la letters
    if (U.ISTILA_LETTERS.has(l.code)) {
      push(ctx, l, 'tafkheem_istila', 'istila', { letter: nm(l) });
      return;
    }

    // ── RA ────────────────────────────────────────────────────────────────
    if (l.code === U.REH) {
      const prev = prevInWord(ctx, k) ?? L[k - 1];
      const final = isVerseFinal(ctx, k);
      const sakin = (l.isSakin && !l.shadda) || final;

      if (!sakin) {
        if (l.haraka === 'kasra' || l.tanween === 'kasr') {
          push(ctx, l, 'ra_tarqeeq', 'ra_haraka_light');
        } else {
          push(ctx, l, 'ra_tafkheem', 'ra_haraka_heavy', {
            vowel: l.haraka === 'damma' || l.tanween === 'damm' ? 'damma' : 'fatha',
          });
        }
        return;
      }

      if (!prev) {
        push(ctx, l, 'ra_tafkheem', 'ra_no_prev');
        return;
      }
      // A sakin ي immediately before keeps the ra light (خَيْرْ, قَدِيرْ).
      if (prev.code === U.YEH && prev.isSakin) {
        push(ctx, l, 'ra_tarqeeq', 'ra_after_sakin_yeh');
        return;
      }
      // Otherwise the nearest *vowelled* letter decides. Walking back matters
      // at a stop: in خُسْرٍ the س is itself sakin, so it is the damma on خ
      // that keeps the ra heavy.
      let governor: Letter | undefined;
      for (let i = k - 1; i >= 0; i--) {
        const cand = L[i];
        if (cand.wordIndex !== l.wordIndex) break;
        if (cand.haraka || cand.tanween) {
          governor = cand;
          break;
        }
      }
      if (!governor || governor.code === U.ALEF_WASLA) {
        push(ctx, l, 'ra_tafkheem', 'ra_wasl_heavy');
        return;
      }
      if (governor.haraka === 'kasra' || governor.tanween === 'kasr') {
        const after = nextInWord(ctx, k);
        if (after && U.ISTILA_LETTERS.has(after.code) && after.haraka !== 'kasra') {
          push(ctx, l, 'ra_tafkheem', 'ra_kasra_then_istila', { letter: nm(after) });
        } else {
          push(ctx, l, 'ra_tarqeeq', 'ra_sakin_kasra_light');
        }
        return;
      }
      push(ctx, l, 'ra_tafkheem', 'ra_sakin_heavy', {
        vowel: governor.haraka === 'damma' ? 'damma' : 'fatha',
      });
      return;
    }

    // ── LAM of lafz al-jalalah ────────────────────────────────────────────
    if (l.code === U.LAM && l.shadda) {
      const after = nextInWord(ctx, k);
      const before = L[k - 1];
      if (!after || after.code !== U.HEH) return;
      if (!before || before.code !== U.LAM) return;

      // Find the vowel that actually governs the lam. In لِلَّهِ it sits on the
      // first lam itself; in ٱللَّهِ that lam is bare, so we step back past the
      // hamzat wasl and take the last vowel of the preceding word.
      let g: Letter | undefined = before.haraka || before.tanween ? before : L[k - 2];
      if (g && g.code === U.ALEF_WASLA) g = L[k - 3];
      const light = g?.haraka === 'kasra' || g?.tanween === 'kasr';
      push(
        ctx, l,
        light ? 'lam_tarqeeq' : 'lam_tafkheem',
        light ? 'lam_light' : 'lam_heavy',
        light ? {} : { vowel: g?.haraka === 'damma' ? 'damma' : 'fatha' },
        { start: before.start },
      );
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SILENT / MERGED GLYPHS
// ─────────────────────────────────────────────────────────────────────────────
function detectSilent(ctx: Ctx) {
  const L = ctx.letters;

  L.forEach((l, k) => {
    if (l.silentAlways) {
      push(ctx, l, 'silent_letter', 'silent_always', { letter: nm(l) });
      return;
    }
    if (l.silentWhenContinuing) {
      push(ctx, l, 'silent_letter', 'silent_continuing', { letter: nm(l) });
      return;
    }
    if (l.code === U.ALEF_WASLA && k > 0) {
      push(ctx, l, 'hamzat_wasl', 'hamzat_wasl');
      return;
    }
    // Solar lam: ٱ + ل (unvowelled) + a solar letter carrying shadda.
    if (l.code === U.LAM && !l.haraka && !l.explicitSukun && !l.shadda) {
      const prev = L[k - 1];
      const next = nextInWord(ctx, k);
      const startsWord = prev && prev.wordIndex === l.wordIndex && prev.code === U.ALEF_WASLA;
      if (startsWord && next && next.shadda && U.SOLAR_LETTERS.has(next.code)) {
        push(ctx, l, 'lam_shamsiyyah', 'lam_shamsiyyah', { letter: nm(next) }, { trigger: nm(next) });
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/** Analyse one verse. Returns one `TajweedSpan[]` per word, in reading order. */
export function analyzeVerse(words: string[]): TajweedSpan[][] {
  const tokens = tokenizeVerse(words);
  const ctx: Ctx = {
    letters: tokens.letters,
    byWord: tokens.byWord,
    words,
    out: words.map(() => []),
  };

  detectNoonRules(ctx);
  detectMeemRules(ctx);
  detectMushaddadah(ctx);
  detectQalqalah(ctx);
  detectMadd(ctx);
  detectWeight(ctx);
  detectSilent(ctx);

  // Stable reading order, then priority, so the inspector reads left-to-right.
  return ctx.out.map((spans) =>
    spans.sort((a, b) => a.start - b.start || getRule(b.ruleId).priority - getRule(a.ruleId).priority),
  );
}

/**
 * Collapse overlapping spans into a flat list of render instructions.
 * Each run is a contiguous slice of the word that shares one colour and one
 * set of rules — exactly what `TajweedWordRenderer` maps over.
 */
export function resolveGlyphRuns(text: string, spans: TajweedSpan[]): GlyphRun[] {
  const n = text.length;
  if (n === 0) return [];

  const family: (GlyphRun['family'])[] = new Array(n).fill('none');
  const prio = new Array<number>(n).fill(-1);
  const rules: TajweedRuleId[][] = Array.from({ length: n }, () => []);

  for (const span of spans) {
    const p = getRule(span.ruleId).priority;
    for (let i = Math.max(0, span.start); i < Math.min(n, span.end); i++) {
      if (!rules[i].includes(span.ruleId)) rules[i].push(span.ruleId);
      if (p > prio[i]) {
        prio[i] = p;
        // Izhar is deliberately rendered in plain ink — "no colour" is itself
        // the lesson: nothing changes about the letter.
        family[i] = getRule(span.ruleId).family === 'izhar' ? 'none' : getRule(span.ruleId).family;
      }
    }
  }

  const runs: GlyphRun[] = [];
  let i = 0;
  while (i < n) {
    const key = `${family[i]}|${rules[i].join(',')}`;
    let j = i + 1;
    while (j < n && `${family[j]}|${rules[j].join(',')}` === key) j++;
    runs.push({ text: text.slice(i, j), family: family[i], ruleIds: [...rules[i]], start: i, end: j });
    i = j;
  }
  return runs;
}

/** Distinct rule ids in a set of spans, in reading order. */
export function uniqueRuleIds(spans: TajweedSpan[]): TajweedRuleId[] {
  const seen: TajweedRuleId[] = [];
  for (const s of spans) if (!seen.includes(s.ruleId)) seen.push(s.ruleId);
  return seen;
}
