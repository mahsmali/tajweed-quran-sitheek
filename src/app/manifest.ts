import type { MetadataRoute } from 'next';

/**
 * The web app manifest, served at `/manifest.webmanifest`.
 *
 * This is half of what a browser needs before it will offer "Install"; the
 * other half is `public/sw.js`. Between them, someone who arrives from a link
 * shared on WhatsApp or a QR code in a classroom gets an install prompt on
 * first visit, and ends up with an icon on the home screen that opens the
 * reader with no address bar and no network.
 *
 * WHY THE FIELDS ARE SET THE WAY THEY ARE
 * ---------------------------------------
 * `id` is pinned to '/' so that changing `start_url` later — say, to open on
 * the roadmap instead — updates the existing installed app rather than
 * offering a second copy of it beside the first.
 *
 * `theme_color` can only be one value, while the site has two (see `viewport`
 * in `layout.tsx`). Cream is the one chosen: it is the default theme, and the
 * OS chrome that uses this colour sits around the app rather than inside it,
 * so matching the light surface is the safer half of the mismatch.
 *
 * `orientation` is left at 'any'. The reader's verse lines and the waveform
 * comparison both want width, and a phone turned sideways is how learners get
 * it; locking to portrait would take that away for no gain.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Tajweed Engine — Word-by-Word Colour-Coded Qur’an',
    // Under ~12 characters, or Android truncates it under the icon.
    short_name: 'Tajweed',
    description:
      'Character-level Tajweed colour coding derived from the Uthmani script, millisecond-aligned recitation audio, and a 30-day mastery roadmap.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // Desktop Chrome honours 'window-controls-overlay' where it can and falls
    // back down this list; the last entry is the guaranteed one.
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#FBF8F2',
    theme_color: '#FBF8F2',
    lang: 'en',
    dir: 'ltr',
    categories: ['education', 'books', 'lifestyle'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Drawn full-bleed with the mark pulled into the safe zone, so Android
      // and iOS can crop it to a circle or a squircle without clipping it.
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    // The three screens, reachable from a long-press on the installed icon.
    shortcuts: [
      {
        name: 'Reader',
        short_name: 'Reader',
        description: 'Colour-coded verses, word by word',
        url: '/',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: '30-Day Roadmap',
        short_name: 'Roadmap',
        description: 'The day-by-day Tajweed curriculum',
        url: '/curriculum',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Find the Rule',
        short_name: 'Quiz',
        description: 'Spot the hidden rule in a verse',
        url: '/quiz',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
