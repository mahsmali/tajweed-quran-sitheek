'use client';

import { useMemo, useState } from 'react';
import { GamifiedQuizScreen } from '@/components/quiz/GamifiedQuizScreen';
import { FAMILY_ORDER, FAMILY_STYLE, RULES_BY_FAMILY } from '@/lib/tajweed/rules';
import { useProgressStore, weakestRule } from '@/store/useProgressStore';
import { useT } from '@/lib/i18n/useT';
import { SectionHeading } from '@/components/SectionHeading';
import type { RuleFamily, TajweedRuleId } from '@/types/tajweed';

/** Rule sets that produce good, unambiguous questions. */
const MODES: { id: string; labelKey: string; family: RuleFamily | 'mixed'; ruleIds: TajweedRuleId[] }[] = [
  { id: 'mixed', labelKey: 'quiz.modeMixed', family: 'mixed', ruleIds: ['ikhfa', 'idgham_ghunnah', 'iqlab', 'ghunnah_mushaddadah', 'qalqalah_kubra', 'qalqalah_sughra', 'madd_tabee', 'madd_aarid', 'ra_tarqeeq', 'lam_shamsiyyah'] },
  { id: 'madd', labelKey: 'quiz.modeMadd', family: 'madd', ruleIds: RULES_BY_FAMILY.madd.map((r) => r.id) },
  { id: 'ghunnah', labelKey: 'quiz.modeGhunnah', family: 'ghunnah', ruleIds: RULES_BY_FAMILY.ghunnah.map((r) => r.id) },
  { id: 'qalqalah', labelKey: 'quiz.modeQalqalah', family: 'qalqalah', ruleIds: RULES_BY_FAMILY.qalqalah.map((r) => r.id) },
  { id: 'makharij', labelKey: 'quiz.modeMakharij', family: 'makharij', ruleIds: RULES_BY_FAMILY.makharij.map((r) => r.id) },
  { id: 'silent', labelKey: 'quiz.modeSilent', family: 'silent', ruleIds: RULES_BY_FAMILY.silent.map((r) => r.id) },
];

export default function QuizPage() {
  const t = useT();
  const [modeId, setModeId] = useState('mixed');
  const [count, setCount] = useState(8);
  const mode = MODES.find((m) => m.id === modeId)!;

  const sessions = useProgressStore((s) => s.sessions);
  const bestStreak = useProgressStore((s) => s.bestStreak);
  const ruleStats = useProgressStore((s) => s.ruleStats);
  const weakest = useMemo(() => weakestRule(ruleStats), [ruleStats]);

  const lifetime = useMemo(() => {
    const total = sessions.reduce((s, x) => s + x.total, 0);
    const right = sessions.reduce((s, x) => s + x.correct, 0);
    return { total, right, pct: total ? Math.round((right / total) * 100) : null };
  }, [sessions]);

  return (
    <div className="space-y-5">
      <header className="panel px-5 py-5">
        <SectionHeading
          as="h1"
          size="lg"
          eyebrow={t.t('quiz.eyebrow')}
          title={t.t('quiz.title')}
          blurb={t.t('quiz.blurb')}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModeId(m.id)}
              className={[
                'rounded-xl border px-3 py-1.5 text-[12.5px] font-medium transition',
                m.id === modeId ? 'border-accent bg-accent/12 text-ink' : 'border-line bg-raised text-muted hover:text-ink',
              ].join(' ')}
            >
              {m.family !== 'mixed' && (
                <span className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${FAMILY_STYLE[m.family].dot}`} />
              )}
              {t.t(m.labelKey)}
            </button>
          ))}

          <label className="ml-auto flex items-center gap-2 text-[12px] text-muted">
            {t.t('quiz.questions')}
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="rounded-lg border border-line bg-raised px-2 py-1.5 text-[12.5px] font-medium text-ink"
            >
              {[5, 8, 12, 20].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        {(lifetime.pct !== null || bestStreak > 0) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3.5">
            {lifetime.pct !== null && (
              <span className="chip bg-ink/[0.05] text-muted">
                {t.t('quiz.lifetime')} <strong className="ml-1 text-ink">{lifetime.pct}%</strong>
                <span className="ml-1">({lifetime.right}/{lifetime.total})</span>
              </span>
            )}
            {bestStreak > 0 && (
              <span className="chip bg-makharij/10 text-makharij">
                {t.t('quiz.bestStreak', { n: bestStreak })}
              </span>
            )}
            {weakest && (
              <span className="chip bg-madd/10 text-madd">
                {t.t('quiz.weakest', {
                  rule: t.rule(weakest.ruleId).label,
                  pct: Math.round(weakest.accuracy * 100),
                })}
              </span>
            )}
          </div>
        )}
      </header>

      <GamifiedQuizScreen key={`${modeId}-${count}`} ruleIds={mode.ruleIds} questionCount={count} />
    </div>
  );
}
