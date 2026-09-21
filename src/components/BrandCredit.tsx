'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n/useT';

/**
 * The build credit, set under the masthead controls on the right.
 *
 * It used to be a rotated rail in the left margin. That only ever worked above
 * 1392px — the content column is `max-w-7xl` inside `sm:px-6`, so there is no
 * spare margin below that — which meant the credit moved around depending on
 * how wide the window was. Here it sits in space the masthead already wastes:
 * the brand lockup is two lines tall, the controls beside it are one, and this
 * fills the gap under them.
 *
 * Hidden below `sm`, where the masthead has no room to spare at all and
 * `SiteFooter` carries the same line instead.
 */
export function MastheadCredit() {
  const t = useT();

  return (
    <span className="hidden items-center gap-2 sm:flex">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {t.t('footer.credit')}
      </span>
      <Favicon className="h-[18px] w-[18px]" />
    </span>
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
