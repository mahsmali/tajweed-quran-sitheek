export type Locale = 'en' | 'ta' | 'si';

export interface LocaleMeta {
  code: Locale;
  /** The language's own name, always shown in its own script. */
  label: string;
  englishLabel: string;
  dir: 'ltr';
  /** quran.com translation resource used for verse translations. */
  translationId: number;
  translationCredit: string;
  /**
   * quran.com only publishes word-by-word glosses for a handful of languages.
   * When false the UI says so rather than showing English under a Tamil or
   * Sinhala label as though it had been translated.
   */
  hasWordByWord: boolean;
  /** Google font family for this script. */
  fontFamily: string;
  sample: string;
}

/** Recursively optional — translations may cover only part of the dictionary. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
