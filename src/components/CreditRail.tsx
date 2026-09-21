'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n/useT';

/**
 * The build credit, set vertically in the page's left margin.
 *
 * WHERE IT SITS
 * -------------
 * Fixed to the bottom of the left margin, clear of the bottom edge, so it
 * reads as a margin note rather than as part of any one page's content. It
 * stays put while the surah scrolls past it.
 *
 * WHY A HAND-WRITTEN BREAKPOINT
 * -----------------------------
 * `min-[1392px]` is not a guess. The content column is `max-w-7xl` (1280px)
 * inside `sm:px-6`, so a viewport only has spare margin above 1328px; the rail
 * needs its 56px of it plus a little air. Below that width there is no gutter
 * to live in and a fixed rail would sit on top of the reader, so it is not
 * rendered at all and `SiteFooter` sets the same credit as an ordinary line
 * instead. The two are exact complements — `min-[1392px]:hidden` there — so
 * the credit appears exactly once at every width.
 *
 * WHY ROTATION, AND WHY THIS ORIGIN
 * ---------------------------------
 * Rotation rather than `writing-mode`, because vertical text keeps an inline
 * image upright and the mark is meant to turn with the name.
 *
 * A rotated box still lays out at its *unrotated* size, so the naive version —
 * place the row, then rotate it — hangs off the strip and can add a horizontal
 * scrollbar. `origin-bottom-left` pins the corner that is already where it
 * belongs and swings the rest upward, which is why the strip carries an
 * explicit `h-[240px]`: that height is the rotated name's length, and it no
 * longer comes from the text's own layout box. A longer name, or a larger type
 * size, needs a taller strip.
 *
 * `left-[40px]` centres the turned row in the 56px strip: with the transform
 * anchored bottom-left the row occupies the 24px to the LEFT of that offset,
 * so the maths is `(56 - 24) / 2 + 24`, not `56 / 2`.
 */
export function CreditRail() {
  const t = useT();

  return (
    <div className="fixed bottom-10 left-0 z-30 hidden h-[240px] w-14 min-[1392px]:block">
      <div className="absolute bottom-0 left-[40px] flex origin-bottom-left rotate-[-90deg] items-center gap-3 whitespace-nowrap">
        <Favicon className="h-6 w-6" />
        <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
          {t.t('footer.credit')}
        </span>
      </div>
    </div>
  );
}

/**
 * The favicon as a mark.
 *
 * Same guard as `Brand` in `Nav.tsx`, and for the same reason: the markup is
 * server-rendered, so a 404 fires its error event before React ever attaches a
 * handler. An image that has finished loading with no intrinsic width did not
 * load, and the credit drops to type alone rather than a broken-image glyph.
 */
export function Favicon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- a fixed-size mark
    // with a runtime fallback; next/image hard-errors on a missing file.
    <img
      ref={ref}
      src="/famico.png"
      alt=""
      width={114}
      height={117}
      decoding="async"
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-[5px] ring-1 ring-line`}
    />
  );
}
