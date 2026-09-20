'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { resolveGlyphRuns } from '@/lib/tajweed/engine';
import { getRule } from '@/lib/tajweed/rules';
import { useReaderStore } from '@/store/useReaderStore';
import type { QuranWord } from '@/types/quran';
import type { GlyphRun, RuleFamily } from '@/types/tajweed';

/**
 * Static class lookup. Tailwind only sees classes that appear literally in the
 * source, so the family -> colour mapping must be a table of complete class
 * names rather than an interpolated `text-${family}`.
 */
const GLYPH_CLASS: Record<RuleFamily | 'none', string> = {
  madd: 'text-madd',
  ghunnah: 'text-ghunnah',
  qalqalah: 'text-qalqalah',
  makharij: 'text-makharij',
  silent: 'text-silent',
  izhar: '',
  none: '',
};

export interface TajweedWordRendererProps {
  word: QuranWord;
  /** Fired on click/Enter — the parent owns audio + panel side effects. */
  onSelect?: (word: QuranWord) => void;
  /** Quiz mode overrides: forced visual state, colour suppression. */
  quizState?: 'idle' | 'correct' | 'wrong' | 'reveal';
  /** Hide all colour regardless of global setting (unaided reading drills). */
  forcePlain?: boolean;
  size?: 'md' | 'lg';
  /** Disable the inspector affordances (used by the quiz board). */
  interactive?: boolean;
}

function runClasses(run: GlyphRun, coloured: boolean): string {
  if (!coloured || run.family === 'none') return '';
  return GLYPH_CLASS[run.family];
}

/**
 * Renders ONE word as a sequence of coloured glyph runs.
 *
 * Why runs and not characters: Arabic is cursive, and every extra element
 * boundary is a chance for the shaper to break a ligature. `resolveGlyphRuns`
 * merges every adjacent character that shares a colour and a rule set, so a
 * typical word emits two or three spans instead of a dozen — fewer DOM nodes,
 * and the joining behaviour stays intact.
 *
 * The component subscribes to the store with three narrow selectors rather
 * than taking playback state through props, so when the playhead moves only
 * the word losing the highlight and the word gaining it re-render.
 */
