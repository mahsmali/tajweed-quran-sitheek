'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CURRICULUM } from '@/lib/curriculum/plan';
import type { DayProgress, QuizSessionResult } from '@/types/curriculum';
import type { TajweedRuleId } from '@/types/tajweed';

interface ProgressState {
  days: Record<number, DayProgress>;
  sessions: QuizSessionResult[];
  /** Lifetime best streak across every quiz session. */
  bestStreak: number;
  /** Per-rule accuracy, used to surface the learner's weakest rule. */
  ruleStats: Record<string, { seen: number; correct: number }>;
  startedAt: string | null;

  toggleCheckpoint: (day: number, index: number) => void;
  completeDay: (day: number) => void;
  addStudyTime: (day: number, seconds: number) => void;
  recordQuiz: (result: QuizSessionResult) => void;
  recordAnswer: (ruleId: TajweedRuleId, correct: boolean) => void;
  reset: () => void;
}

const blank = (day: number): DayProgress => ({
  day, completedAt: null, score: 0, checkpointsDone: [], quizBest: null, secondsStudied: 0,
});

/** Score = 60% checkpoints + 40% quiz accuracy. */
function scoreFor(p: DayProgress, checkpointCount: number): number {
  const cp = checkpointCount ? p.checkpointsDone.length / checkpointCount : 0;
  const qz = p.quizBest && p.quizBest.total ? p.quizBest.correct / p.quizBest.total : 0;
  return Math.round((cp * 0.6 + qz * 0.4) * 100);
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      days: {},
      sessions: [],
      bestStreak: 0,
      ruleStats: {},
      startedAt: null,

      toggleCheckpoint: (day, index) =>
        set((s) => {
          const cur = s.days[day] ?? blank(day);
          const done = cur.checkpointsDone.includes(index)
            ? cur.checkpointsDone.filter((i) => i !== index)
            : [...cur.checkpointsDone, index];
          const count = CURRICULUM.find((d) => d.day === day)?.checkpoints.length ?? 0;
          const next: DayProgress = { ...cur, checkpointsDone: done };
          next.score = scoreFor(next, count);
          // All boxes ticked is itself a completion signal.
          if (done.length === count && count > 0 && !next.completedAt) next.completedAt = new Date().toISOString();
          return { days: { ...s.days, [day]: next }, startedAt: s.startedAt ?? new Date().toISOString() };
        }),

      completeDay: (day) =>
        set((s) => {
          const cur = s.days[day] ?? blank(day);
          const count = CURRICULUM.find((d) => d.day === day)?.checkpoints.length ?? 0;
          const next: DayProgress = { ...cur, completedAt: cur.completedAt ?? new Date().toISOString() };
          next.score = Math.max(next.score, scoreFor(next, count));
          return { days: { ...s.days, [day]: next }, startedAt: s.startedAt ?? new Date().toISOString() };
        }),

      addStudyTime: (day, seconds) =>
        set((s) => {
          const cur = s.days[day] ?? blank(day);
          return { days: { ...s.days, [day]: { ...cur, secondsStudied: cur.secondsStudied + seconds } } };
        }),

      recordQuiz: (result) =>
        set((s) => {
          const sessions = [result, ...s.sessions].slice(0, 50);
          const bestStreak = Math.max(s.bestStreak, result.bestStreak);
          if (result.day == null) return { sessions, bestStreak };
          const cur = s.days[result.day] ?? blank(result.day);
          const better =
            !cur.quizBest || result.correct / result.total > cur.quizBest.correct / cur.quizBest.total;
          const next: DayProgress = {
            ...cur,
            quizBest: better ? { correct: result.correct, total: result.total } : cur.quizBest,
          };
          const count = CURRICULUM.find((d) => d.day === result.day)?.checkpoints.length ?? 0;
          next.score = scoreFor(next, count);
          return { sessions, bestStreak, days: { ...s.days, [result.day]: next } };
        }),

      recordAnswer: (ruleId, correct) =>
        set((s) => {
          const cur = s.ruleStats[ruleId] ?? { seen: 0, correct: 0 };
          return {
            ruleStats: { ...s.ruleStats, [ruleId]: { seen: cur.seen + 1, correct: cur.correct + (correct ? 1 : 0) } },
            startedAt: s.startedAt ?? new Date().toISOString(),
          };
        }),

      reset: () => set({ days: {}, sessions: [], bestStreak: 0, ruleStats: {}, startedAt: null }),
    }),
    { name: 'tajweed-progress-v1' },
  ),
);

// ── derived selectors (kept out of the store so they never trigger writes) ──

export function isDayUnlocked(days: Record<number, DayProgress>, day: number): boolean {
  const m = CURRICULUM.find((d) => d.day === day);
  if (!m || m.unlocksAfter === null) return true;
  return !!days[m.unlocksAfter]?.completedAt;
}

export function completedCount(days: Record<number, DayProgress>): number {
  return Object.values(days).filter((d) => d.completedAt).length;
}

/** The furthest day the learner may open right now. */
export function currentDay(days: Record<number, DayProgress>): number {
  for (const m of CURRICULUM) if (!days[m.day]?.completedAt) return m.day;
  return 30;
}

/** Lowest-accuracy rule with at least three attempts — the "focus next" hint. */
export function weakestRule(
  ruleStats: Record<string, { seen: number; correct: number }>,
): { ruleId: TajweedRuleId; accuracy: number } | null {
  let worst: { ruleId: TajweedRuleId; accuracy: number } | null = null;
  for (const [id, s] of Object.entries(ruleStats)) {
    if (s.seen < 3) continue;
    const accuracy = s.correct / s.seen;
    if (!worst || accuracy < worst.accuracy) worst = { ruleId: id as TajweedRuleId, accuracy };
  }
  return worst;
}
