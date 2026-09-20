'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TajweedWordRenderer } from './TajweedWordRenderer';
import { MakhrajModal } from './MakhrajModal';
import { makhrajForLetter } from '@/lib/tajweed/makharij';
import { stripMarks } from '@/lib/arabic/unicode';
import {
  ARABIC_ALPHABET,
  SHOWCASE_VERSES,
  normaliseLetter,
  type ShowcaseVerse,
} from '@/lib/content/showcaseVerses';
import { useLocaleStore } from '@/store/useLocaleStore';
import { useReaderStore } from '@/store/useReaderStore';
import { useT } from '@/lib/i18n/useT';
import { SectionHeading } from './SectionHeading';
import type { ChapterData, QuranWord, VerseData } from '@/types/quran';
import type { MakhrajId } from '@/types/tajweed';

/**
 * The two verses that contain every letter of the Arabic alphabet, presented
 * as a makharij tour.
 *
 * The point is not the verse text on its own — the reader already does that.
 * It is the letter grid underneath: all 28 letters, each one tappable, each
 * resolving to the exact place in the mouth where it is made. One verse, the
 * whole alphabet, every articulation point.
 */
export function AlphabetShowcase({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const inspect = useReaderStore((s) => s.inspect);

  const [active, setActive] = useState<ShowcaseVerse>(SHOWCASE_VERSES[0]);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [letter, setLetter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVerse(null);

    fetch(`/api/chapter/${active.surah}?locale=${locale}`)
      .then((r) => (r.ok ? (r.json() as Promise<ChapterData>) : null))
      .then((c) => {
        if (cancelled || !c) return;
        setVerse(c.verses.find((v) => v.ayah === active.ayah) ?? null);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [active, locale]);

  /**
   * Every statistic is derived from the verse the reader is actually showing,
   * so the numbers can never drift away from the text on screen.
   */
  const stats = useMemo(() => {
    if (!verse) return null;

    const present = new Set<string>();
    for (const ch of stripMarks(verse.textUthmani)) {
      const n = normaliseLetter(ch);
      if (n.trim()) present.add(n);
    }

    const zones = new Set<MakhrajId>();
    for (const w of verse.words) for (const z of w.makharij) zones.add(z);

    return {
      present,
      covered: ARABIC_ALPHABET.filter((l) => present.has(l)).length,
      zones: zones.size,
      rules: Object.keys(verse.ruleSummary).length,
      words: verse.words.length,
    };
  }, [verse]);

  const present = stats?.present ?? new Set<string>();

  const zoneFor = (ch: string): MakhrajId | null => makhrajForLetter(ch.codePointAt(0)!);

  return (
    <section className="panel overflow-hidden">
      {/* ── header ───────────────────────────────────────────────────────── */}
      <div className="border-b border-line px-5 py-5">
        <SectionHeading
          eyebrow={t.t('alphabet.eyebrow')}
          title={t.t('alphabet.heading')}
          blurb={compact ? undefined : t.t('alphabet.blurb')}
        />
        <p className="mt-2 text-[12px] italic leading-relaxed text-muted/80">{t.t('alphabet.verified')}</p>

        {/* verse switcher */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SHOWCASE_VERSES.map((v) => (
            <button
              key={v.verseKey}
              type="button"
              onClick={() => setActive(v)}
              aria-pressed={v.verseKey === active.verseKey}
              className={[
                'rounded-xl border px-3.5 py-2 text-left transition',
                v.verseKey === active.verseKey
                  ? 'border-accent bg-accent/12'
                  : 'border-line bg-raised hover:border-accent/50',
              ].join(' ')}
            >
              <span className="block text-[12.5px] font-semibold text-ink">
                {v.surahName} {v.verseKey}
              </span>
              <span dir="rtl" className="arabic block text-[15px] leading-tight text-muted">
                {v.surahNameAr}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── stats ────────────────────────────────────────────────────────── */}
      <dl className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
        <Stat
          k={t.t('alphabet.statLetters')}
          v={stats ? `${stats.covered} / 28` : '—'}
          highlight={stats?.covered === 28}
        />
        <Stat k={t.t('alphabet.statZones')} v={stats ? `${stats.zones} / 17` : '—'} />
        <Stat k={t.t('alphabet.statRules')} v={stats ? String(stats.rules) : '—'} />
        <Stat k={t.t('alphabet.statWords')} v={stats ? String(stats.words) : '—'} />
      </dl>

      {/* ── the verse ────────────────────────────────────────────────────── */}
      <div className="paper relative px-5 py-5">
        {loading && (
          <div className="flex flex-wrap justify-end gap-2" dir="rtl">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="h-9 animate-shimmer rounded-lg bg-gradient-to-r from-ink/[0.05] via-ink/[0.1] to-ink/[0.05] bg-[length:200%_100%]"
                style={{ width: `${44 + ((i * 17) % 60)}px` }}
              />
            ))}
          </div>
        )}

        {verse && (
          <>
            <div dir="rtl" className="flex flex-wrap items-end justify-start gap-x-1 gap-y-2">
              {verse.words.map((w: QuranWord) => (
                <TajweedWordRenderer key={w.id} word={w} onSelect={inspect} />
              ))}
            </div>
            {verse.translation && (
              <p className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-muted">
                {verse.translation}
              </p>
            )}
          </>
        )}

        <div className="mt-3 flex justify-end">
          <Link
            href="/"
            className="text-[12px] font-medium text-accent underline decoration-dotted underline-offset-4"
          >
            {t.t('alphabet.openReader')} →
          </Link>
        </div>
      </div>

      {/* ── the alphabet grid ────────────────────────────────────────────── */}
      <div className="border-t border-line px-5 py-5">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted">
          {t.t('alphabet.lettersHeading')}
        </p>

        <div dir="rtl" className="flex flex-wrap gap-1.5">
          {ARABIC_ALPHABET.map((ch) => {
            const here = present.has(ch);
            const zone = zoneFor(ch);
            return (
              <button
                key={ch}
                type="button"
                onClick={() => setLetter(ch)}
                title={zone ? t.t('alphabet.zoneOf', { letter: ch, zone: t.zone(zone).name }) : ch}
                aria-label={
                  zone
                    ? `${t.t('alphabet.zoneOf', { letter: ch, zone: t.zone(zone).name })} — ${
                        here ? t.t('alphabet.inThisVerse') : t.t('alphabet.missing')
                      }`
                    : ch
                }
                className={[
                  'arabic flex h-11 w-11 items-center justify-center rounded-lg border text-2xl leading-none transition',
                  here
                    ? 'border-accent/40 bg-accent/10 text-ink hover:border-accent'
                    : 'border-dashed border-line bg-transparent text-silent',
                ].join(' ')}
              >
                {ch}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {stats?.covered === 28 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-[12px] font-medium leading-relaxed text-ghunnah"
            >
              ✓ {stats.covered} / 28
            </motion.p>
          )}
        </AnimatePresence>

        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{t.t('alphabet.zoneNote')}</p>
      </div>

      <MakhrajModal
        open={!!letter}
        onClose={() => setLetter(null)}
        text={letter ?? ''}
        initialLetter={letter}
        relatedZones={letter && zoneFor(letter) ? [zoneFor(letter)!] : []}
      />
    </section>
  );
}

function Stat({ k, v, highlight = false }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="bg-raised px-3.5 py-3">
      <dt className="text-[10.5px] font-medium uppercase tracking-wider text-muted">{k}</dt>
      <dd className={`mt-1 text-[17px] font-semibold tabular-nums ${highlight ? 'text-ghunnah' : 'text-ink'}`}>
        {v}
      </dd>
    </div>
  );
}
