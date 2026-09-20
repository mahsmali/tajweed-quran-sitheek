'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { resolveGlyphRuns } from '@/lib/tajweed/engine';
import { useReaderStore } from '@/store/useReaderStore';
import { useT } from '@/lib/i18n/useT';
import { WaveformCompare } from './WaveformCompare';
import { MakhrajModal } from './MakhrajModal';
import type { QuranWord } from '@/types/quran';
import type { RuleFamily } from '@/types/tajweed';

const TEXT: Record<RuleFamily, string> = {
  madd: 'text-madd', ghunnah: 'text-ghunnah', qalqalah: 'text-qalqalah',
  makharij: 'text-makharij', silent: 'text-silent', izhar: 'text-ink',
};
const BORDER: Record<RuleFamily, string> = {
  madd: 'border-madd/30 bg-madd/[0.06]', ghunnah: 'border-ghunnah/30 bg-ghunnah/[0.06]',
  qalqalah: 'border-qalqalah/30 bg-qalqalah/[0.06]', makharij: 'border-makharij/30 bg-makharij/[0.06]',
  silent: 'border-silent/30 bg-silent/[0.06]', izhar: 'border-line bg-ink/[0.03]',
};

export interface WordInspectorProps {
  word: QuranWord | null;
  onClose: () => void;
  onPlayWord: (w: QuranWord) => void;
}

/**
 * The expanded sub-panel for a single word: the isolated glyph at display
 * size, a rule-by-rule breakdown, the articulation diagram, and the
 * record-and-compare tool.
 */
