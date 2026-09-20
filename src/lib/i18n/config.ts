import type { Locale, LocaleMeta } from '@/types/i18n';

/**
 * ============================================================================
 *  LOCALE REGISTRY
 * ============================================================================
 *  English is the source of truth. Tamil and Sinhala dictionaries are partial
 *  by design: any key they do not define falls back to English rather than
 *  rendering an empty string, so a half-finished translation can never break
 *  a screen.
 *
 *  TRANSLATION PROVENANCE — please read before shipping to learners:
 *  the Qur'an verse translations come from published, attributed works via
 *  quran.com. The *interface and teaching text* in Tamil and Sinhala was
 *  produced for this build and has NOT been reviewed by a qualified native
 *  speaker. Tajweed is religious instruction; have a competent teacher check
 *  the rule explanations before this is used for real study.
 */

export const LOCALES: Record<Locale, LocaleMeta> = {
  en: {
    code: 'en',
    label: 'English',
    englishLabel: 'English',
    dir: 'ltr',
    translationId: 20,
    translationCredit: 'Saheeh International',
    hasWordByWord: true,
    fontFamily: 'Inter',
    sample: 'In the name of Allah',
  },
  ta: {
    code: 'ta',
    label: 'தமிழ்',
    englishLabel: 'Tamil',
    dir: 'ltr',
    translationId: 229,
    translationCredit: 'Sheikh Omar Sharif bin Abdul Salam',
    hasWordByWord: false,
    fontFamily: 'Noto Sans Tamil',
    sample: 'அல்லாஹ்வின் திருப்பெயரால்',
  },
  si: {
    code: 'si',
    label: 'සිංහල',
    englishLabel: 'Sinhala',
    dir: 'ltr',
    translationId: 228,
    translationCredit: 'Ruwwad Center',
    hasWordByWord: false,
    fontFamily: 'Noto Sans Sinhala',
    sample: 'අල්ලාහ්ගේ නාමයෙන්',
  },
};

export const LOCALE_ORDER: Locale[] = ['en', 'ta', 'si'];
export const DEFAULT_LOCALE: Locale = 'en';

export const isLocale = (v: unknown): v is Locale =>
  typeof v === 'string' && (LOCALE_ORDER as string[]).includes(v);

export const localeMeta = (l: Locale): LocaleMeta => LOCALES[l] ?? LOCALES[DEFAULT_LOCALE];

/**
 * Merge a partial translation over the English base.
 * Plain objects recurse; everything else (strings, arrays) replaces wholesale,
 * because a half-translated array of checkpoints is worse than the English one.
 */
export function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (
    typeof base !== 'object' ||
    base === null ||
    Array.isArray(base) ||
    typeof override !== 'object' ||
    Array.isArray(override)
  ) {
    return override as T;
  }
  const out = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    out[k] = deepMerge((base as Record<string, unknown>)[k], v);
  }
  return out as T;
}
