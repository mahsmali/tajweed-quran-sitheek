import type { Metadata, Viewport } from 'next';
import { Nav } from '@/components/Nav';
import { MicAvailabilityNotice } from '@/components/MicAvailabilityNotice';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tajweed Engine — Word-by-Word Colour-Coded Qur’an',
  description:
    'An automated word-by-word Tajweed curriculum: character-level colour coding derived from the Uthmani script, millisecond-aligned recitation audio, and a 30-day mastery roadmap.',
  // The same mark the footer credit carries, so the tab and the byline agree.
  icons: { icon: '/famico.png', apple: '/famico.png' },
  /**
   * Safari's home-screen behaviour is driven by meta tags, not by the
   * manifest. `capable` is what turns "Add to Home Screen" from a bookmark
   * that reopens in Safari with the address bar still there into something
   * that launches on its own — the icon appears either way, and none of the
   * app-like part of it does without this. Next emits it as the standard
   * `mobile-web-app-capable` rather than the older `apple-` spelling, which
   * WebKit has honoured since Safari 17.4.
   *
   * `default` for the status bar keeps it opaque and legible on the cream
   * surface; `black-translucent` would slide the page up underneath it and put
   * the masthead behind the clock.
   */
  appleWebApp: {
    capable: true,
    title: 'Tajweed',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF8F2' },
    { media: '(prefers-color-scheme: dark)', color: '#14110E' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Amiri Quran is the web fallback; an installed KFGQPC "Uthmanic Script
            HAFS" or "Al Majeed Quranic" face takes priority via the CSS stack. */}
        {/* Newsreader carries the headings: an editorial serif with real
            optical sizing, which sits far better beside a classical Arabic
            face than a grotesque does. Plus Jakarta Sans carries the UI and
            the numerals — a humanist geometric, warmer than Inter and a much
            better neighbour to both the serif and the Uthmani script.
            Tamil and Sinhala get their own sans and serif so both voices
            survive a language switch instead of falling back to a system
            default and losing the type scale. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Serif+Tamil:wght@500;600;700&family=Noto+Sans+Sinhala:wght@400;500;600;700&family=Noto+Serif+Sinhala:wght@500;600;700&display=swap"
        />
        {/*
          Catch `beforeinstallprompt` before React exists.

          Chromium fires it once, shortly after load, and does not re-fire it
          for a listener that attached late. `InstallButton` attaches in an
          effect — after the bundle has downloaded, parsed and hydrated, which
          on a mid-range phone over a weak connection is comfortably long
          enough to miss it. The symptom is the worst kind: the page works, the
          install square simply never appears, and nothing anywhere says why.

          Four lines in the document head cannot be late. They stash the event
          on `window`, and the component reads it on mount if it was not there
          to hear it live. `preventDefault` suppresses Chrome's own mini
          infobar, which is the same thing the component would have done.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__tjInstallPrompt=e});",
          }}
        />
        <link rel="preconnect" href="https://api.quran.com" />
        <link rel="preconnect" href="https://verses.quran.com" />
        <link rel="preconnect" href="https://audio.qurancdn.com" />
      </head>
      <body className="min-h-dvh antialiased">
        <Nav />
        {/* Wider than the old 6xl: at 1440px and up the reader was a column of
            panels down the middle with a third of the window left empty on
            either side, which is also what left no room for the controls rail
            the reader now keeps beside the verses. */}
        {/* The bottom padding that used to clear the phone's fixed nav bar now
            lives on the footer, which is what actually ends the page. Keeping
            it here as well would open a screen of empty surface between the
            last card and the notice. */}
        <main className="mx-auto max-w-7xl px-4 pb-6 pt-6 sm:px-6 sm:pb-10">
          {/* Stated before anything else on the page, because on a phone the
              microphone is silently unavailable and the reason is the address
              in the URL bar — not something the learner can discover from the
              recorder itself. */}
          <MicAvailabilityNotice />
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
