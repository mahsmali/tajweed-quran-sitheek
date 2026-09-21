'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useReaderStore } from '@/store/useReaderStore';
import { useLocaleStore } from '@/store/useLocaleStore';
import { useProgressStore, completedCount } from '@/store/useProgressStore';
import { useT } from '@/lib/i18n/useT';
import { LOCALES, LOCALE_ORDER } from '@/lib/i18n/config';
import type { Locale } from '@/types/i18n';

export function Nav() {
  const pathname = usePathname();
  const t = useT();
  const highContrast = useReaderStore((s) => s.highContrast);
  const days = useProgressStore((s) => s.days);
  const done = completedCount(days);

  const links = [
    { href: '/', label: t.t('nav.reader'), short: t.t('nav.reader') },
    { href: '/curriculum', label: t.t('nav.curriculum'), short: t.t('nav.curriculumShort') },
    { href: '/quiz', label: t.t('nav.quiz'), short: t.t('nav.quizShort') },
  ];

  // The high-contrast switch is a document-level class so the CSS variables
  // can be redefined once instead of threading a prop through every component.
  useEffect(() => {
    document.documentElement.classList.toggle('hc', highContrast);
  }, [highContrast]);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label={t.t('nav.brand')}>
          <Brand />
        </Link>

        {/* From `sm` up the links live in the masthead. Below it they move to
            the bottom bar: a brand, three labels, a progress ring, a language
            picker and a theme button do not fit in 390px, and the version that
            scrolled them sideways just hid "Quiz" behind the edge with no way
            to know it was there. The row still cannot push the page wider,
            because the Tamil and Sinhala labels are half again as long as the
            English. */}
        <nav className="ml-auto hidden min-w-0 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">
          {links.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  'shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition',
                  active ? 'bg-accent/12 text-ink' : 'text-muted hover:bg-ink/[0.04] hover:text-ink',
                ].join(' ')}
              >
                {/* Both spellings ship; CSS picks one. Swapping the text on a
                    media query rather than in JS keeps the server and client
                    markup identical, so there is nothing for hydration to
                    disagree about. */}
                <span className="sm:hidden">{l.short}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* The roadmap counter was hidden below `lg`, which meant the one
            number telling a learner how far through the programme they are
            never appeared on the device most of them read on. With the links
            moved to the bottom bar there is room for it at every width; it
            collapses from a bar to a ring rather than disappearing. */}
        <Link
          href="/curriculum"
          title={`${done}/30 ${t.t('nav.progressLabel')}`}
          className="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-line bg-raised px-2 py-1.5 transition hover:border-accent/50 sm:ml-0 sm:px-3"
        >
          <ProgressRing done={done} total={30} />
          <span className="hidden text-[11px] font-semibold tabular-nums text-muted sm:inline">
            {done}/30
          </span>
        </Link>

        <LanguagePicker />
        <ThemeToggle label={t.t('nav.toggleDark')} />
      </div>

      <ScrollProgress />
    </header>

    {/* Outside the header on purpose: `backdrop-blur` sets a `backdrop-filter`,
        and a non-none filter makes an element a containing block for its
        fixed-position descendants — a bottom bar nested inside would anchor to
        the masthead instead of the viewport. */}
    <MobileNav links={links} pathname={pathname} />
    </>
  );
}

/**
 * The three destinations as a thumb-reachable bottom bar, below `sm` only.
 *
 * A phone masthead cannot hold the brand, three labels, the progress ring, the
 * language picker and the theme switch at once — at 390px the previous
 * scrolling row simply cut "Quiz" off at the edge with nothing to suggest it
 * existed. Moving navigation to the bottom frees the masthead for identity and
 * settings, puts the links where a thumb actually rests, and is the one
 * arrangement that does not get worse in Tamil or Sinhala, because each label
 * owns a third of the width instead of competing for one row.
 */
