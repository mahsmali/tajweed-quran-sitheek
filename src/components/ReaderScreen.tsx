'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TajweedWordRenderer } from './TajweedWordRenderer';
import { WordInspector } from './WordInspector';
import { RuleLegend } from './RuleLegend';
import { useReaderStore } from '@/store/useReaderStore';
import { useLocaleStore } from '@/store/useLocaleStore';
import { useT } from '@/lib/i18n/useT';
import { useVersePlayer } from '@/lib/audio/useVersePlayer';
import { FAMILY_ORDER, FAMILY_STYLE, RULES_BY_FAMILY } from '@/lib/tajweed/rules';
import { RECITERS } from '@/lib/pipeline/quranClient';
import { playTick } from '@/lib/audio/chime';
import type { ChapterData, QuranWord, VerseData } from '@/types/quran';
import type { TajweedRuleId } from '@/types/tajweed';

export interface ReaderScreenProps {
  surah: number;
  /** Restrict the reader to a verse range (used by curriculum lessons). */
  from?: number;
  to?: number;
  /** Pre-apply a rule filter for a lesson. */
  initialRuleFilter?: TajweedRuleId[] | null;
  /** Allow switching surah from inside the reader. */
  allowSurahChange?: boolean;
  onChapterLoaded?: (c: ChapterData) => void;
}

const SURAH_SHORTCUTS = [
  { n: 1, label: 'Al-Fatihah' },
  // Home of the two complete-alphabet verses (3:154 and 48:29).
  { n: 3, label: 'Āl-‘Imrān' }, { n: 48, label: 'Al-Fath' },
  { n: 78, label: 'An-Naba' }, { n: 103, label: 'Al-‘Asr' },
  { n: 108, label: 'Al-Kawthar' }, { n: 110, label: 'An-Nasr' }, { n: 112, label: 'Al-Ikhlas' },
  { n: 113, label: 'Al-Falaq' }, { n: 114, label: 'An-Nas' },
];