export const TajweedWordRenderer = memo(function TajweedWordRenderer({
  word,
  onSelect,
  quizState = 'idle',
  forcePlain = false,
  size = 'md',
  interactive = true,
}: TajweedWordRendererProps) {
  const isActive = useReaderStore((s) => s.activeWordId === word.id);
  const isInspected = useReaderStore((s) => s.inspectedWord?.id === word.id);
  const colorEnabled = useReaderStore((s) => s.colorEnabled);
  const ruleFilter = useReaderStore((s) => s.ruleFilter);

  // Pure function of the word; recomputing on every playhead frame would be
  // wasteful, so it is memoised against the word's identity.
  const runs = useMemo(() => resolveGlyphRuns(word.textUthmani, word.spans), [word.textUthmani, word.spans]);

  const coloured = colorEnabled && !forcePlain;

  const { matchesFilter, visibleRuns } = useMemo(() => {
    if (!ruleFilter || ruleFilter.length === 0) return { matchesFilter: true, visibleRuns: runs };
    const matches = word.ruleIds.some((id) => ruleFilter.includes(id));
    // Inside a filtered word, only the runs carrying a selected rule keep
    // their colour — everything else drops back to plain ink.
    const filtered = runs.map((r) =>
      r.ruleIds.some((id) => ruleFilter.includes(id)) ? r : { ...r, family: 'none' as const },
    );
    return { matchesFilter: matches, visibleRuns: filtered };
  }, [runs, ruleFilter, word.ruleIds]);

  const dimmed = !!ruleFilter && ruleFilter.length > 0 && !matchesFilter;

  const stateRing =
    quizState === 'correct'
      ? 'ring-2 ring-ghunnah bg-ghunnah/15'
      : quizState === 'wrong'
        ? 'ring-2 ring-madd bg-madd/10'
        : quizState === 'reveal'
          ? 'ring-2 ring-makharij bg-makharij/15'
          : isInspected
            ? 'ring-1 ring-accent/60 bg-accent/10'
            : 'ring-1 ring-transparent';

  return (
    <motion.button
      type="button"
      dir="rtl"
      lang="ar"
      onClick={() => onSelect?.(word)}
      disabled={!interactive && !onSelect}
      aria-label={`${word.textSimple}${word.translation ? ` — ${word.translation}` : ''}`}
      aria-pressed={isInspected}
      data-word-id={word.id}
      animate={
        quizState === 'wrong'
          ? { x: [0, -7, 7, -5, 5, 0] }
          : quizState === 'correct'
            ? { scale: [1, 1.12, 1] }
            : { x: 0, scale: 1 }
      }
      transition={{ duration: quizState === 'wrong' ? 0.42 : 0.35, ease: 'easeOut' }}
      className={[
        'relative isolate inline-flex flex-col items-center rounded-xl px-2 pb-1 pt-0.5',
        'transition-[opacity,background-color] duration-300',
        stateRing,
        dimmed ? 'opacity-25 saturate-0' : 'opacity-100',
        interactive ? 'group/word cursor-pointer hover:bg-accent/[0.07]' : 'cursor-default',
      ].join(' ')}
    >
      {/* The travelling playhead. One shared layoutId means Framer animates a
          single element between words instead of cross-fading two. */}
      {isActive && (
        <motion.span
          layoutId="tajweed-playhead"
          className="absolute inset-0 -z-10 rounded-xl bg-accent/15 ring-1 ring-accent/40 shadow-anchor-glow"
          transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.7 }}
        />
      )}

      <span
        className={[
          'arabic block',
          size === 'lg' ? 'text-ayah-lg' : 'text-ayah',
          isActive ? 'text-ink' : '',
        ].join(' ')}
      >
        {visibleRuns.map((run) => (
          <span
            key={`${word.id}-${run.start}`}
            data-anchor={coloured ? run.family : 'none'}
            className={runClasses(run, coloured)}
          >
            {run.text}
          </span>
        ))}
      </span>

      <WordUnderline word={word} coloured={coloured} />
    </motion.button>
  );
});

/**
 * Redundant, non-colour channel: a row of tick marks, one per rule in the
 * word, in reading order. Colour alone is never the only carrier of meaning —
 * this row is what a colour-blind learner reads, and it doubles as an at-a-
 * glance density map of how much is happening inside a word.
 */
function WordUnderline({ word, coloured }: { word: QuranWord; coloured: boolean }) {
  const showTransliteration = useReaderStore((s) => s.showTransliteration);
  const families = useMemo(() => {
    const seen: RuleFamily[] = [];
    for (const id of word.ruleIds) {
      const f = getRule(id).family;
      if (f !== 'izhar' && !seen.includes(f)) seen.push(f);
    }
    return seen;
  }, [word.ruleIds]);

  const DOT: Record<RuleFamily, string> = {
    madd: 'bg-madd', ghunnah: 'bg-ghunnah', qalqalah: 'bg-qalqalah',
    makharij: 'bg-makharij', silent: 'bg-silent', izhar: 'bg-muted',
  };

  return (
    <span className="pointer-events-none mt-0.5 flex flex-col items-center gap-1">
      {coloured && families.length > 0 && (
        <span className="flex gap-1">
          {families.map((f) => (
            <span key={f} className={`h-1 w-3 rounded-full ${DOT[f]}`} />
          ))}
        </span>
      )}
      {/* When the transliteration row is switched off it still appears on
          hover. Reserving no layout space keeps the line rhythm of the verse
          intact — it fades in over the gap below the word rather than
          reflowing the whole ayah as the pointer moves across it. */}
      {word.transliteration &&
        (showTransliteration ? (
          <span dir="ltr" className="font-ui text-[10px] tracking-tight text-muted">
            {word.transliteration}
          </span>
        ) : (
          <span
            dir="ltr"
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded font-ui text-[10px] tracking-tight text-accent opacity-0 transition-opacity duration-150 group-hover/word:opacity-100"
          >
            {word.transliteration}
          </span>
        ))}
    </span>
  );
}
