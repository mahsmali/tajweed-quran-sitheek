import * as U from './unicode';

/**
 * A base letter together with every mark that hangs off it, plus its exact
 * character range inside the source word. The engine works exclusively on
 * these — it never indexes raw UTF-16 offsets by hand.
 */
export interface Letter {
  ch: string;
  code: number;
  /** index of the base letter within the word string */
  start: number;
  /** exclusive end, i.e. after the last attached mark */
  end: number;
  marks: number[];

  haraka: 'fatha' | 'damma' | 'kasra' | null;
  tanween: 'fath' | 'damm' | 'kasr' | null;
  shadda: boolean;
  /** An explicitly written sukun (ْ). */
  explicitSukun: boolean;
  /** No vowel of any kind → the letter is sakin. */
  isSakin: boolean;

  daggerAlif: boolean; // 0670
  smallWaw: boolean; // 06E5
  smallYeh: boolean; // 06E6
  maddahAbove: boolean; // 0653
  iqlabMark: boolean; // 06E2
  /** 06DF — never pronounced. */
  silentAlways: boolean;
  /** 06E0 — silent when continuing, pronounced when stopping. */
  silentWhenContinuing: boolean;

  /** index of the word inside the verse (filled by tokenizeVerse) */
  wordIndex: number;
  /** index of this letter inside its word */
  letterIndex: number;
}

export interface VerseTokens {
  /** Words as they appear in the verse, already trimmed. */
  words: string[];
  /** Flat letter stream across the whole verse, in reading order. */
  letters: Letter[];
  /** letters grouped per word */
  byWord: Letter[][];
}

/** Tokenise a single word into letters-with-marks. */
export function tokenizeWord(word: string, wordIndex = 0): Letter[] {
  const letters: Letter[] = [];
  const chars = Array.from(word);
  // Map from array index -> string offset, because Arabic marks are BMP but we
  // stay safe against any surrogate pairs in annotation signs.
  const offsets: number[] = [];
  let off = 0;
  for (const c of chars) {
    offsets.push(off);
    off += c.length;
  }

  let i = 0;
  while (i < chars.length) {
    const code = chars[i].codePointAt(0)!;
    if (!U.isArabicLetter(code)) {
      i++;
      continue;
    }

    const marks: number[] = [];
    let j = i + 1;
    while (j < chars.length) {
      const c = chars[j].codePointAt(0)!;
      if (U.isMark(c)) {
        if (c !== U.TATWEEL) marks.push(c);
        j++;
      } else break;
    }

    const has = (m: number) => marks.includes(m);
    const haraka = has(U.FATHA) ? 'fatha' : has(U.DAMMA) ? 'damma' : has(U.KASRA) ? 'kasra' : null;
    const tanween = has(U.FATHATAN) ? 'fath' : has(U.DAMMATAN) ? 'damm' : has(U.KASRATAN) ? 'kasr' : null;
    const shadda = has(U.SHADDA);
    const explicitSukun = has(U.SUKUN);
    const daggerAlif = has(U.SUPERSCRIPT_ALEF);
    const silentAlways = has(U.SMALL_HIGH_ROUNDED_ZERO);

    letters.push({
      ch: chars[i],
      code,
      start: offsets[i],
      end: j < chars.length ? offsets[j] : word.length,
      marks,
      haraka,
      tanween,
      shadda,
      explicitSukun,
      // In the Uthmani script a sukun is frequently *not* written; the absence
      // of any vowel is itself the signal that the letter is sakin.
      isSakin: !haraka && !tanween && (explicitSukun || (!shadda && !daggerAlif)),
      daggerAlif,
      smallWaw: has(U.SMALL_WAW),
      smallYeh: has(U.SMALL_YEH),
      maddahAbove: has(U.MADDAH_ABOVE),
      iqlabMark: has(U.SMALL_HIGH_MEEM_ISOLATED),
      silentAlways,
      silentWhenContinuing: has(U.SMALL_HIGH_UPRIGHT_ZERO),
      wordIndex,
      letterIndex: letters.length,
    });
    i = j;
  }
  return letters;
}

/** Split a verse into words and tokenise each, keeping a flat stream too. */
export function tokenizeVerse(words: string[]): VerseTokens {
  const byWord = words.map((w, idx) => tokenizeWord(w, idx));
  return { words, byWord, letters: byWord.flat() };
}

/** Does this letter function as a long-vowel (madd) carrier? */
export function isMaddCarrier(letter: Letter, prev: Letter | undefined): boolean {
  if (letter.daggerAlif || letter.smallWaw || letter.smallYeh) return true;
  if (letter.code === U.ALEF_MADDA) return true;
  if (letter.code === U.ALEF || letter.code === U.ALEF_MAKSURA) {
    if (letter.silentAlways) return false;
    return !letter.haraka && (prev?.haraka === 'fatha' || !!prev?.tanween === false);
  }
  if (letter.code === U.WAW) return letter.isSakin && prev?.haraka === 'damma';
  if (letter.code === U.YEH) return letter.isSakin && prev?.haraka === 'kasra';
  return false;
}

/** Layyin (soft) letter: و/ي sakin preceded by fatha. */
export function isLinLetter(letter: Letter, prev: Letter | undefined): boolean {
  return (letter.code === U.WAW || letter.code === U.YEH) && letter.isSakin && prev?.haraka === 'fatha';
}