function MobileNav({
  links,
  pathname,
}: {
  links: { href: string; label: string; short: string }[];
  pathname: string;
}) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {links.map((l) => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
          return (
            <li key={l.href} className="flex-1">
              <Link
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex min-h-[54px] flex-col items-center justify-center gap-1 px-1 py-1.5 transition',
                  active ? 'text-accent' : 'text-muted',
                ].join(' ')}
              >
                <NavIcon href={l.href} active={active} />
                <span className="text-[10.5px] font-semibold leading-none">{l.short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** One glyph per destination — the label alone is small at 10.5px. */
function NavIcon({ href, active }: { href: string; active: boolean }) {
  const common = {
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2.3 : 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (href === '/curriculum') {
    // A path with stops on it — the roadmap.
    return (
      <svg {...common}>
        <path d="M5 20c0-4 5-4 5-8s-5-4-5-8" />
        <circle cx="5" cy="4" r="1.6" />
        <circle cx="10" cy="12" r="1.6" />
        <circle cx="5" cy="20" r="1.6" />
        <path d="M14 6h6M14 12h6M14 18h6" />
      </svg>
    );
  }
  if (href === '/quiz') {
    // A target — "find the hidden rule".
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.8" fill="currentColor" />
      </svg>
    );
  }
  // An open book — the reader.
  return (
    <svg {...common}>
      <path d="M12 6.5C10.5 5 8.5 4.5 4 4.5v13c4.5 0 6.5.5 8 2 1.5-1.5 3.5-2 8-2v-13c-4.5 0-6.5.5-8 2Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

/**
 * Reading progress along the bottom edge of the masthead.
 *
 * A surah in this reader is a long page — Āl-‘Imrān runs to 200 verses — and
 * the scrollbar is the only thing that says how much of it is left. Spring-
 * smoothed because the raw scroll value tracks a phone's inertial scrolling
 * closely enough to look nervous.
 */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  /**
   * Rendered only when there is something to scroll.
   *
   * On a page that fits the window, `scrollYProgress` is a division by a zero
   * scroll range: the transform it produces is never applied, the bar keeps its
   * untransformed full width, and a solid gold rule appears under the masthead
   * looking exactly like a design element. Short lesson pages and the quiz hit
   * this. The body is observed rather than measured once because the reader's
   * height changes underneath us — verses arrive from the API, and opening the
   * word inspector adds most of a screen.
   */
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const check = () =>
      setScrollable(document.documentElement.scrollHeight - window.innerHeight > 24);
    check();
    window.addEventListener('resize', check);
    const ro = new ResizeObserver(check);
    ro.observe(document.body);
    return () => {
      window.removeEventListener('resize', check);
      ro.disconnect();
    };
  }, []);

  if (!scrollable) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: width }}
      className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-accent/70 via-accent to-accent/70"
    />
  );
}

/** The 30-day counter as a ring, so it survives down to phone width. */
function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : done / total;
  const r = 7;
  const c = 2 * Math.PI * r;

  return (
    <span className="relative inline-flex h-[18px] w-[18px] items-center justify-center">
      <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] -rotate-90">
        <circle cx="9" cy="9" r={r} fill="none" stroke="rgb(var(--tj-ink) / 0.1)" strokeWidth="2.4" />
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          stroke="rgb(var(--tj-accent))"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="sr-only">{`${done}/${total}`}</span>
    </span>
  );
}

/**
 * Language picker. Each option is written in its own script — someone looking
 * for Tamil is looking for "தமிழ்", not for the word "Tamil".
 */
function LanguagePicker() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (l: Locale) => {
    setLocale(l);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.t('nav.language')}
        className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[12px] font-medium text-ink transition hover:border-accent/50"
      >
        <GlobeIcon />
        <span className="hidden sm:inline">{LOCALES[locale].label}</span>
        <span className="sm:hidden">{locale.toUpperCase()}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t.t('nav.language')}
          className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-line bg-raised shadow-card"
        >
          {LOCALE_ORDER.map((l) => {
            const meta = LOCALES[l];
            const selected = l === locale;
            return (
              <li key={l} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => choose(l)}
                  lang={l}
                  className={[
                    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition',
                    selected ? 'bg-accent/12' : 'hover:bg-ink/[0.04]',
                  ].join(' ')}
                >
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      selected ? 'bg-accent text-white' : 'bg-ink/[0.07] text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">{meta.label}</span>
                    <span className="block truncate text-[11px] text-muted">
                      {meta.englishLabel} · {meta.translationCredit}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ThemeToggle({ label }: { label: string }) {
  useEffect(() => {
    const stored = localStorage.getItem('tajweed-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', stored ? stored === 'dark' : prefersDark);
  }, []);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        const next = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('tajweed-theme', next ? 'dark' : 'light');
      }}
      className="min-h-[36px] shrink-0 rounded-lg border border-line bg-raised px-2.5 py-2 text-muted transition hover:text-ink"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
    </svg>
  );
}

