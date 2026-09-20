'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CURRICULUM, PHASES, TOTAL_MINUTES } from '@/lib/curriculum/plan';
import { VideoLesson } from '@/components/VideoLesson';
import { TAJWEED_OVERVIEW } from '@/lib/content/videos';
import { FAMILY_STYLE } from '@/lib/tajweed/rules';
import { useProgressStore, completedCount, currentDay, isDayUnlocked, weakestRule } from '@/store/useProgressStore';
import { useT } from '@/lib/i18n/useT';
import type { Translator } from '@/lib/i18n';
import type { DailyMilestone } from '@/types/curriculum';

export function RoadmapTimeline() {
  const t = useT();
  const days = useProgressStore((s) => s.days);
  const ruleStats = useProgressStore((s) => s.ruleStats);
  const reset = useProgressStore((s) => s.reset);

  const done = completedCount(days);
  const today = currentDay(days);
  const weakest = useMemo(() => weakestRule(ruleStats), [ruleStats]);
  const minutesLeft = useMemo(
    () => CURRICULUM.filter((d) => !days[d.day]?.completedAt).reduce((s, d) => s + d.estimatedMinutes, 0),
    [days],
  );

  return (
    <div className="space-y-6">
      {/* ── dashboard ────────────────────────────────────────────────────── */}
      <section className="panel paper relative overflow-hidden px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">{t.t('curriculum.eyebrow')}</p>
            <h1 className="display mt-1.5 text-[clamp(1.5rem,3vw,2rem)] leading-[1.2] text-ink [text-wrap:balance]">
              {done === 0
                ? t.t('curriculum.titleStart')
                : done === 30
                  ? t.t('curriculum.titleDone')
                  : t.t('curriculum.titleNext', { day: today })}
            </h1>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted">{t.t('curriculum.blurb')}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Ring value={done} max={30} />
            {done > 0 && (
              <button
                type="button"
                onClick={() => confirm(t.t('curriculum.resetConfirm')) && reset()}
                className="text-[11px] text-muted underline decoration-dotted underline-offset-4 hover:text-ink"
              >
                {t.t('curriculum.reset')}
              </button>
            )}
          </div>
        </div>

        {/* The overview video belongs here rather than only on the home page:
            this is the screen someone is on when they are about to start Day 1,
            which is exactly what it prepares them for. Hidden once they are
            past the foundation phase — by then it is revision, not orientation. */}
        {done < 5 && (
          <div className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                {t.t('video.eyebrow')}
              </p>
              <h2 className="mt-1.5 text-[17px] font-semibold tracking-tight text-ink">
                {t.t('video.heading')}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{t.t('video.blurb')}</p>
            </div>
            <VideoLesson {...TAJWEED_OVERVIEW} />
          </div>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat k={t.t('curriculum.statComplete')} v={`${done} / 30`} />
          <Stat k={t.t('curriculum.statRemaining')} v={`${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`} />
          <Stat k={t.t('curriculum.statTotal')} v={`${Math.floor(TOTAL_MINUTES / 60)}h ${TOTAL_MINUTES % 60}m`} />
          <Stat
            k={t.t('curriculum.statFocus')}
            v={weakest ? t.rule(weakest.ruleId).label.replace(/\s*\(.*\)$/, '') : '—'}
            small
          />
        </dl>
      </section>

      {/* ── the timeline ─────────────────────────────────────────────────── */}
      {PHASES.map((phase) => {
        const items = CURRICULUM.filter((d) => d.phase === phase.id);
        const ph = t.phase(phase.id);
        return (
          <section key={phase.id}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="display text-[17px] leading-tight text-ink">{ph.title}</h2>
              <span className="text-[12px] text-muted">{ph.blurb}</span>
              <span className="ml-auto text-[11px] font-medium tabular-nums text-muted">
                {t.t('curriculum.days', { from: phase.days[0], to: phase.days[1] })}
              </span>
            </div>

            <ol className="relative grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m, i) => (
                <MilestoneCard
                  key={m.day}
                  t={t}
                  milestone={m}
                  unlocked={isDayUnlocked(days, m.day)}
                  completed={!!days[m.day]?.completedAt}
                  score={days[m.day]?.score ?? 0}
                  isCurrent={m.day === today}
                  delay={i * 0.02}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function MilestoneCard({
  t,
  milestone,
  unlocked,
  completed,
  score,
  isCurrent,
  delay,
}: {
  t: Translator;
  milestone: DailyMilestone;
  unlocked: boolean;
  completed: boolean;
  score: number;
  isCurrent: boolean;
  delay: number;
}) {
  const style = FAMILY_STYLE[milestone.focusFamily];
  const day = t.day(milestone.day);

  const body = (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay }}
      className={[
        'group relative flex h-full flex-col rounded-2xl border px-4 py-3.5 transition',
        completed
          ? 'border-ghunnah/35 bg-ghunnah/[0.05]'
          : isCurrent
            ? 'border-accent bg-accent/[0.07] shadow-anchor-glow'
            : unlocked
              ? 'border-line bg-raised hover:border-accent/50'
              : 'border-dashed border-line bg-ink/[0.02]',
        unlocked ? '' : 'opacity-60',
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={[
            'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums',
            completed ? 'bg-ghunnah text-white' : isCurrent ? 'bg-accent text-white' : 'bg-ink/[0.07] text-muted',
          ].join(' ')}
        >
          {completed ? '✓' : milestone.day}
        </span>
        <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
        <span className="ml-auto text-[10.5px] font-medium text-muted">
          {t.t('curriculum.minutes', { n: milestone.estimatedMinutes })}
        </span>
        {!unlocked && <LockIcon />}
      </div>

      <h3 className="display mt-2.5 text-[14.5px] leading-snug text-ink">{day?.title ?? milestone.title}</h3>
      <p dir="rtl" className="arabic text-[15px] leading-tight text-muted">{milestone.titleAr}</p>
      <p className="mt-1.5 line-clamp-2 flex-1 text-[12px] leading-relaxed text-muted">
        {day?.objective ?? milestone.objective}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {milestone.practice.slice(0, 2).map((p) => (
          <span key={`${p.surah}-${p.from}`} className="chip bg-ink/[0.05] text-muted">{p.label}</span>
        ))}
        {milestone.ruleIds.length > 0 && (
          <span className="chip bg-ink/[0.05] text-muted">
            {t.t('curriculum.rulesCount', { n: milestone.ruleIds.length })}
          </span>
        )}
      </div>

      {completed && score > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink/[0.08]">
            <div className="h-full rounded-full bg-ghunnah" style={{ width: `${score}%` }} />
          </div>
          <span className="text-[10.5px] font-semibold tabular-nums text-ghunnah">{score}%</span>
        </div>
      )}
    </motion.li>
  );

  if (!unlocked) return body;
  return (
    <Link href={`/curriculum/${milestone.day}`} className="contents">
      {body}
    </Link>
  );
}

function Ring({ value, max }: { value: number; max: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = value / max;
  return (
    <div className="relative h-[68px] w-[68px]">
      <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgb(var(--tj-ink) / 0.08)" strokeWidth="6" />
        <motion.circle
          cx="34" cy="34" r={r} fill="none" stroke="rgb(var(--tj-accent))" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold tabular-nums text-ink">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

function Stat({ k, v, small = false }: { k: string; v: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-raised px-3.5 py-3">
      <dt className="text-[10.5px] font-medium uppercase tracking-wider text-muted">{k}</dt>
      <dd className={`mt-1 font-semibold text-ink ${small ? 'text-[12.5px] leading-snug' : 'text-lg tabular-nums'}`}>{v}</dd>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="text-muted">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
