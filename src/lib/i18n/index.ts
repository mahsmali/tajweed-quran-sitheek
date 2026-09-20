import type { Locale } from '@/types/i18n';
import type { MakhrajId, TajweedRuleId, TajweedSpan } from '@/types/tajweed';
import type { CurriculumPhase } from '@/types/curriculum';

import { DEFAULT_LOCALE, LOCALES, deepMerge, localeMeta } from './config';
import { type Strings, en } from './strings/en';
import { ta } from './strings/ta';
import { si } from './strings/si';
import { type DayDict, type PhaseDict, type RuleDict, type ZoneDict } from './content';
import { rulesTa } from './rules/ta';
import { rulesSi } from './rules/si';
import { makharijTa } from './makharij/ta';
import { makharijSi } from './makharij/si';
import { curriculumTa, phasesTa } from './curriculum/ta';
import { curriculumSi, phasesSi } from './curriculum/si';
import { formatNote } from './notes';

import { TAJWEED_RULES } from '@/lib/tajweed/rules';
import { MAKHRAJ_ZONES } from '@/lib/tajweed/makharij';
import { CURRICULUM, PHASES } from '@/lib/curriculum/plan';

export { LOCALES, LOCALE_ORDER, DEFAULT_LOCALE, isLocale, localeMeta } from './config';

// ── merged dictionaries, built once ────────────────────────────────────────
const STRINGS: Record<Locale, Strings> = {
  en,
  ta: deepMerge(en, ta),
  si: deepMerge(en, si),
};

const RULE_TEXT: Record<Locale, RuleDict> = { en: {}, ta: rulesTa, si: rulesSi };
const ZONE_TEXT: Record<Locale, ZoneDict> = { en: {}, ta: makharijTa, si: makharijSi };
const DAY_TEXT: Record<Locale, DayDict> = { en: {}, ta: curriculumTa, si: curriculumSi };
const PHASE_TEXT: Record<Locale, PhaseDict> = { en: {}, ta: phasesTa, si: phasesSi };

/** Resolve a dotted path against the dictionary. */
function lookup(dict: unknown, path: string): string | undefined {
  let cur: unknown = dict;
  for (const key of path.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === 'string' ? cur : undefined;
}

const interpolate = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : s;

export interface Translator {
  locale: Locale;
  meta: ReturnType<typeof localeMeta>;
  /** Dotted-path lookup with {placeholder} interpolation. */
  t: (path: string, vars?: Record<string, string | number>) => string;
  /** A Tajweed rule with its localised label/summary/detail. */
  rule: (id: TajweedRuleId) => {
    id: TajweedRuleId;
    label: string;
    labelAr: string;
    summary: string;
    detail: string;
    counts?: number[];
    family: (typeof TAJWEED_RULES)[TajweedRuleId]['family'];
    makharij: MakhrajId[];
  };
  /** An articulation zone with localised prose. */
  zone: (id: MakhrajId) => {
    id: MakhrajId;
    name: string;
    nameAr: string;
    letters: string;
    description: string;
    cue: string;
    group: (typeof MAKHRAJ_ZONES)[MakhrajId]['group'];
  };
  /** One curriculum day with localised teaching text. */
  day: (n: number) => {
    title: string;
    titleAr: string;
    objective: string;
    brief: string;
    checkpoints: string[];
    drillPrompt: string;
  } | null;
  phase: (id: CurriculumPhase) => { title: string; blurb: string };
  /** The engine's per-span explanation, in this language. */
  note: (span: Pick<TajweedSpan, 'noteKey' | 'noteParams' | 'note'>) => string;
}

const cache = new Map<Locale, Translator>();

export function getTranslator(locale: Locale): Translator {
  const hit = cache.get(locale);
  if (hit) return hit;

  const loc = LOCALES[locale] ? locale : DEFAULT_LOCALE;
  const dict = STRINGS[loc];

  const translator: Translator = {
    locale: loc,
    meta: localeMeta(loc),

    t: (path, vars) => {
      const value = lookup(dict, path) ?? lookup(en, path);
      // A missing key is a bug, but it must never render as a blank screen —
      // show the path so it is obvious in the UI and in a screenshot.
      return interpolate(value ?? path, vars);
    },

    rule: (id) => {
      const base = TAJWEED_RULES[id];
      const over = RULE_TEXT[loc]?.[id];
      return {
        id,
        label: over?.label ?? base.label,
        labelAr: base.labelAr,
        summary: over?.summary ?? base.summary,
        detail: over?.detail ?? base.detail,
        counts: base.counts,
        family: base.family,
        makharij: base.makharij,
      };
    },

    zone: (id) => {
      const base = MAKHRAJ_ZONES[id];
      const over = ZONE_TEXT[loc]?.[id];
      return {
        id,
        name: over?.name ?? base.name,
        nameAr: base.nameAr,
        letters: base.letters,
        description: over?.description ?? base.description,
        cue: over?.cue ?? base.cue,
        group: base.group,
      };
    },

    day: (n) => {
      const base = CURRICULUM.find((d) => d.day === n);
      if (!base) return null;
      const over = DAY_TEXT[loc]?.[n];
      return {
        title: over?.title ?? base.title,
        titleAr: base.titleAr,
        objective: over?.objective ?? base.objective,
        brief: over?.brief ?? base.brief,
        checkpoints: over?.checkpoints ?? base.checkpoints,
        drillPrompt: over?.drillPrompt ?? base.drill.prompt,
      };
    },

    phase: (id) => {
      const base = PHASES.find((p) => p.id === id);
      const over = PHASE_TEXT[loc]?.[id];
      return {
        title: over?.title ?? base?.title ?? id,
        blurb: over?.blurb ?? base?.blurb ?? '',
      };
    },

    note: (span) => {
      if (!span.noteKey) return span.note;
      return formatNote(loc, span.noteKey, span.noteParams ?? {}) || span.note;
    },
  };

  cache.set(loc, translator);
  return translator;
}
