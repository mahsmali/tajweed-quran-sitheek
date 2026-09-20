import { NextResponse } from 'next/server';
import { DEFAULT_RECITER, getChapter } from '@/lib/pipeline/quranClient';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';

export const revalidate = 86400;

/**
 * GET /api/chapter/1?reciter=7
 *
 * Returns a fully analysed chapter: Uthmani words, character-level Tajweed
 * spans, per-word millisecond bounds and audio URLs. The Tajweed analysis runs
 * on the server so the client never ships the engine or the Arabic tables.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ surah: string }> },
) {
  const { surah: surahParam } = await params;
  const surah = Number(surahParam);

  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return NextResponse.json({ error: 'Surah must be an integer between 1 and 114.' }, { status: 400 });
  }

  const params2 = new URL(request.url).searchParams;
  const reciter = Number(params2.get('reciter')) || DEFAULT_RECITER;
  const localeParam = params2.get('locale');
  const locale = isLocale(localeParam) ? localeParam : DEFAULT_LOCALE;

  try {
    const chapter = await getChapter(surah, reciter, locale);
    return NextResponse.json(chapter, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load chapter.' },
      { status: 502 },
    );
  }
}
