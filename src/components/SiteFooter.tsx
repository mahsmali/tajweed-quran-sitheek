'use client';

import { Favicon } from '@/components/BrandCredit';
import { useT } from '@/lib/i18n/useT';

/**
 * The studio's site. Emptying this string is a supported state, not a bug:
 * `StudioCredit` falls back to plain text rather than rendering a dead link.
 */
const STUDIO_URL = 'https://fslabsco.com/';

/**
 * The provenance notice that closes every page.
 *
 * The build credit is NOT here — it lives under the masthead controls as
 * `MastheadCredit`. What this component keeps is the fallback: below `sm` the
 * masthead has no room, so the same credit is set as an ordinary line under
 * the notice. The two visibility rules are exact complements, so the credit
 * appears once and only once at every width.
 */
export function SiteFooter() {
  const t = useT();

  return (
    <footer className="mt-16 border-t border-line bg-raised/40">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pb-6">
        {/* The mark is sized to the notice beside it — `h-14` is the three
            lines of `leading-relaxed` 12.5px text it stands against — so the
            two read as one block rather than an icon with a caption. */}
        <div className="flex items-start gap-4">
          <Favicon className="mt-0.5 h-14 w-14" />

          {/* No `max-w` and no margin between the paragraphs. Unconstrained,
              the notice runs the full width of the content column; flush, the
              gap between the two paragraphs is exactly one line-height — the
              same gap the wrapped lines inside each paragraph already have, so
              the whole thing is one evenly-leaded block. */}
          <div className="min-w-0 flex-1 text-[12.5px] italic leading-relaxed text-muted">
            <p>{t.t('footer.scope')}</p>
            <p>
              {t.t('footer.sources')}{' '}
              <span className="not-italic font-semibold text-ink/80">
                {t.t('footer.createdBy')} <StudioCredit name={t.t('footer.studio')} />
              </span>
            </p>
          </div>
        </div>

        {/* Below `sm` the masthead has no room for `MastheadCredit`, so the
            credit appears here instead. No mark on it — the one beside the
            notice above is already this block's mark, and repeating it would
            set the favicon twice on one screen. */}
        <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted sm:hidden">
          {t.t('footer.credit')}
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
