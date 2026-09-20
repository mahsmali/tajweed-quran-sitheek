'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ReaderScreen } from '@/components/ReaderScreen';
import { GamifiedQuizScreen } from '@/components/quiz/GamifiedQuizScreen';
import { MakhrajVisualizer } from '@/components/MakhrajVisualizer';
import { AlphabetShowcase } from '@/components/AlphabetShowcase';
import { FAMILY_STYLE } from '@/lib/tajweed/rules';
import { MAKHRAJ_ZONES } from '@/lib/tajweed/makharij';
import { CURRICULUM } from '@/lib/curriculum/plan';
import { useProgressStore, isDayUnlocked } from '@/store/useProgressStore';
import { useReaderStore } from '@/store/useReaderStore';
import { useT } from '@/lib/i18n/useT';
import { playFanfare } from '@/lib/audio/chime';
import type { DailyMilestone } from '@/types/curriculum';

type Tab = 'practice' | 'drill' | 'anatomy';

export function LessonScreen({ milestone }: { milestone: DailyMilestone }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('practice');
  const [rangeIndex, setRangeIndex] = useState(0);

  const days = useProgressStore((s) => s.days);
  const toggleCheckpoint = useProgressStore((s) => s.toggleCheckpoint);
  const completeDay = useProgressStore((s) => s.completeDay);
  const addStudyTime = useProgressStore((s) => s.addStudyTime);
  const setRuleFilter = useReaderStore((s) => s.setRuleFilter);

  const progress = days[milestone.day];
  const unlocked = isDayUnlocked(days, milestone.day);
  const range = milestone.practice[rangeIndex] ?? milestone.practice[0];

  // Filter the reader to this day's rules as soon as the lesson opens, and
  // release the filter on the way out so the free reader is unaffected.
  useEffect(() => {
    setRuleFilter(milestone.ruleIds.length ? milestone.ruleIds : null);
    return () => setRuleFilter(null);
  }, [milestone.ruleIds, setRuleFilter]);

  // Crude but honest time-on-task: count wall-clock seconds spent on the page.
  useEffect(() => {
    const started = Date.now();
    return () => addStudyTime(milestone.day, Math.round((Date.now() - started) / 1000));
  }, [milestone.day, addStudyTime]);

  const style = FAMILY_STYLE[milestone.focusFamily];
  const day = t.day(milestone.day);
  const prev = CURRICULUM.find((d) => d.day === milestone.day - 1);
  const next = CURRICULUM.find((d) => d.day === milestone.day + 1);
  const quizSurahs = useMemo(() => [...new Set(milestone.practice.map((p) => p.surah))], [milestone.practice]);

  if (!unlocked) {
    return (
      <div className="panel px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-ink">
          {t.t('curriculum.lockedTitle', { day: milestone.day })}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] text-muted">
          {t.t('curriculum.lockedBody', { prev: milestone.unlocksAfter ?? 1 })}
        </p>
        <Link
          href={`/curriculum/${milestone.unlocksAfter}`}
          className="mt-5 inline-block rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-white"
        >
          {t.t('curriculum.goToDay', { day: milestone.unlocksAfter ?? 1 })}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── lesson header ────────────────────────────────────────────────── */}
      <header className="panel paper relative overflow-hidden px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link href="/curriculum" className="text-[11px] font-medium text-muted hover:text-ink">
                {t.t('curriculum.backToRoadmap')}
              </Link>
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                {t.t('curriculum.day', { n: milestone.day })} ·{' '}
                {t.t('curriculum.minutes', { n: milestone.estimatedMinutes })}
              </span>
            </div>
            <h1 className="display mt-2 text-[clamp(1.5rem,3vw,2.05rem)] leading-[1.18] text-ink [text-wrap:balance]">
              {day?.title ?? milestone.title}
            </h1>
            <p dir="rtl" className="arabic mt-0.5 text-2xl text-muted">{milestone.titleAr}</p>
            <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted">
              {day?.brief ?? milestone.brief}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              completeDay(milestone.day);
              playFanfare();
            }}
            disabled={!!progress?.completedAt}
            className={[
              'shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition',
              progress?.completedAt
                ? 'bg-ghunnah/15 text-ghunnah'
                : 'bg-accent text-white hover:brightness-110',
            ].join(' ')}
          >
            {t.t(progress?.completedAt ? 'curriculum.dayComplete' : 'curriculum.markComplete')}
          </button>
        </div>

        {/* rules activated today */}
        {milestone.ruleIds.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
              {t.t('curriculum.rulesToday')}
            </span>
            {milestone.ruleIds.map((id) => {
              const r = t.rule(id);
              return (
                <span key={id} className={`chip ${FAMILY_STYLE[r.family].bg} ${FAMILY_STYLE[r.family].text}`}>
                  {r.label.replace(/\s*\(.*\)$/, '')}
                  {r.counts && <span className="opacity-70">· {r.counts.join('/')}</span>}
                </span>
              );
            })}
          </div>
        )}
      </header>

      {/* ── tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {([
          ['practice', t.t('curriculum.tabPractice')],
          ['drill', t.t('curriculum.tabDrill')],
          ['anatomy', t.t('curriculum.tabAnatomy')],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              'rounded-xl border px-3.5 py-2 text-[12.5px] font-medium transition',
              tab === id ? 'border-accent bg-accent/12 text-ink' : 'border-line bg-raised text-muted hover:text-ink',
            ].join(' ')}
          >
            {label}
          </button>
        ))}

        {tab === 'practice' && milestone.practice.length > 1 && (
          <div className="ml-auto flex flex-wrap gap-1.5">
            {milestone.practice.map((p, i) => (
              <button
                key={`${p.surah}-${p.from}`}
                type="button"
                onClick={() => setRangeIndex(i)}
                className={[
                  'rounded-lg border px-2.5 py-1.5 text-[11.5px] font-medium transition',
                  i === rangeIndex ? 'border-accent bg-accent/10 text-ink' : 'border-line bg-raised text-muted',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── tab body ─────────────────────────────────────────────────────── */}
      {tab === 'practice' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="mb-3 rounded-xl border border-line bg-raised px-4 py-2.5 text-[12.5px] text-muted">
            {t.t('curriculum.practiceHint')}
          </p>
          <ReaderScreen
            key={`${range.surah}-${range.from}-${range.to}`}
            surah={range.surah}
            from={range.from}
            to={range.to}
            initialRuleFilter={milestone.ruleIds.length ? milestone.ruleIds : null}
            allowSurahChange={false}
          />
        </motion.div>
      )}

      {tab === 'drill' && (
        <GamifiedQuizScreen
          day={milestone.day}
          ruleIds={milestone.drill.ruleIds.length ? milestone.drill.ruleIds : milestone.ruleIds}
          questionCount={milestone.drill.questionCount}
          surahPool={quizSurahs}
          promptOverride={day?.drillPrompt ?? milestone.drill.prompt}
        />
      )}

      {tab === 'anatomy' && (
        <div className="panel px-5 py-5">
          <h2 className="display mb-1 text-[17px] text-ink">{t.t('curriculum.anatomyTitle')}</h2>
          <p className="mb-4 text-[13px] text-muted">
            {milestone.makharij.map((m) => t.zone(m).name).join(' · ')}
          </p>
          <MakhrajVisualizer
            text={milestone.makharij.flatMap((m) => MAKHRAJ_ZONES[m].letters.split(' ')).join(' ')}
            relatedZones={milestone.makharij}
          />
        </div>
      )}

      {/* The complete-alphabet verses sit under every anatomy tab: whatever
          zone a given day focuses on, these two exercise all of them. */}
      {tab === 'anatomy' && <AlphabetShowcase compact />}

      {/* ── checkpoints ──────────────────────────────────────────────────── */}
      <section className="panel px-5 py-5">
        <h2 className="display mb-3 text-[17px] text-ink">{t.t('curriculum.checkpointsTitle')}</h2>
        <ul className="space-y-2">
          {(day?.checkpoints ?? milestone.checkpoints).map((c, i) => {
            const checked = progress?.checkpointsDone.includes(i) ?? false;
            return (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => toggleCheckpoint(milestone.day, i)}
                  className={[
                    'flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition',
                    checked ? 'border-ghunnah/40 bg-ghunnah/[0.06]' : 'border-line bg-raised hover:border-accent/50',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px]',
                      checked ? 'border-ghunnah bg-ghunnah text-white' : 'border-line text-transparent',
                    ].join(' ')}
                  >
                    ✓
                  </span>
                  <span className={`text-[13px] ${checked ? 'text-ink' : 'text-muted'}`}>{c}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {progress && (
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-3.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.08]">
              <motion.div
                className="h-full rounded-full bg-accent"
                animate={{ width: `${progress.score}%` }}
                transition={{ type: 'spring', stiffness: 180, damping: 26 }}
              />
            </div>
            <span className="text-[11.5px] font-semibold tabular-nums text-muted">{progress.score}%</span>
            {progress.quizBest && (
              <span className="chip bg-ink/[0.05] text-muted">
                {t.t('curriculum.drillBest', {
                  correct: progress.quizBest.correct,
                  total: progress.quizBest.total,
                })}
              </span>
            )}
          </div>
        )}
      </section>

      {/* ── prev / next ──────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between gap-3">
        {prev ? (
          <Link
            href={`/curriculum/${prev.day}`}
            className="rounded-xl border border-line bg-raised px-4 py-2.5 text-[12.5px] font-medium text-muted transition hover:text-ink"
          >
            ← {t.t('curriculum.day', { n: prev.day })}: {t.day(prev.day)?.title ?? prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/curriculum/${next.day}`}
            className="rounded-xl border border-line bg-raised px-4 py-2.5 text-right text-[12.5px] font-medium text-muted transition hover:text-ink"
          >
            {t.t('curriculum.day', { n: next.day })}: {t.day(next.day)?.title ?? next.title} →
          </Link>
        )}
      </nav>
    </div>
  );
}
