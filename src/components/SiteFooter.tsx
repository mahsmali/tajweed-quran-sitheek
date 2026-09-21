'use client';

import { Favicon } from '@/components/CreditRail';
import { useT } from '@/lib/i18n/useT';

/**
 * The studio's site. Emptying this string is a supported state, not a bug:
 * `StudioCredit` falls back to plain text rather than rendering a dead link.
 */
const STUDIO_URL = 'https://fslabsco.com/';

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
              {t.t('footer.createdBy')} <StudioCredit name={t.t('footer.studio')} />
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

/**
 * The studio name, linked when there is somewhere to link to.
 *
 * `target="_blank"` needs `rel="noopener"` or the opened page gets a handle on
 * this one through `window.opener`; `noreferrer` keeps the reader's path off
 * the destination's analytics. The touch target is what makes this padded and
 * `inline-block` — a 12.5px word is well under the 24px minimum a thumb needs,
 * and the negative margin keeps that padding from opening a gap in the
 * sentence it sits in.
 */
function StudioCredit({ name }: { name: string }) {
  if (!STUDIO_URL) return <>{name}</>;

  return (
    <a
      href={STUDIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="-my-1.5 inline-block rounded py-1.5 underline decoration-accent/40 underline-offset-[3px] transition hover:text-ink hover:decoration-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {name}
    </a>
  );
}
