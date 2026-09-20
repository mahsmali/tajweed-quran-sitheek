import type { Locale } from '@/types/i18n';
import { type NoteKey, type NoteParams, fill } from './keys';
import { type NoteLocale, notesEn } from './en';
import { notesTa } from './ta';
import { notesSi } from './si';

export type { NoteKey, NoteParams } from './keys';

const TABLES: Record<Locale, NoteLocale> = { en: notesEn, ta: notesTa, si: notesSi };

/**
 * Render one engine note in the requested language.
 * Falls back to English for any locale or key that is not covered.
 */
export function formatNote(locale: Locale, key: NoteKey, params: NoteParams = {}): string {
  const table = TABLES[locale] ?? notesEn;
  const template = table.templates[key] ?? notesEn.templates[key];
  if (!template) return '';

  return fill(template, {
    letter: params.letter ?? '',
    src: params.src ? (table.src[params.src] ?? notesEn.src[params.src]) : '',
    vowel: params.vowel ? (table.vowel[params.vowel] ?? notesEn.vowel[params.vowel]) : '',
    obstacle: params.obstacle
      ? (table.obstacle[params.obstacle] ?? notesEn.obstacle[params.obstacle])
      : '',
  });
}

/** The English rendering the engine stores on every span. */
export const formatNoteEn = (key: NoteKey, params: NoteParams = {}) => formatNote('en', key, params);
