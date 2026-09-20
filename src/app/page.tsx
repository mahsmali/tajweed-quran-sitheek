'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { animate, useReducedMotion } from 'framer-motion';
import { ReaderScreen } from '@/components/ReaderScreen';
import { VideoLesson } from '@/components/VideoLesson';
import { SectionHeading } from '@/components/SectionHeading';
import { CURRICULUM, TOTAL_MINUTES } from '@/lib/curriculum/plan';
import { ALL_RULES, FAMILY_ORDER, FAMILY_STYLE, RULES_BY_FAMILY } from '@/lib/tajweed/rules';
import { TAJWEED_OVERVIEW } from '@/lib/content/videos';
import { useReaderStore } from '@/store/useReaderStore';
import { useT } from '@/lib/i18n/useT';

export default function HomePage() {
  const t = useT();

  /**
   * The hero sentence, split at its em dash.
   *
   * Every translation of this line is built the same way — a claim, a dash,
   * then the qualification that is the actual point ("derived, not typed").
   * Setting the second half on its own line in gold gives the sentence a
   * landing, instead of a single 90-character block that trails off at
   * whatever width the viewport happens to be. Splitting on the punctuation
   * rather than on a hand-written second key means it works in Tamil and
   * Sinhala too, and degrades to one plain line if a translation ever drops
   * the dash.
   */
  const title = t.t('home.title');
  const dash = title.indexOf('—');
  const claim = dash === -1 ? title : title.slice(0, dash).trim();
  const point = dash === -1 ? null : title.slice(dash + 1).trim();

  return (
    <div className="space-y-8">
      {/* ── hero ──────────────────────────────────────────────────────────
          Two columns so the opening copy and the lesson video share the full
          width; on narrow screens the video drops below the call to action. */}
      <section className="panel paper hero-glow relative overflow-hidden px-6 py-9 sm:px-9 sm:py-11">
        {/* Above the paper grain and the glow, both of which are positioned
            pseudo-elements and would otherwise paint over the text. */}
        <div className="relative z-10">
          <div className="grid items-center gap-9 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-12">
            <div className="min-w-0">
              <p className="eyebrow">{t.t('home.eyebrow')}</p>

              {/* The size is clamped to the viewport rather than stepped through
                  breakpoints, and `text-wrap: balance` evens out the line lengths
                  so the headline fills its column instead of trailing off into
                  white space. Both matter more in Tamil and Sinhala, whose
                  translations of this sentence are noticeably longer. */}
              <h1 className="display hero-title mt-3 text-[clamp(1.95rem,4.4vw,3.35rem)] leading-[1.1] text-ink [text-wrap:balance]">
                {claim}
                {point && <span className="mt-1.5 block text-accent">{point}</span>}
              </h1>

              <p className="mt-5 max-w-[54ch] text-[15px] leading-relaxed text-muted [text-wrap:pretty]">
                {t.t('home.blurb', { count: ALL_RULES.length })}
              </p>

              {/* The five anchors, stated once at the top so the colours in the
                  reader below are already meaningful by the time they appear —
                  and wired to the reader's own filter, so the legend is a
                  control rather than a caption. */}
              <AnchorFilters />

              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link href="/curriculum" className="btn-primary group">
                  {t.t('home.startRoadmap')}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link href="/quiz" className="btn-ghost">
                  {t.t('home.playQuiz')}
                </Link>
              </div>
            </div>

            <div className="min-w-0">
              <p className="eyebrow mb-2.5">{t.t('video.eyebrow')}</p>
              <VideoLesson {...TAJWEED_OVERVIEW} />
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{t.t('video.blurb')}</p>
            </div>
          </div>

          <dl className="mt-9 grid grid-cols-2 gap-3 border-t border-line pt-7 sm:grid-cols-4">
            <Stat k={t.t('home.statRules')} n={ALL_RULES.length} />
            <Stat k={t.t('home.statDays')} n={CURRICULUM.length} />
            <Stat
              k={t.t('home.statTime')}
              v={`${Math.floor(TOTAL_MINUTES / 60)}h ${TOTAL_MINUTES % 60}m`}
            />
            <Stat k={t.t('home.statTagging')} v={t.t('home.statTaggingValue')} />
          </dl>
        </div>
      </section>

      {/* ── the reader ───────────────────────────────────────────────────
          It used to begin with no title at all: a toolbar appeared under the
          hero's statistics and the verses followed it. Naming the section is
          what tells a first-time reader that the thing below is theirs to
          poke at. */}
      <div className="section-rule" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
      </div>

      <section id="reader" className="scroll-mt-24 space-y-5">
        <SectionHeading
          as="h2"
          size="lg"
          eyebrow={t.t('reader.eyebrow')}
          title={t.t('reader.heading')}
          blurb={t.t('reader.blurb')}
        />
        <ReaderScreen surah={1} />
      </section>
    </div>
  );
}

/**
 * The five visual anchors, doubling as the reader's rule filter.
 *
 * As a plain list this was the one part of the hero that explained something
 * and then did nothing about it. Pressing a colour here narrows the reader
 * below to exactly those rules and takes you to it — the same store the legend
 * beside the verses writes to, so the two controls can never disagree.
 */
function AnchorFilters() {
  const t = useT();
  const ruleFilter = useReaderStore((s) => s.ruleFilter);
  const setRuleFilter = useReaderStore((s) => s.setRuleFilter);

  const families = FAMILY_ORDER.filter((f) => f !== 'izhar');

  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {families.map((fam) => {
        const ids = RULES_BY_FAMILY[fam].map((r) => r.id);
        const active = !!ruleFilter?.length && ids.some((id) => ruleFilter.includes(id));
        return (
          <li key={fam}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => {
                setRuleFilter(active ? null : ids);
                document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={[
                'chip border px-3 py-2 transition',
                active
                  ? 'border-accent bg-accent/12 text-ink'
                  : 'border-line bg-raised text-ink hover:-translate-y-0.5 hover:border-accent/50',
              ].join(' ')}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${FAMILY_STYLE[fam].dot}`} />
              <span className="text-[12px] font-semibold">{t.t(`families.${fam}`)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Stat({ k, v, n }: { k: string; v?: string; n?: number }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-raised px-4 py-3.5">
      {/* A hairline of gold across the top of each card: enough to bind the
          four of them into one band under the hero without adding a box. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent/70 via-accent/25 to-transparent"
      />
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">{k}</dt>
      <dd className="display mt-1.5 text-[1.55rem] leading-none tabular-nums text-ink">
        {n === undefined ? v : <CountUp value={n} />}
      </dd>
    </div>
  );
}

/**
 * A number that counts up to itself once, on mount.
 *
 * The point is not the animation — it is that "31 rules detected" is the
 * app's whole claim, and a figure that arrives rather than simply being
 * printed gets read. Held to a single pass, and skipped outright under
 * `prefers-reduced-motion`, where it renders the final value immediately.
 */
function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    // A tab opened in the background gets no animation frames at all, so an
    // animation started there would sit frozen at whatever partial figure it
    // reached — and "1 rules detected" under a heading claiming the engine
    // derives thirty-one of them is worse than no animation. Skip it outright
    // when the page is not being looked at.
    if (reduce || document.visibilityState === 'hidden') {
      setShown(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => setShown(value),
    });
    // The same guarantee for a tab hidden *during* the count, where neither the
    // frame loop nor `onComplete` will fire again until it is shown.
    const settle = window.setTimeout(() => {
      controls.stop();
      setShown(value);
    }, 1600);
    return () => {
      controls.stop();
      window.clearTimeout(settle);
    };
  }, [value, reduce]);

  return <>{shown}</>;
}
