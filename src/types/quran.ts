import type { MakhrajId, TajweedRuleId, TajweedSpan } from './tajweed';

/** Where a word's millisecond bounds came from. Surfaced in the UI so a
 *  learner never mistakes an estimate for a real forced alignment. */
export type TimingSource = 'quran.com-segments' | 'estimated' | 'none';

/** Millisecond bounds of a single word inside its verse audio file. */
export interface WordTiming {
  /** Offset from the start of the *verse* audio file. */
  startMs: number;
  endMs: number;
  durationMs: number;
  source: TimingSource;
}

/**
 * ONE WORD — the atomic interactive unit of the whole application.
 * Produced entirely by the ingestion pipeline; never hand-written.
 */
export interface QuranWord {
  /** Stable composite key: "surah:ayah:position", e.g. "2:255:3". */
  id: string;
  surah: number;
  ayah: number;
  /** 1-based position of the word within its verse. */
  position: number;
  /** Uthmani text including every diacritic and Uthmani-specific mark. */
  textUthmani: string;
  /** Simple/Imlaei form, used for search and for the quiz distractors. */
  textSimple: string;
  transliteration: string | null;
  translation: string | null;
  /** Crisp, isolated native pronunciation of just this word. */
  audioUrl: string | null;
  /** Millisecond bounds inside the verse recitation. */
  timing: WordTiming | null;
  /** Character-level colour instructions. */
  spans: TajweedSpan[];
  /** De-duplicated rule ids present in this word, in reading order. */
  ruleIds: TajweedRuleId[];
  /** Articulation zones exercised by this word. */
  makharij: MakhrajId[];
}

/** Verse-level audio descriptor. */
export interface VerseAudio {
  /** Full URL of the per-ayah mp3 that `WordTiming` offsets refer to. */
  verseAudioUrl: string;
  reciterId: number;
  reciterName: string;
  durationMs: number | null;
  timingSource: TimingSource;
}

/**
 * ONE VERSE, fully analysed and ready to render.
 * This is the payload shape returned by `/api/chapter/[surah]`.
 */
export interface VerseData {
  /** "surah:ayah" */
  verseKey: string;
  surah: number;
  ayah: number;
  textUthmani: string;
  translation: string | null;
  words: QuranWord[];
  audio: VerseAudio;
  /** rule id -> number of occurrences in this verse. Powers rule filtering. */
  ruleSummary: Partial<Record<TajweedRuleId, number>>;
  /** Engine version that produced the analysis; lets caches invalidate. */
  engineVersion: string;
}

export interface ChapterData {
  surah: number;
  nameArabic: string;
  nameSimple: string;
  translatedName: string;
  versesCount: number;
  revelationPlace: string;
  bismillahPre: boolean;
  verses: VerseData[];
  /** True when the live API was unreachable and bundled text was used. */
  offlineFallback: boolean;
  /** Which language the verse translations are in. */
  translationLocale: string;
  /** Attribution for the translation actually served. */
  translationCredit: string;
  /**
   * quran.com publishes word-by-word glosses in English only for most
   * languages. When true the per-word meanings are English even though the
   * verse translation is not — the UI says so rather than pretending.
   */
  wordGlossesAreEnglish: boolean;
}

export interface Reciter {
  id: number;
  name: string;
  style: string;
  /** Whether quran.com publishes word segments for this reciter. */
  hasSegments: boolean;
}
