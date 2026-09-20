import type { MakhrajId, TajweedRuleId } from '@/types/tajweed';

/** Localisable parts of a Tajweed rule. `labelAr` is never translated. */
export interface RuleText {
  label: string;
  summary: string;
  detail: string;
}
export type RuleDict = Partial<Record<TajweedRuleId, Partial<RuleText>>>;

/** Localisable parts of an articulation zone. `nameAr` and `letters` are not. */
export interface ZoneText {
  name: string;
  description: string;
  cue: string;
}
export type ZoneDict = Partial<Record<MakhrajId, Partial<ZoneText>>>;

/** Localisable parts of one curriculum day. */
export interface DayText {
  title: string;
  objective: string;
  brief: string;
  checkpoints: string[];
  drillPrompt: string;
}
export type DayDict = Partial<Record<number, Partial<DayText>>>;

/** Localisable phase headings on the roadmap. */
export type PhaseDict = Partial<Record<string, { title: string; blurb: string }>>;
