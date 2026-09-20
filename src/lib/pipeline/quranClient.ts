import { ENGINE_VERSION, analyzeVerse, uniqueRuleIds } from '@/lib/tajweed/engine';
import { makharijForText } from '@/lib/tajweed/makharij';
import { stripMarks } from '@/lib/arabic/unicode';
import { estimateWordTimings } from './timing';
import { SEED_CHAPTERS } from './seed';
import { DEFAULT_LOCALE, localeMeta } from '@/lib/i18n/config';
import type { ChapterData, QuranWord, Reciter, TimingSource, VerseData } from '@/types/quran';
import type { TajweedRuleId } from '@/types/tajweed';
import type { Locale } from '@/types/i18n';

/**
 * ============================================================================
 *  AUTOMATED TEXT + AUDIO INGESTION
 * ============================================================================
 *  Three upstream streams, zero manual tagging:
 *
 *   1. Uthmani text, word-segmented   -> api.quran.com /verses/by_chapter
 *   2. Word millisecond bounds        -> api.quran.com /recitations/:id (segments)
 *   3. Isolated per-word audio clips  -> audio.qurancdn.com/wbw/SSS_AAA_WWW.mp3
 *
 *  Anything the network cannot supply degrades gracefully: bundled Uthmani
 *  text for the core teaching surahs, and a phonologically weighted timing
 *  estimator that is always labelled as an estimate in the UI.
 */

const API = 'https://api.quran.com/api/v4';
const VERSE_AUDIO_CDN = 'https://verses.quran.com/';
const WORD_AUDIO_CDN = 'https://audio.qurancdn.com/';

export const RECITERS: Reciter[] = [
  { id: 7, name: 'Mishari Rashid al-Afasy', style: 'Murattal', hasSegments: true },
  { id: 6, name: 'Mahmoud Khalil Al-Husary', style: 'Murattal · teaching pace', hasSegments: true },
  { id: 2, name: 'AbdulBaset AbdulSamad', style: 'Murattal', hasSegments: true },
  { id: 4, name: 'Abu Bakr al-Shatri', style: 'Murattal', hasSegments: true },
  { id: 9, name: 'Mohamed Siddiq al-Minshawi', style: 'Murattal', hasSegments: true },
];

export const DEFAULT_RECITER = 7;

/**
 * Verse translations are chosen per locale from the registry:
 * en → Saheeh International (20), ta → Sheikh Omar Sharif (229),
 * si → Ruwwad Center (228).
 */
const translationFor = (locale: Locale) => localeMeta(locale).translationId;

/** Strips the footnote superscripts and any other markup the API embeds. */
function cleanTranslation(html: string | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

// ── tiny in-process cache: a chapter's analysis never changes ───────────────
const cache = new Map<string, { at: number; data: ChapterData }>();
const TTL = 1000 * 60 * 60 * 12;

async function getJSON<T>(url: string, timeoutMs = 12_000): Promise<T | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal, headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── upstream payload shapes (only the fields we consume) ────────────────────
interface ApiWord {
  position: number;
  char_type_name: string;
  text_uthmani?: string;
  text?: string;
  audio_url?: string | null;
  translation?: { text: string };
  transliteration?: { text: string };
}
interface ApiVerse {
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  words: ApiWord[];
  translations?: { text: string }[];
}
interface ApiChapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  translated_name: { name: string };
  verses_count: number;
  revelation_place: string;
  bismillah_pre: boolean;
}

/** segments arrive as [wordIndex, position, startMs, endMs] or [position, startMs, endMs]. */
function normaliseSegments(raw: unknown): Map<number, [number, number]> {
  const out = new Map<number, [number, number]>();
  if (!Array.isArray(raw)) return out;
  for (const s of raw) {
    if (!Array.isArray(s)) continue;
    let pos: number, from: number, to: number;
    if (s.length >= 4) [, pos, from, to] = s as number[];
    else if (s.length === 3) [pos, from, to] = s as number[];
    else continue;
    if (![pos, from, to].every((n) => typeof n === 'number' && Number.isFinite(n))) continue;
    if (to <= from) continue;
    out.set(pos, [from, to]);
  }
  return out;
}

async function fetchSegments(surah: number, reciterId: number) {
  const data = await getJSON<{ audio_files: { verse_key: string; segments: unknown }[] }>(
    `${API}/recitations/${reciterId}/by_chapter/${surah}?fields=segments&per_page=300`,
  );
  const map = new Map<string, { url: string; segments: Map<number, [number, number]> }>();
  if (!data?.audio_files) return map;
  for (const f of data.audio_files as { verse_key: string; url?: string; segments: unknown }[]) {
    map.set(f.verse_key, { url: f.url ?? '', segments: normaliseSegments(f.segments) });
  }
  return map;
}