/**
 * The masthead brand: the Rahmah logo in place of the four coloured dots, with
 * the tagline set under it.
 *
 * SIZING
 * ------
 * `public/rahmah-logo.png` is a wide lockup (517 x 157, about 3.3 : 1) that
 * already contains the words "Rahmah Tajweed Engine", so it replaces the dots
 * AND the wordmark that used to sit beside them — keeping both would have set
 * the brand name twice. It is pinned by HEIGHT and left to work out its own
 * width: 30px on a phone, 34px from `sm` up, which is about 99px and 112px
 * across.
 *
 * THE BLACK FIELD
 * ---------------
 * The artwork has no transparency — it is drawn on a solid black canvas. On the
 * dark theme that vanishes into the surface, but on the cream one it is a hard
 * black rectangle in the corner of the page. Keying the black out is not an
 * option (the monogram's own tower and outlines are near-black too, so a colour
 * key punches holes straight through the artwork), so the canvas is rounded to
 * soften what the file already is.
 *
 * The hairline that used to trace those corners is gone by request. It was
 * doing real work on the cream theme — drawing the edge deliberately rather
 * than letting it read as an accident — so if the black rectangle ever starts
 * to look wrong in light mode, `ring-1 ring-line` is what to put back. A
 * transparent PNG would settle it properly; see `public/README.md`.
 *
 * FALLBACK
 * --------
 * If the file is missing the four-dot mark and a type wordmark come back rather
 * than the page showing a broken image, which also keeps the header intact for
 * anyone who clones this repository without the artwork.
 */
function Brand() {
  const t = useT();
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  /**
   * `onError` alone is not enough here.
   *
   * The markup is server-rendered, so the browser starts fetching the logo
   * while it parses the HTML — well before React hydrates and attaches any
   * handler. A 404 therefore fires its error event into a void, `failed` stays
   * false, and the header keeps a broken image forever. Re-checking the decoded
   * state once on mount catches exactly that case: an image that has finished
   * loading with no intrinsic width did not load at all.
   */
  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <span className="flex items-center gap-2.5">
        <Mark />
        <span className="leading-none">
          <span className="display brand-word block text-[19px] leading-none sm:text-[21px]">
            Rahmah
          </span>
          <span className="brand-sub mt-[3px] block text-[10px] font-extrabold uppercase leading-none tracking-[0.09em] sm:text-[11.5px]">
            Tajweed Engine
          </span>
          <span className="mt-1.5 block text-[9.5px] leading-none text-muted sm:text-[10px]">
            {t.t('nav.tagline')}
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="flex flex-col items-start leading-none">
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-height
          brand lockup with a runtime fallback; next/image would hard-error on a
          missing file and gives nothing back for an asset this small. */}
      <img
        ref={imgRef}
        src="/rahmah-logo.png"
        alt={t.t('nav.brand')}
        width={517}
        height={157}
        decoding="async"
        onError={() => setFailed(true)}
        className="h-[44px] w-auto rounded-md sm:h-[52px]"
      />
      {/* Shown at every width now: with the three destinations moved to the
          bottom bar, the masthead finally has room for it on a phone.

          Sized to run the width of the logo above it rather than justified to
          it. `text-align-last: justify` does stretch a single line, but it can
          only do so by opening the word spaces, and on a two-word tagline that
          is one conspicuous hole in the middle rather than a set line. Type
          size reaches the same width with the words still touching: the lockup
          is ~3.3 : 1, so 52px of height is ~172px across, which 12.5px of this
          face fills almost exactly. */}
      <span className="mt-1.5 block text-[10.5px] leading-none text-muted sm:text-[12.5px]">
        {t.t('nav.tagline')}
      </span>
    </span>
  );
}

function Mark() {
  return (
    <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink/[0.04] ring-1 ring-line">
      <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-madd" />
      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-ghunnah" />
      <span className="absolute bottom-1.5 left-1.5 h-2 w-2 rounded-full bg-qalqalah" />
      <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-makharij" />
    </span>
  );
}
