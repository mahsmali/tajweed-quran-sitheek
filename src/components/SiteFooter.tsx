'use client';

import { Favicon } from '@/components/CreditRail';
import { useT } from '@/lib/i18n/useT';

/**
 * The provenance notice that closes every page.
 *
 * The build credit is NOT here — it lives in the left margin as `CreditRail`,
 * which the layout mounts. What this component keeps is the fallback: below
 * `min-[1392px]` there is no margin for a rail, so the same credit is set as an
 * ordinary line under the notice. The two visibility rules are exact
 * complements, so the credit appears once and only once at every width.
 */
export function SiteFooter() {
  const t = useT();

  return (
    <footer className="mt-16 border-t border-line bg-raised/40">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 sm:pb-12">
        {/* No margin between the two paragraphs: flush, the gap between them is
            exactly one line-height — the same gap the wrapped lines inside each
            paragraph already have. The notice then reads as one evenly-leaded
            column instead of two blocks set at two different rhythms. */}
        <div className="max-w-4xl text-[12.5px] italic leading-relaxed text-muted">
          <p>{t.t('footer.scope')}</p>
          <p>
            {t.t('footer.sources')}{' '}
            <span className="not-italic font-semibold text-ink/80">
              {t.t('footer.createdBy')}
            </span>
          </p>
        </div>

        {/* The rail's content, horizontally, for the widths that have no rail. */}
        <p className="mt-5 flex items-center gap-2 min-[1392px]:hidden">
          <Favicon />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t.t('footer.credit')}
          </span>
        </p>
      </div>
    </footer>
  );
}
