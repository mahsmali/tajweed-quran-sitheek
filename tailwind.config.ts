import type { Config } from 'tailwindcss';

/**
 * The five Tajweed "visual anchors" are exposed three ways so that a component
 * can pick whichever channel is right for the context:
 *
 *   text-madd / bg-madd / border-madd   -> the glyph colour itself
 *   decoration-madd                     -> the accessible underline channel
 *   shadow-madd-glow                    -> the "active syllable" pulse
 *
 * Every colour resolves through a CSS custom property (see globals.css) so the
 * whole palette re-themes for dark mode and for the high-contrast switch
 * without any component having to know about it.
 */
const anchor = (name: string) => `rgb(var(--tj-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        madd: anchor('madd'),
        ghunnah: anchor('ghunnah'),
        qalqalah: anchor('qalqalah'),
        makharij: anchor('makharij'),
        silent: anchor('silent'),
        izhar: anchor('izhar'),
        ink: anchor('ink'),
        muted: anchor('muted'),
        surface: anchor('surface'),
        raised: anchor('raised'),
        line: anchor('line'),
        accent: anchor('accent'),
      },
      fontFamily: {
        // Layered fallback: the Uthmani webfont, then any KFGQPC / Majeed face
        // installed locally, then the platform Arabic face.
        quran: ['var(--font-quran)', '"KFGQPC Uthmanic Script HAFS"', '"Al Majeed Quranic"', 'Amiri Quran', 'Traditional Arabic', 'serif'],
        ui: ['var(--font-ui)', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Newsreader', 'Georgia', 'serif'],
      },
      fontSize: {
        ayah: ['2.6rem', { lineHeight: '2.35' }],
        'ayah-lg': ['3.4rem', { lineHeight: '2.2' }],
        hero: ['5.5rem', { lineHeight: '1.6' }],
      },
      boxShadow: {
        'anchor-glow': '0 0 0 1px rgb(var(--tj-accent) / 0.35), 0 8px 30px -10px rgb(var(--tj-accent) / 0.55)',
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 12px 32px -18px rgb(0 0 0 / 0.35)',
      },
      keyframes: {
        'pulse-word': {
          '0%,100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-2px) scale(1.035)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        /* The soft breathing ring on the "recording now" indicator. */
        halo: {
          '0%': { transform: 'scale(0.9)', opacity: '0.55' },
          '70%,100%': { transform: 'scale(1.9)', opacity: '0' },
        },
      },
      animation: {
        'pulse-word': 'pulse-word 900ms ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        halo: 'halo 1.8s ease-out infinite',
      },
      textDecorationThickness: {
        anchor: '3px',
      },
      textUnderlineOffset: {
        anchor: '10px',
      },
    },
  },
  plugins: [],
};

export default config;