export function WordInspector({ word, onClose, onPlayWord }: WordInspectorProps) {
  const t = useT();
  const [makhrajOpen, setMakhrajOpen] = useState(false);
  const openMakhraj = useReaderStore((s) => s.openMakhraj);
  const panelRef = useRef<HTMLElement | null>(null);

  /**
   * Reveal the panel only if it opened below the fold, and then only just
   * enough.
   *
   * `scrollIntoView` is the obvious call and the wrong one here: this panel is
   * taller than most viewports, so any variant of it scrolls the verse you
   * just tapped off the top of the screen — which defeats the whole point of
   * opening inline. Instead we scroll by the minimum that brings the panel's
   * first ~180px into view, leaving the word above it where you left it.
   */
  useEffect(() => {
    if (!word) return;
    const id = requestAnimationFrame(() => {
      const el = panelRef.current;
      if (!el) return;
      const { top } = el.getBoundingClientRect();
      const reveal = Math.min(180, window.innerHeight * 0.35);
      const overshoot = top - (window.innerHeight - reveal);
      if (overshoot > 0) window.scrollBy({ top: overshoot, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(id);
  }, [word?.id]);

  const runs = useMemo(
    () => (word ? resolveGlyphRuns(word.textUthmani, word.spans) : []),
    [word],
  );

  return (
    <>
      <AnimatePresence>
        {word && (
          <motion.aside
            key={word.id}
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scaleY: 0.97 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ transformOrigin: 'top' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="panel overflow-hidden shadow-card ring-1 ring-accent/30"
            aria-live="polite"
          >
            {/* ── header: the isolated word ─────────────────────────────── */}
            <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-line bg-accent/[0.04] px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                  {t.t('inspector.wordOf', {
                    position: word.position,
                    verse: `${word.surah}:${word.ayah}`,
                  })}
                </p>
                {/* Uthmani glyphs carry marks well above the baseline and
                    descenders (م, ر, ى) well below it, and a descender
                    overflows its line box rather than being contained by
                    line-height. So this needs BOTH generous leading and real
                    padding underneath — `leading-none` here used to drop the
                    final مِ straight onto the transliteration. Size is clamped
                    rather than stepped so long words stay on one line. */}
                <p
                  dir="rtl"
                  className="arabic mt-1.5 pb-5 text-[clamp(2.2rem,6vw,3.2rem)] leading-[1.9]"
                >
                  {runs.map((r) => (
                    <span
                      key={r.start}
                      data-anchor={r.family}
                      className={r.family === 'none' ? '' : TEXT[r.family]}
                    >
                      {r.text}
                    </span>
                  ))}
                </p>
                {(word.transliteration || word.translation) && (
                  <p className="mt-1 text-[13px] text-muted">
                    {word.transliteration && <span className="font-medium text-ink">{word.transliteration}</span>}
                    {word.transliteration && word.translation && <span className="mx-1.5">·</span>}
                    {word.translation}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPlayWord(word)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
                >
                  ▶ {t.t('inspector.hearWord')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMakhrajOpen(true);
                    openMakhraj(word.textSimple[0] ?? null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink transition hover:border-accent/60"
                >
                  <AnatomyIcon /> {t.t('inspector.articulation')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.t('inspector.close')}
                  className="rounded-lg border border-line px-2.5 py-2 text-xs text-muted transition hover:text-ink"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              {/* ── rules inside this word ──────────────────────────────── */}
              <div>
                <h4 className="mb-2.5 text-sm font-semibold text-ink">
                  {t.t('inspector.rulesInWord')}
                  <span className="ml-2 rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] font-medium text-muted">
                    {word.spans.length}
                  </span>
                </h4>

                {word.spans.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-muted">
                    {t.t('inspector.noRules')}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {word.spans.map((span, i) => {
                      const rule = t.rule(span.ruleId);
                      return (
                        <li
                          key={`${span.ruleId}-${span.start}-${i}`}
                          className={`rounded-xl border px-3.5 py-3 ${BORDER[rule.family]}`}
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className={`text-[13px] font-semibold ${TEXT[rule.family]}`}>{rule.label}</span>
                            <span className="flex items-center gap-2">
                              {rule.counts && (
                                <span className="chip bg-ink/[0.06] text-muted">
                                  {t.t('inspector.counts', { counts: rule.counts.join('/') })}
                                </span>
                              )}
                              <span dir="rtl" className="arabic text-lg text-ink">{rule.labelAr}</span>
                            </span>
                          </div>

                          <p dir="rtl" className="arabic mt-1.5 text-3xl leading-snug text-ink">
                            <span className={TEXT[rule.family]}>{span.text}</span>
                          </p>

                          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t.note(span)}</p>
                          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/75">{rule.detail}</p>

                          {rule.makharij.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {rule.makharij.slice(0, 3).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setMakhrajOpen(true)}
                                  className="chip border border-line bg-raised text-muted transition hover:border-accent/50 hover:text-ink"
                                >
                                  {t.zone(m).name}
                                </button>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* ── listen & repeat ─────────────────────────────────────── */}
              <div className="space-y-4">
                <WaveformCompare
                  masterUrl={word.audioUrl}
                  resetKey={word.id}
                  wordLabel={word.transliteration ?? word.textSimple}
                />

                <div className="panel p-4">
                  <h4 className="mb-2 text-sm font-semibold text-ink">{t.t('inspector.timing')}</h4>
                  {word.timing ? (
                    <dl className="grid grid-cols-3 gap-3 text-center">
                      <Stat label={t.t('inspector.starts')} value={`${(word.timing.startMs / 1000).toFixed(2)}s`} />
                      <Stat label={t.t('inspector.length')} value={`${word.timing.durationMs} ms`} />
                      <Stat
                        label={t.t('inspector.source')}
                        value={t.t(
                          word.timing.source === 'quran.com-segments'
                            ? 'inspector.sourceAligned'
                            : 'inspector.sourceEstimated',
                        )}
                        tone={word.timing.source === 'quran.com-segments' ? 'text-ghunnah' : 'text-makharij'}
                      />
                    </dl>
                  ) : (
                    <p className="text-[13px] text-muted">{t.t('inspector.noTiming')}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {word && (
        <MakhrajModal
          open={makhrajOpen}
          onClose={() => setMakhrajOpen(false)}
          text={word.textUthmani}
          relatedZones={word.makharij}
          title={t.t('makhraj.modalTitleWord', {
            position: word.position,
            verse: `${word.surah}:${word.ayah}`,
          })}
        />
      )}
    </>
  );
}

function Stat({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-ink/[0.03] px-2 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`mt-0.5 text-[13px] font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function AnatomyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 20c0-5 2-8 5-9M4 20h7m9-9a8 8 0 1 0-9 7.9" />
      <circle cx="15" cy="10" r="2" />
    </svg>
  );
}
