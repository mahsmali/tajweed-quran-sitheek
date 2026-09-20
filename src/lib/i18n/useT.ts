'use client';

import { useEffect, useMemo } from 'react';
import { useLocaleStore } from '@/store/useLocaleStore';
import { getTranslator, type Translator } from './index';

/**
 * The single entry point components use for text.
 *
 * Zustand's `persist` hydrates from localStorage after the first paint, so the
 * server and the first client render both use the default locale and match.
 * The `lang` attribute is applied in an effect for the same reason — setting
 * it during render would trip a hydration mismatch.
 */
export function useT(): Translator {
  const locale = useLocaleStore((s) => s.locale);
  const translator = useMemo(() => getTranslator(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = translator.meta.dir;
  }, [locale, translator.meta.dir]);

  return translator;
}
