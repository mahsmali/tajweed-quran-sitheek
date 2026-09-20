import type { MakhrajId, RuleFamily, TajweedRuleId } from './tajweed';

/** A contiguous stretch of verses a lesson draws its practice material from. */
export interface VerseRange {
  surah: number;
  from: number;
  to: number;
  /** Human label for the roadmap card, e.g. "Al-Ikhlas 1–4". */
  label: string;
}

export type CurriculumPhase = 'foundation' | 'nasal' | 'elongation' | 'weight' | 'mastery';

export interface PhaseMeta {
  id: CurriculumPhase;
  title: string;
  blurb: string;
  days: [number, number];
}

/**
 * ONE DAY OF THE 30-DAY PROGRAMME.
 *
 * The important field is `ruleIds`: it is the join key between the curriculum
 * and the rendering engine. The lesson screen loads the practice ranges, runs
 * the normal Tajweed analysis, and then dims every word whose `ruleIds` do not
 * intersect this list — so each day's verses arrive pre-filtered with no
 * bespoke content authoring at all.
 */
export interface DailyMilestone {
  day: number;
  title: string;
  titleAr: string;
  phase: CurriculumPhase;
  /** One sentence: what the learner will be able to do by the end. */
  objective: string;
  /** The teaching text shown above the practice verses. */
  brief: string;
  /** Rules activated on this day — drives filtering, quizzes and progress. */
  ruleIds: TajweedRuleId[];
  /** The anchor colour this day belongs to, used for the timeline spine. */
  focusFamily: RuleFamily;
  /** Articulation zones foregrounded in the Makhraj visualiser. */
  makharij: MakhrajId[];
  estimatedMinutes: number;
  practice: VerseRange[];
  /** Seeds the gamified quiz for this day. */
  drill: { prompt: string; ruleIds: TajweedRuleId[]; questionCount: number };
  /** Tickable self-assessment statements. */
  checkpoints: string[];
  /** Day that must be completed first; null for day 1. */
  unlocksAfter: number | null;
}

/** Per-day record persisted in the learner's progress matrix. */
export interface DayProgress {
  day: number;
  completedAt: string | null;
  /** 0–100, derived from checkpoints ticked + quiz accuracy. */
  score: number;
  checkpointsDone: number[];
  quizBest: { correct: number; total: number } | null;
  secondsStudied: number;
}

export interface QuizSessionResult {
  day: number | null;
  ruleIds: TajweedRuleId[];
  correct: number;
  total: number;
  bestStreak: number;
  finishedAt: string;
}
