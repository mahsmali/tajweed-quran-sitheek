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
 * The build credit is NOT here and has no fallback here either — it lives in
 * the masthead as `MastheadCredit`, at every width including phones. This
 * component used to carry a copy of it for the widths the masthead skipped;
 * with the masthead covering all of them, a copy would simply be the credit
 * twice on one screen.
 */
export function SiteFooter() {
  const t = useT();

  return (
    <footer className="mt-16 border-t border-line bg-raised/40">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pb-6">
        {/* From `sm` up the mark is sized to the notice beside it — `h-14` is
            the three lines of `leading-relaxed` 12.5px text it stands against
            — so the two read as one block rather than an icon with a caption.

            On a phone that rule has nothing to hold on to: the same notice
            wraps to eight or nine lines in 390px, so "as tall as the text" is
            a 160px mark. It is sized to two lines of the phone's own 11px
            instead, which keeps it a mark beside the notice rather than a
            slab above it, and hands the width back to the type. */}
        <div className="flex items-start gap-3 sm:gap-4">
          <Favicon className="mt-0.5 h-9 w-9 sm:h-14 sm:w-14" />

          {/* No `max-w` and no margin between the paragraphs. Unconstrained,
              the notice runs the full width of the content column; flush, the
              gap between the two paragraphs is exactly one line-height — the
              same gap the wrapped lines inside each paragraph already have, so
              the whole thing is one evenly-leaded block.

              11px below `sm`. This is attribution, not reading matter, and at
              12.5px italic it was the largest block of text on a phone screen
              — the last thing before the bottom bar, set bigger than the nav
              labels above it. Dropping it a step-and-a-half puts it back in
              the register a provenance notice belongs in without taking it
              under the 11px floor where small print stops being legible. */}
          <div className="min-w-0 flex-1 text-[11px] italic leading-relaxed text-muted sm:text-[12.5px]">
            <p>{t.t('footer.scope')}</p>
            <p>
              {t.t('footer.sources')}{' '}
              <span className="not-italic font-semibold text-ink/80">
                {t.t('footer.createdBy')} <StudioCredit name={t.t('footer.studio')} />
              </span>
            </p>
          </div>
        </div>

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