export function ReaderScreen({
  surah,
  from,
  to,
  initialRuleFilter = null,
  allowSurahChange = true,
  onChapterLoaded,
}: ReaderScreenProps) {
  const [activeSurah, setActiveSurah] = useState(surah);
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const reciterId = useReaderStore((s) => s.reciterId);
  const setReciter = useReaderStore((s) => s.setReciter);
  const inspectedWord = useReaderStore((s) => s.inspectedWord);
  const inspect = useReaderStore((s) => s.inspect);
  const setRuleFilter = useReaderStore((s) => s.setRuleFilter);
  const isPlaying = useReaderStore((s) => s.isPlaying);
  const playingVerseKey = useReaderStore((s) => s.playingVerseKey);

  const appliedInitialFilter = useRef(false);
  useEffect(() => {
    if (appliedInitialFilter.current) return;
    appliedInitialFilter.current = true;
    setRuleFilter(initialRuleFilter);
  }, [initialRuleFilter, setRuleFilter]);

  useEffect(() => setActiveSurah(surah), [surah]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/chapter/${activeSurah}?reciter=${reciterId}&locale=${locale}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? 'Request failed');
        return r.json() as Promise<ChapterData>;
      })
      .then((data) => {
        if (cancelled) return;
        setChapter(data);
        onChapterLoaded?.(data);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeSurah, reciterId, locale, onChapterLoaded]);

  const verses = useMemo(() => {
    if (!chapter) return [];
    return chapter.verses.filter((v) => (from ? v.ayah >= from : true) && (to ? v.ayah <= to : true));
  }, [chapter, from, to]);

  const { playVerse, playWord, pause } = useVersePlayer(verses);

  const onSelectWord = useCallback(
    (w: QuranWord) => {
      pause();
      playTick();
      inspect(w);
      void playWord(w);
    },
    [pause, playWord, inspect],
  );

  /**
   * Closing returns the reader to the word that was opened rather than leaving
   * the page wherever the collapsing panel happens to drop it — the content
   * below shifts up by the panel's whole height, which is otherwise disorienting.
   */
  const closeInspector = useCallback(() => {
    const id = inspectedWord?.id;
    inspect(null);
    if (!id) return;
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-word-id="${CSS.escape(id)}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [inspect, inspectedWord]);

  const ruleCounts = useMemo(() => {
    const out: Partial<Record<TajweedRuleId, number>> = {};
    for (const v of verses) {
      for (const [id, n] of Object.entries(v.ruleSummary)) {
        out[id as TajweedRuleId] = (out[id as TajweedRuleId] ?? 0) + (n ?? 0);
      }
    }
    return out;
  }, [verses]);

  return (
    <div className="space-y-5">
      {/* ── verses beside their controls ───────────────────────────────────
          Everything here used to be stacked: a full-width toolbar, then a
          full-width colour key three across, then the verses. Between them
          they pushed the first ayah most of a screen down the page, and on a
          wide window the reader was a single column with the rest of the
          viewport empty.

          The rail is declared FIRST in the DOM so that on a phone — where the
          grid collapses to one column — the controls sit above the verses they
          govern. On xl both children are placed explicitly, which is what lets
          the rail move to the right-hand column without reordering the markup
          and without a second copy of the controls for a screen reader to
          find. */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_304px]">
        <aside
          aria-label={t.t('reader.displayGroup')}
          // 92px clears the 80px masthead (40px logo + tagline + padding) with
          // room to spare. Kept ahead of the header rather than level with it:
          // at the original 76px the rail sat two pixels under the header, and
          // any growth in the brand block slid the controls behind it.
          className="space-y-3.5 xl:col-start-2 xl:row-start-1 xl:sticky xl:top-[92px] xl:max-h-[calc(100dvh-114px)] xl:overflow-y-auto xl:pb-2"
        >
          <div className="panel space-y-3 p-4">
            <p className="eyebrow">{t.t('reader.sourceGroup')}</p>
            {allowSurahChange && (
              <Field label={t.t('reader.surah')}>
                <select
                  value={activeSurah}
                  onChange={(e) => setActiveSurah(Number(e.target.value))}
                  className="w-full rounded-lg border border-line bg-raised px-2.5 py-2 text-[13px] font-medium text-ink transition hover:border-accent/50"
                >
                  {SURAH_SHORTCUTS.map((s) => (
                    <option key={s.n} value={s.n}>{s.n}. {s.label}</option>
                  ))}
                  {!SURAH_SHORTCUTS.some((s) => s.n === activeSurah) && (
                    <option value={activeSurah}>{activeSurah}. current</option>
                  )}
                </select>
              </Field>
            )}

            <Field label={t.t('reader.reciter')}>
              <select
                value={reciterId}
                onChange={(e) => setReciter(Number(e.target.value))}
                className="w-full rounded-lg border border-line bg-raised px-2.5 py-2 text-[13px] font-medium text-ink transition hover:border-accent/50"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>

            <SelectionSummary verses={verses} t={t} />
          </div>

          <div className="panel space-y-2.5 p-4">
            <p className="eyebrow">{t.t('reader.displayGroup')}</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Toggle storeKey="colorEnabled" label={t.t('reader.colour')} />
              <Toggle storeKey="showTranslation" label={t.t('reader.translation')} />
              <Toggle storeKey="showTransliteration" label={t.t('reader.transliteration')} />
              <Toggle storeKey="highContrast" label={t.t('reader.highContrast')} />
            </div>
          </div>

          {/* ── colour key + filter ────────────────────────────────────── */}
          <div className="panel space-y-2.5 p-4">
            <p className="eyebrow">{t.t('reader.colourKey')}</p>
            <RuleLegend counts={ruleCounts} variant="rail" />
          </div>
        </aside>

        <div className="min-w-0 space-y-3 xl:col-start-1 xl:row-start-1">
          {chapter?.offlineFallback && (
            <p className="rounded-xl border border-makharij/40 bg-makharij/[0.07] px-4 py-2.5 text-[12.5px] text-makharij">
              {t.t('reader.offlineNotice')}
            </p>
          )}

          {/* quran.com publishes word-by-word glosses in English only, so say so
              rather than showing English meanings under a Tamil or Sinhala label. */}
          {chapter?.wordGlossesAreEnglish && !chapter.offlineFallback && (
            <p className="rounded-xl border border-line bg-ink/[0.03] px-4 py-2.5 text-[12.5px] text-muted">
              {t.t('reader.wordLevelEnglishNotice', { language: t.meta.label })}
              <span className="ml-1 opacity-80">— {chapter.translationCredit}</span>
            </p>
          )}

          {/* ── verses ───────────────────────────────────────────────────── */}
          {loading && <VerseSkeleton />}
          {error && (
            <p className="rounded-xl border border-madd/40 bg-madd/[0.07] px-4 py-3 text-[13px] text-madd">{error}</p>
          )}

          {/* Each verse can open the inspector directly beneath itself. The
              panel used to live once at the very bottom of the surah, which
              meant tapping a word in verse 2 scrolled you past everything else
              to read about it. Rendering it inline keeps the word and its
              explanation on the same screen. */}
          {verses.map((verse) => {
            const isInspectedVerse =
              !!inspectedWord && `${inspectedWord.surah}:${inspectedWord.ayah}` === verse.verseKey;
            return (
              <Fragment key={verse.verseKey}>
                <VerseRow
                  verse={verse}
                  isPlaying={isPlaying && playingVerseKey === verse.verseKey}
                  onPlay={() =>
                    isPlaying && playingVerseKey === verse.verseKey ? pause() : void playVerse(verse.verseKey)
                  }
                  onSelectWord={onSelectWord}
                />
                {isInspectedVerse && (
                  <WordInspector
                    word={inspectedWord}
                    onClose={closeInspector}
                    onPlayWord={(w) => void playWord(w)}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      <BackToReadingBar word={inspectedWord} onBack={closeInspector} />
    </div>
  );
}

/** A labelled control in the rail — label above, full-width input below. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

/**
 * What is actually in the current selection: verses, words, and how many rule
 * hits the engine found across them.
 *
 * It answers the question the rail otherwise invites — "is this surah worth
 * practising for what I'm working on?" — and it is the one number on the page
 * that makes the engine's work visible in aggregate rather than one word at a
 * time. All three are derived from the analysed verses on screen, never stored,
 * so they cannot drift out of step with the text.
 */
function SelectionSummary({ verses, t }: { verses: VerseData[]; t: ReturnType<typeof useT> }) {
  const { words, hits } = useMemo(() => {
    let words = 0;
    let hits = 0;
    for (const v of verses) {
      words += v.words.length;
      for (const n of Object.values(v.ruleSummary)) hits += n ?? 0;
    }
    return { words, hits };
  }, [verses]);

  if (verses.length === 0) return null;

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium text-muted">{t.t('reader.inThisSurah')}</p>
      <dl className="grid grid-cols-3 gap-1.5">
        {[
          [t.t('reader.statVerses'), verses.length],
          [t.t('reader.statWords'), words],
          [t.t('reader.statRules'), hits],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg bg-ink/[0.03] px-2 py-1.5 text-center">
            <dt className="text-[9.5px] font-medium uppercase tracking-wider text-muted">{label}</dt>
            <dd className="display mt-0.5 text-[15px] leading-none tabular-nums text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Floating "back to reading" control, shown only while a word is open.
 *
 * With the panel inline, the way out used to be the small ✕ in its header —
 * which scrolls off as soon as you read down the rule list. This stays put,
 * names the word you are inside, and returns you to it.
 */
function BackToReadingBar({ word, onBack }: { word: QuranWord | null; onBack: () => void }) {
  const t = useT();

  // Escape is the other reflex for "get me out of here".
  useEffect(() => {
    if (!word) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [word, onBack]);

  return (
    <AnimatePresence>
      {word && (
        <motion.div
          initial={{ y: 64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 64, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          // Clears the phone bottom bar, which occupies the last ~54px; from
          // `sm` up there is no bar and it sits back down at the edge.
          className="pointer-events-none fixed inset-x-0 bottom-[70px] z-40 flex justify-center px-4 sm:bottom-4"
        >
          <button
            type="button"
            onClick={onBack}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-line bg-raised/95 py-2 pl-3 pr-4 shadow-card backdrop-blur-md transition hover:border-accent/60"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent">
              ↑
            </span>
            <span className="text-left leading-tight">
              <span className="block text-[9.5px] font-medium uppercase tracking-wider text-muted">
                {t.t('reader.inspecting')} · {word.surah}:{word.ayah}
              </span>
              <span className="block text-[12.5px] font-semibold text-ink">
                {t.t('reader.backToReading')}
              </span>
            </span>
            <span dir="rtl" className="arabic ml-1 text-xl leading-none text-accent">
              {word.textUthmani}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VerseRow({
  verse,
  isPlaying,
  onPlay,
  onSelectWord,
}: {
  verse: VerseData;
  isPlaying: boolean;
  onPlay: () => void;
  onSelectWord: (w: QuranWord) => void;
}) {
  const t = useT();
  const showTranslation = useReaderStore((s) => s.showTranslation);

  return (
    <motion.article
      layout
      className="paper panel group relative overflow-hidden px-4 py-4 hover:border-accent/30 sm:px-5 sm:py-5"
    >
      {/* Arabic is right-aligned, so a single full-width column left the whole
          left half of every verse empty. A rail fills it with something worth
          reading: the verse's rule composition at a glance. */}
      <div className="grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6">
        <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-start sm:gap-3.5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onPlay}
              aria-label={t.t(isPlaying ? 'reader.pauseVerse' : 'reader.playVerse', { n: verse.ayah })}
              className={[
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition active:scale-95',
                isPlaying
                  ? 'bg-accent text-white shadow-anchor-glow'
                  : 'border border-line bg-raised text-muted group-hover:border-accent/50 hover:!border-accent hover:text-ink',
              ].join(' ')}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-accent">
              {verse.verseKey}
            </span>
          </div>

          <VerseRuleMix summary={verse.ruleSummary} t={t} />

          {verse.audio.timingSource === 'estimated' && (
            <span className="chip bg-makharij/10 text-makharij">{t.t('reader.estimatedTiming')}</span>
          )}
        </div>

        {/* The translation sits in the space the Arabic's right-alignment
            leaves, rather than under the whole verse.
            A four-word ayah set right-to-left in a 700px column leaves most of
            that column empty, and the translation was being stacked underneath
            it — so the row was both gappy in the middle and taller than it
            needed to be. Side by side is also how a mushaf with translation is
            actually printed. Below `lg` it goes back to stacking, where there
            is no width to share. */}
        <div className="flex flex-col gap-3 lg:flex-row-reverse lg:items-start lg:gap-2">
          {/* `dir="rtl"` already lays a normal flex row right-to-left — adding
              flex-row-reverse *inside* it would flip the words back into the
              wrong reading order. The reversal above is on the LTR wrapper. */}
          <div
            dir="rtl"
            className="flex min-w-0 flex-1 flex-wrap items-end justify-start gap-x-1 gap-y-2"
          >
            {verse.words.map((w) => (
              <TajweedWordRenderer key={w.id} word={w} onSelect={onSelectWord} />
            ))}
          </div>

          {showTranslation && verse.translation && (
            <p className="border-t border-line pt-3.5 text-[13.5px] leading-relaxed text-muted lg:w-[34%] lg:shrink-0 lg:border-r lg:border-t-0 lg:pr-6 lg:pt-1.5">
              {verse.translation}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/**
 * The rule composition of one verse: a stacked bar plus a count per family.
 *
 * It earns its place twice over — it fills the dead space beside right-aligned
 * Arabic, and it answers a question the reader could not previously ask:
 * "what is actually in this verse?" Useful for picking practice material.
 */
function VerseRuleMix({
  summary,
  t,
}: {
  summary: VerseData['ruleSummary'];
  t: ReturnType<typeof useT>;
}) {
  const entries = useMemo(() => {
    return FAMILY_ORDER.filter((f) => f !== 'izhar')
      .map((fam) => ({
        fam,
        n: RULES_BY_FAMILY[fam].reduce((s, r) => s + (summary[r.id] ?? 0), 0),
      }))
      .filter((e) => e.n > 0);
  }, [summary]);

  const total = entries.reduce((s, e) => s + e.n, 0);
  if (!total) return null;

  return (
    <div className="w-full">
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]"
        role="img"
        aria-label={entries.map((e) => `${e.n} ${t.t(`families.${e.fam}`)}`).join(', ')}
      >
        {entries.map((e) => (
          <motion.span
            key={e.fam}
            className={FAMILY_STYLE[e.fam].dot}
            initial={{ width: 0 }}
            animate={{ width: `${(e.n / total) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        ))}
      </div>

      <div aria-hidden="true" className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1">
        {entries.map((e) => (
          <span
            key={e.fam}
            title={t.t(`families.${e.fam}`)}
            className="flex items-center gap-1 text-[10.5px] font-medium tabular-nums text-muted"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${FAMILY_STYLE[e.fam].dot}`} />
            {e.n}
          </span>
        ))}
      </div>
    </div>
  );
}

type BoolKey = 'colorEnabled' | 'showTranslation' | 'showTransliteration' | 'highContrast';
const TOGGLES: Record<BoolKey, () => void> = {
  colorEnabled: () => useReaderStore.getState().toggleColor(),
  showTranslation: () => useReaderStore.getState().toggleTranslation(),
  showTransliteration: () => useReaderStore.getState().toggleTransliteration(),
  highContrast: () => useReaderStore.getState().toggleContrast(),
};

/**
 * A display switch.
 *
 * The dot is not decoration: as a bare tinted button the only cue for "on" was
 * a faint gold wash, which in the reader's own high-contrast mode is exactly
 * the state a learner is least able to read. A filled circle beside the label
 * carries the same information in shape as well as colour.
 */
function Toggle({ storeKey, label }: { storeKey: BoolKey; label: string }) {
  const value = useReaderStore((s) => s[storeKey]);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={TOGGLES[storeKey]}
      className={[
        'flex min-h-[38px] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11.5px] font-medium transition active:scale-[0.98]',
        value
          ? 'border-accent bg-accent/12 text-ink'
          : 'border-line bg-raised text-muted hover:border-accent/40 hover:text-ink',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border transition',
          value ? 'border-accent bg-accent' : 'border-line',
        ].join(' ')}
      >
        {value && <span className="h-1.5 w-1.5 rounded-full bg-raised" />}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

/** Mirrors the real verse layout — rail on the left, Arabic on the right — so
 *  the page does not visibly re-flow the moment the data lands. */
function VerseSkeleton() {
  const bar = 'animate-shimmer bg-gradient-to-r from-ink/[0.05] via-ink/[0.09] to-ink/[0.05] bg-[length:200%_100%]';
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="panel px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className={`h-9 w-9 shrink-0 rounded-full ${bar}`} />
                <span className={`h-5 w-12 rounded-full ${bar}`} />
              </div>
              <span className={`block h-1.5 w-full rounded-full ${bar}`} />
            </div>
            <div dir="rtl" className="flex flex-wrap justify-start gap-2">
              {[0, 1, 2, 3, 4, 5].map((j) => (
                <span
                  key={j}
                  className={`h-10 rounded-lg ${bar}`}
                  style={{ width: `${48 + ((i * 7 + j * 13) % 62)}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
