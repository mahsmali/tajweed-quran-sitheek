'use client';

import { useEffect, useRef, useState } from 'react';
import { InstallButton } from '@/components/InstallButton';
import { useT } from '@/lib/i18n/useT';

/**
 * The square plate the two masthead marks sit on, and the mark inside it.
 *
 * Owned here rather than written out twice, because the install control and
 * the credit mark bracket the same line of type: if one plate were a pixel
 * larger than the other the row would read as crooked, and nothing in either
 * component would say why. One file sets the size and the shape; each caller
 * supplies only its own tint, which is the part that is meant to differ.
 */
export const MARK_PLATE =
  'inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] ring-1 transition sm:h-[26px] sm:w-[26px]';

export const MARK_INNER = 'h-4 w-4 sm:h-[18px] sm:w-[18px]';

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
 * Shown at EVERY width, phones included. It costs no extra masthead width to
 * do so: it sits under the controls row, which is wider than it is, so the
 * masthead is no harder to fit at 390px than it was without it. Tracking and
 * type size step down slightly below `sm` to keep that true on the narrowest
 * phones.
 */
export function MastheadCredit() {
  const t = useT();

  return (
    <span className="flex items-center gap-1.5 sm:gap-2">
      {/* The install control shares this row rather than getting a banner of
          its own. A banner across the top of every page bought attention at
          the cost of pushing the reader down the screen on the device with
          least of it; here the offer is permanently in view, costs one square,
          and appears only while the app can actually be installed.

          Gold — the accent the primary buttons already use — against the
          credit mark's green below. Same plate, deliberately different tint:
          two squares of one colour bracketing a line of type would read as a
          pair of controls, and only one of them is. */}
      <InstallButton
        className={`${MARK_PLATE} bg-accent/12 text-accent ring-accent/30 hover:bg-accent/20 hover:ring-accent/55`}
      />
      {/* Never wrapped. At 320px the name is the widest thing in this column,
          and allowed to break it puts "HAMEED" on its own line and strands the
          mark out to the right of both. */}
      <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.12em] text-muted sm:text-[10px] sm:tracking-[0.16em]">
        {t.t('footer.credit')}
      </span>
      {/* Green — picked up from the mark's own artwork — against the install
          control's gold. Both tints are mild enough to sit quietly under a
          masthead. */}
      <Favicon className={MARK_INNER} plateClassName="bg-ghunnah/10 ring-ghunnah/25" />
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
 *
 * `plateClassName` puts it on the shared masthead plate. It is opt-in because
 * the footer shows the same mark at 56px, where a 26px plate would be wrong;
 * and because the plate has to disappear WITH the image rather than outlive it
 * as an empty tinted square, it is drawn here and not at the call site.
 */
export function Favicon({
  className = 'h-[18px] w-[18px]',
  plateClassName,
}: {
  className?: string;
  plateClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return null;

  const img = (
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
      className={`${className} shrink-0 rounded-[5px] ${plateClassName ? '' : 'ring-1 ring-line'}`}
    />
  );

  if (!plateClassName) return img;
  return <span className={`${MARK_PLATE} ${plateClassName}`}>{img}</span>;
}