/** Build the fully-analysed verse objects from raw text + timing. */
function buildVerses(
  surah: number,
  verses: { ayah: number; words: string[]; text: string; translation: string | null; meta?: ApiWord[] }[],
  timing: Map<string, { url: string; segments: Map<number, [number, number]> }>,
  reciter: Reciter,
): VerseData[] {
  return verses.map((v) => {
    const spansByWord = analyzeVerse(v.words);
    const key = `${surah}:${v.ayah}`;
    const t = timing.get(key);
    const hasReal = !!t && t.segments.size > 0;
    const source: TimingSource = hasReal ? 'quran.com-segments' : 'estimated';

    const estimated = hasReal ? null : estimateWordTimings(v.words);

    const words: QuranWord[] = v.words.map((text, i) => {
      const position = i + 1;
      const spans = spansByWord[i];
      const seg = t?.segments.get(position);
      const est = estimated?.[i];
      const bounds = seg ?? (est ? [est.startMs, est.endMs] : null);
      const meta = v.meta?.[i];
      const pad = (n: number, w = 3) => String(n).padStart(w, '0');

      return {
        id: `${surah}:${v.ayah}:${position}`,
        surah,
        ayah: v.ayah,
        position,
        textUthmani: text,
        textSimple: stripMarks(text),
        transliteration: meta?.transliteration?.text ?? null,
        translation: meta?.translation?.text ?? null,
        audioUrl: meta?.audio_url
          ? WORD_AUDIO_CDN + meta.audio_url
          : `${WORD_AUDIO_CDN}wbw/${pad(surah)}_${pad(v.ayah)}_${pad(position)}.mp3`,
        timing: bounds
          ? { startMs: bounds[0], endMs: bounds[1], durationMs: bounds[1] - bounds[0], source }
          : null,
        spans,
        ruleIds: uniqueRuleIds(spans),
        makharij: makharijForText(text),
      };
    });

    const ruleSummary: Partial<Record<TajweedRuleId, number>> = {};
    for (const w of words) for (const s of w.spans) ruleSummary[s.ruleId] = (ruleSummary[s.ruleId] ?? 0) + 1;

    const last = words[words.length - 1]?.timing;
    const pad = (n: number) => String(n).padStart(3, '0');

    return {
      verseKey: key,
      surah,
      ayah: v.ayah,
      textUthmani: v.text,
      translation: v.translation,
      words,
      audio: {
        verseAudioUrl: t?.url
          ? VERSE_AUDIO_CDN + t.url
          : `https://everyayah.com/data/Alafasy_128kbps/${pad(surah)}${pad(v.ayah)}.mp3`,
        reciterId: reciter.id,
        reciterName: reciter.name,
        durationMs: last?.endMs ?? null,
        timingSource: source,
      },
      ruleSummary,
      engineVersion: ENGINE_VERSION,
    } satisfies VerseData;
  });
}

function buildFromSeed(surah: number, reciter: Reciter, locale: Locale): ChapterData | null {
  const seed = SEED_CHAPTERS[surah];
  if (!seed) return null;
  const meta = localeMeta(locale);
  const verses = seed.verses.map((v) => ({
    ayah: v.ayah,
    words: v.text.split(/\s+/).filter(Boolean),
    text: v.text,
    translation: v.translation,
  }));
  return {
    surah,
    nameArabic: seed.nameArabic,
    nameSimple: seed.nameSimple,
    translatedName: seed.translatedName,
    versesCount: seed.verses.length,
    revelationPlace: seed.revelationPlace,
    bismillahPre: seed.bismillahPre,
    verses: buildVerses(surah, verses, new Map(), reciter),
    offlineFallback: true,
    // The bundled text carries the English translation it was seeded with.
    translationLocale: 'en',
    translationCredit: 'bundled offline text',
    wordGlossesAreEnglish: !meta.hasWordByWord,
  };
}

/** The one entry point the API route calls. */
export async function getChapter(
  surah: number,
  reciterId = DEFAULT_RECITER,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ChapterData> {
  const cacheKey = `${surah}:${reciterId}:${locale}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];

  const [chapterRes, versesRes, segments] = await Promise.all([
    getJSON<{ chapter: ApiChapter }>(`${API}/chapters/${surah}?language=en`),
    getJSON<{ verses: ApiVerse[] }>(
      `${API}/verses/by_chapter/${surah}?words=true&per_page=300` +
        `&word_fields=text_uthmani&fields=text_uthmani&translations=${translationFor(locale)}`,
    ),
    fetchSegments(surah, reciterId),
  ]);

  if (!versesRes?.verses?.length || !chapterRes?.chapter) {
    const fallback = buildFromSeed(surah, reciter, locale);
    if (fallback) {
      cache.set(cacheKey, { at: Date.now(), data: fallback });
      return fallback;
    }
    throw new Error(`Unable to load surah ${surah}: upstream unavailable and no bundled fallback.`);
  }

  const c = chapterRes.chapter;
  const prepared = versesRes.verses.map((v) => {
    const wordMeta = v.words.filter((w) => w.char_type_name === 'word');
    return {
      ayah: v.verse_number,
      words: wordMeta.map((w) => w.text_uthmani ?? w.text ?? ''),
      text: v.text_uthmani,
      translation: cleanTranslation(v.translations?.[0]?.text),
      meta: wordMeta,
    };
  });

  const data: ChapterData = {
    surah,
    nameArabic: c.name_arabic,
    nameSimple: c.name_simple,
    translatedName: c.translated_name.name,
    versesCount: c.verses_count,
    revelationPlace: c.revelation_place,
    bismillahPre: c.bismillah_pre,
    verses: buildVerses(surah, prepared, segments, reciter),
    offlineFallback: false,
    translationLocale: locale,
    translationCredit: localeMeta(locale).translationCredit,
    wordGlossesAreEnglish: !localeMeta(locale).hasWordByWord,
  };

  cache.set(cacheKey, { at: Date.now(), data });
  return data;
}
