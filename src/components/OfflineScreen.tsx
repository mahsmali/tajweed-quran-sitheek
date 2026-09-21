'use client';

import Link from 'next/link';
import { SectionHeading } from '@/components/SectionHeading';
import { useT } from '@/lib/i18n/useT';

/**
 * Shown by the service worker for a route the device has never held.
 *
 * The two links matter more than the retry button: the reader and the roadmap
 * are precached at install time, so they are guaranteed to open from here even
 * with the radio off. Offering a way *forward* is better than offering only a
 * way to try the thing that just failed.
 */
export function OfflineScreen() {
  const t = useT();

  return (
    <div className="panel px-5 py-6 sm:px-6 sm:py-8">
      <SectionHeading
        as="h1"
        size="lg"
        eyebrow={t.t('offline.eyebrow')}
        title={t.t('offline.title')}
        blurb={t.t('offline.body')}
      />

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={() => window.location.reload()} className="btn-primary">
          {t.t('offline.retry')}
        </button>
        <Link href="/" className="btn-ghost">
          {t.t('offline.reader')}
        </Link>
        <Link href="/curriculum" className="btn-ghost">
          {t.t('offline.roadmap')}
        </Link>
      </div>
    </div>
  );
}
