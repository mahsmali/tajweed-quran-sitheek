/**
 * ============================================================================
 *  THE COMPLETE-ALPHABET VERSES
 * ============================================================================
 *  Āl-‘Imrān 3:154 and Al-Fath 48:29 are traditionally cited as each containing
 *  every letter of the Arabic alphabet. `npm run check:alphabet` verifies that
 *  against the Uthmani text rather than taking it on trust — both come back
 *  28/28, and between them they exercise every articulation zone that any
 *  letter owns (16 of 17; the seventeenth, al-khayshum, is the nasal passage,
 *  which is the exit for the ghunnah rather than the makhraj of any letter).
 *
 *  That makes them the ideal makharij material: one reading that visits every
 *  point in the mouth, instead of hunting for examples letter by letter.
 */

/**
 * Identity only — every statistic (word count, rule count, alphabet coverage,
 * zones touched) is derived from the analysed verse at runtime rather than
 * stored here. Upstream word segmentation differs slightly between endpoints,
 * so a hardcoded count would silently drift out of step with what the reader
 * is actually showing.
 */
export interface ShowcaseVerse {
  verseKey: string;
  surah: number;
  ayah: number;
  /** Transliterated surah name, for the UI. */
  surahName: string;
  /** Arabic surah name. */
  surahNameAr: string;
}

/** The 28 letters, in alphabetical order. */
export const ARABIC_ALPHABET = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');

/**
 * Fold the orthographic variants onto their base letter, so أ إ آ ٱ all count
 * as ا and ة counts as ه. Without this a verse that plainly contains every
 * letter appears to be missing several.
 */
const VARIANTS: Record<string, string> = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي',
};
export const normaliseLetter = (ch: string): string => VARIANTS[ch] ?? ch;

export const SHOWCASE_VERSES: ShowcaseVerse[] = [
  { verseKey: '3:154', surah: 3, ayah: 154, surahName: 'Āl-‘Imrān', surahNameAr: 'آل عمران' },
  { verseKey: '48:29', surah: 48, ayah: 29, surahName: 'Al-Fath', surahNameAr: 'الفتح' },
];

export const findShowcase = (verseKey: string) =>
  SHOWCASE_VERSES.find((v) => v.verseKey === verseKey) ?? null;
