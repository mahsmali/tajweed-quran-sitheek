# Tajweed Engine

A word-by-word, colour-coded Tajweed learning application. Every colour on screen is **derived from the
Uthmani orthography at runtime** — there is no hand-tagged rule data anywhere in this repository.

```
npm install --ignore-scripts
npm run seed            # optional: refresh the offline text + engine verification dump
npm run test:audio      # 84 assertions on comparison logic + i18n wiring
npm run check:alphabet  # verify 3:154 and 48:29 contain all 28 letters
npm run dev         # http://localhost:3000
npm run dev:https   # https://localhost:3001 — and https://<lan-ip>:3001, where a phone gets the microphone
```

Deploying: **[CLOUDFLARE.md](CLOUDFLARE.md)** for Cloudflare Workers (`npm run cf:deploy`), or
**[DEPLOYMENT.md](DEPLOYMENT.md)** for a self-hosted Node container (`docker compose up -d --build`).

---

## What actually makes this automatable

The hard part of a Tajweed app is normally the data: somebody has to mark up every madd, every ikhfa, every
heavy ra, for 77,000 words. This project does not do that. `src/lib/tajweed/engine.ts` reads the script
itself — the vowels, the shadda, the sukun, and the Uthmani annotation signs (`۟` silent, `ۢ` iqlab,
`ٰ` dagger alif, `ۥ ۦ` silah, `ٓ` obligatory madd) — and derives **31 rules** from the orthography.

Point the pipeline at any surah and the colouring falls out. Adding a curriculum day is a data edit.

```
Uthmani text  ─┐
                ├─►  tokenize  ─►  7 rule detectors  ─►  TajweedSpan[]  ─►  GlyphRun[]  ─►  DOM
word timings  ─┘
```

### The five visual anchors

| Colour | Family | Meaning |
|---|---|---|
| **RED** | `madd` | Elongation — 2, 4, 5 or 6 counts |
| **GREEN** | `ghunnah` | Nasalisation — ikhfa, idgham bi-ghunnah, iqlab, نّ / مّ |
| **BLUE** | `qalqalah` | Echo — sughra, kubra, akbar |
| **ORANGE** | `makharij` | Heavy vs light — isti‘la, ra, lam of Allah |
| **GREY** | `silent` | Written but not pronounced — idgham bila ghunnah, solar lam, `۟`, hamzat wasl |
| *(ink)* | `izhar` | Deliberately uncoloured: "no colour" is itself the lesson |

Colour is never the only channel. Every word also carries a row of tick marks (one per rule family), and the
high-contrast switch turns on redundant underlines and pushes every anchor past a 7:1 contrast ratio.

---

## Data pipeline

| Stream | Source | Fallback |
|---|---|---|
| Uthmani text, word-segmented | `api.quran.com/api/v4/verses/by_chapter` | bundled `src/lib/pipeline/seed.ts` (15 surahs) |
| Word millisecond bounds | `api.quran.com/api/v4/recitations/:id?fields=segments` | phonologically weighted estimator |
| Per-ayah recitation | `verses.quran.com` | `everyayah.com` |
| Isolated word clips | `audio.qurancdn.com/wbw/SSS_AAA_WWW.mp3` | slice the verse audio by the word's own bounds |

Segments arrive as `[wordIndex, position, startMs, endMs]` relative to the per-ayah file. When a reciter has
no published alignment, `src/lib/pipeline/timing.ts` distributes the duration by letter weight — a 6-count
madd counts as ~3.2 units against a plain consonant's 1.0. Estimated timings are **always labelled as such**
in the UI so a learner never mistakes them for a real forced alignment.

---

## Deliverables map

| Asked for | Lives in |
|---|---|
| `QuranWord`, `TajweedRule`, `VerseData` interfaces | `src/types/quran.ts`, `src/types/tajweed.ts` |
| `TajweedWordRenderer` | `src/components/TajweedWordRenderer.tsx` |
| Database schema + worked JSON example | `db/schema.sql`, `db/seed/verse_1_2.json` |
| `DailyMilestone` + 30-day plan | `src/types/curriculum.ts`, `src/lib/curriculum/plan.ts` |
| `GamifiedQuizScreen` | `src/components/quiz/GamifiedQuizScreen.tsx` |
| `MakhrajVisualizer` / `MakhrajDiagram` / `MakhrajModal` | `src/components/MakhrajVisualizer.tsx`, `MakhrajModal.tsx` |

## The complete-alphabet verses

**Āl-‘Imrān 3:154** and **Al-Fath 48:29** are traditionally cited as each containing every letter of the
Arabic alphabet. `npm run check:alphabet` verifies that against the Uthmani text rather than repeating it:

```
3:154  (75 words, 289 letters)   alphabet 28/28 ✓   16/17 zones   19 rules
48:29  (54 words, 246 letters)   alphabet 28/28 ✓   16/17 zones   21 rules
```

Both hold. That makes either verse a complete tour of the mouth — read one carefully and you have visited
every articulation point there is, instead of hunting for examples letter by letter. The seventeenth zone,
*al-khayshum*, is the nasal passage: the exit for every ghunnah rather than the home of any single letter,
so no letter maps to it and 16/17 is the ceiling.

`AlphabetShowcase` renders them with a 28-letter grid underneath — letters present in the verse are filled,
absent ones dashed, and tapping any letter opens the vocal-tract diagram at its exact articulation point.
They also appear as practice ranges on **Day 1** (Map of the Mouth) and **Day 30** (Comprehensive Mastery),
and surahs 3 and 48 are in the reader's surah picker.

Every statistic on that panel is **derived from the analysed verse at runtime**, not stored. Upstream word
segmentation differs between quran.com endpoints — `by_key` reports 83 words for 3:154 where `by_chapter`
reports 75 — so a hardcoded count would silently drift out of step with the text on screen.

## The companion video

The home hero and the roadmap dashboard both embed
**"All Basic Tajweed Rules Explained in One Video"** by *QTA .. Ahmad Noor*
([channel](https://www.youtube.com/@QTA..AhmadNoor)) — a full beginner walk-through that pairs with the
30-day roadmap, which then takes the same material one rule at a time.

`VideoLesson` renders it as a **facade**: until someone presses play the page holds nothing but a thumbnail
and a button. A plain `<iframe>` would pull roughly a megabyte of YouTube JavaScript and set third-party
cookies on every page load, watched or not — a heavy tax on a study app most people open to read. The real
player (on `youtube-nocookie.com`) is swapped in only on the click that needs it. The roadmap hides the card
once the learner is five days in; by then it is revision, not orientation.

Titles and channel names are attribution, not interface copy, so they are never translated.

## Routes

- `/` — the reader. Tap any word to isolate it, hear it, see its rules, and record yourself against the reciter.
- `/curriculum` — the 30-day roadmap with lock/unlock, scores and time estimates.
- `/curriculum/[day]` — one lesson: pre-filtered practice verses, a drill, and the anatomy view.
- `/quiz` — "Find the Hidden Rule", played with the colour coding switched **off**.
- `/offline` — the fallback the service worker serves for a route the device has never held.
- `/manifest.webmanifest` — the web app manifest, generated by `src/app/manifest.ts`.
- `/api/chapter/[surah]?reciter=7` — fully analysed chapter JSON.

---

## Installable, and usable with no connection

Most learners meet this through a link someone shared, in a tab among thirty,
and will never come back by typing the address. So the offer to install is kept
permanently in view — one gold square in the masthead credit row, beside the
green one carrying the build mark. Same plate, different tint, so the pair does
not read as two controls when only one of them is. Taking the offer puts an
icon on the home screen or desktop and the app on the device for good.

It was a banner across the top of every page first. That bought attention at
the cost of pushing the reader down the screen on the device with least of it,
and spent three sentences on offline caching before the learner had read a
verse. The square says the same thing in a tooltip and costs no vertical space.

| Piece | File |
|---|---|
| The manifest — name, icons, shortcuts, standalone display | `src/app/manifest.ts` |
| The install control, and service worker registration | `src/components/InstallButton.tsx` |
| The masthead row, the shared plate, and both tints | `src/components/BrandCredit.tsx` |
| The worker: five cache strategies, one per class of request | `public/sw.js` |
| The icons, drawn at full size rather than upscaled | `scripts/build-pwa-icons.ps1` |

**What works offline.** The reader, the 30-day roadmap and the quiz — the
curriculum, the rule tables and the whole Tajweed engine are bundled client
side, so they never needed the network to begin with. Analysed chapter data is
served stale-while-revalidate, so any surah opened once stays readable. Verse
recitation is cached after its first play where the CDN permits a CORS read —
slicing a stored file to answer the `Range` requests `<audio>` makes needs a
readable body, and the app's own `<audio>` elements never ask for one. Where
that is refused the worker falls straight through to the network, so audio
behaves exactly as it did before. A verse never played has no audio offline
either way.

**Chromium installs, Safari is told how to.** Chromium fires
`beforeinstallprompt`, which the button holds and replays on tap. Safari
exposes no API at all, so on iOS the same square opens a short popover teaching
the Share ▸ Add to Home Screen gesture instead — a button that looked identical
and could install nothing would be worse than none. Where neither applies
(Firefox on desktop, an already-installed window, or after `appinstalled`) the
square is not rendered and the masthead is exactly as it was.

**Testing it.** The worker is registered in production builds only — it caches
`/_next/static/*` first-hand, which is exactly the traffic Fast Refresh needs
live. Use `npm run build && npm start`, on `localhost` or over the HTTPS dev
proxy; a plain `http://<lan-ip>` origin is not a secure context and no browser
will register a worker or offer an install there. It is the same constraint
that governs the microphone — see "The phone case" below.

---

## Architecture notes

**Why glyph *runs* and not characters.** Arabic is cursive; every extra element boundary is a chance for the
shaper to break a ligature. `resolveGlyphRuns` merges adjacent characters sharing a colour and rule set, so a
word emits two or three spans instead of a dozen.

**Why the playhead is on rAF, not `timeupdate`.** `timeupdate` fires ~4×/second; words can be 300 ms long.
The loop in `useVersePlayer` writes to the Zustand store **only when the active word changes**, so a 40-word
verse causes ~40 renders over its whole duration rather than one per frame.

**Overlapping rules.** A glyph can be covered by several spans (an ikhfa noon that is also an isti‘la letter).
Each rule carries a `priority`; the highest wins the colour, but *all* of them appear in the word's breakdown.

**Reading convention.** The engine analyses each verse as recited in continuous flow, stopping only at the end
of the verse. That single assumption is what decides hamzat-wasl elision, qalqalah kubra and madd ‘arid.

---

## Languages

English, **தமிழ் (Tamil)** and **සිංහල (Sinhala)**. The picker is in the header; the choice persists and
switches everything:

| What | How it is translated |
|---|---|
| Interface strings | `src/lib/i18n/strings/{en,ta,si}.ts` |
| All 31 rule names, summaries and explanations | `src/lib/i18n/rules/{ta,si}.ts` |
| All 17 articulation zones | `src/lib/i18n/makharij/{ta,si}.ts` |
| All 30 curriculum days (title, objective, brief, checkpoints, drill) | `src/lib/i18n/curriculum/{ta,si}/` |
| Engine explanations ("نْ before ت → hide the noon…") | `src/lib/i18n/notes/{en,ta,si}.ts` |
| Verse translations | quran.com — Saheeh International (en), Sheikh Omar Sharif (ta), Ruwwad Center (si) |

**Engine notes were the interesting part.** The per-span explanation used to be built by string concatenation
inside the engine, which made it the one piece of user-facing text that could never be translated. The engine
now emits a `noteKey` plus structured parameters (`{src: 'tanween_fath', letter: 'ب'}`) and each locale
formats them. `TajweedSpan.note` still carries the English rendering, so the API payload, the SQL export and
the seed JSON remain self-describing.

English is the source of truth and the Tamil and Sinhala dictionaries are **partial by design** — any key they
do not define falls back to English rather than rendering blank, so a half-finished translation can never
break a screen.

### Two honest caveats

1. **quran.com publishes word-by-word glosses in English only** for Tamil and Sinhala. The per-word meanings
   in the inspector therefore stay English even when the verse translation does not. The reader says so
   explicitly rather than showing English under a Tamil label as though it had been translated.
2. **The Tamil and Sinhala interface and teaching text has not been reviewed by a qualified native speaker.**
   The Qur'an translations themselves are published, attributed works; everything else was produced for this
   build. Tajweed is religious instruction — have a competent teacher check the rule explanations before this
   is used for real study. Tajweed terms are kept as transliterations (மத் / මද්, குன்னா / ගුන්නා), matching
   how they are taught in Tamil- and Sinhala-medium Qur'an classes.

---

## Listen & repeat — and why it is accessible

A waveform is a picture of a sound, which makes it the least accessible possible way to give feedback
*about* a sound. So everything the canvas shows is also available as text, and the teaching judgement lives
in `src/lib/audio/compare.ts` — pure functions with no DOM, no Web Audio, and therefore no microphone
needed to test them.

- Each track is a `<figure>` whose `<figcaption>` states the duration **and where the energy sits**:
  *"Energy builds towards the end — consistent with a madd held at the finish."* That is not decoration.
  A collapsed ghunnah reads as *"the sound dips through the middle"*, which is exactly the diagnosis a
  learner needs and cannot get from a picture they can't see. The canvas itself is `aria-hidden`.
- The verdict carries a **symbol (↓ ✓ ↑) and a sentence**, so colour is never the only channel.
- Length relative to the reciter is exposed as a `role="meter"` with `aria-valuetext`
  (*"Your recitation is 50 percent of the reciter's length. Too short by 50%."*).
- A polite live region announces arming, recording and the full result; errors land in a `role="alert"`.
- <kbd>R</kbd> record/stop, <kbd>P</kbd> play reciter, <kbd>Y</kbd> play yours — declared with
  `aria-keyshortcuts` and scoped to the panel so they never fight the page. Focus moves to *Play yours*
  once a recording decodes.
- **Upload a recording** gives the identical comparison when the microphone is blocked, absent, or the page
  isn't on a secure origin. It is given equal prominence rather than buried as a second-class path.

### The phone case, which is the one that actually bites

`getUserMedia` is gated on a **secure context**. `localhost` qualifies by specification, so the recorder
works on the machine running the dev server and silently cannot on a phone that opened the address
`next dev` prints — `http://192.168.1.48:3000`. No browser will offer the microphone there, and changing
browser does not help.

That diagnosis used to live only inside the recorder panel, four taps deep: open the reader, tap a word,
scroll past the rule breakdown. Someone who tapped **Record** and got nothing had no reason to look there.
So the cause is now stated at the top of every page, with the https address as a link they can tap:

| Where you opened it | What the app does |
|---|---|
| `http://<lan-ip>:3000` | Banner naming the origin as the cause, linking to `https://<same-ip>:3001` |
| `https://<lan-ip>:3001` | Nothing — recording works once the certificate warning is accepted |
| `localhost` (dev machine) | A one-line hint with the LAN https address, for testing on a phone |

`npm run dev:https` passes its https port and LAN addresses to the app as `NEXT_PUBLIC_DEV_HTTPS_PORT` and
`NEXT_PUBLIC_DEV_LAN_HOSTS`, which is how the page can print an address only the dev script knows. Under a
plain `npm run dev` there is no https server to point at, and the banner says that instead of inventing one.

Every capture failure also names the `DOMException` it came from, and a **Microphone check** disclosure
reports the origin, secure-context flag, API presence and permission state — because "the recorder is not
working" is not a diagnosis, and those five rows settle it.

### What is verified, and what isn't

`npm run test:audio` covers the thresholds, the delta/ratio arithmetic, the envelope classification, the
formatting and the screen-reader announcement — and then renders all of it in **all three languages**,
checking that rule labels, zone cues, every curriculum day, phase titles and engine notes resolve with no
unresolved `{placeholders}` left behind. 84 assertions. The ARIA wiring was asserted separately against the
server-rendered HTML (21 attribute checks, including both meter states).

The **live microphone capture path has not been exercised end-to-end**: `getUserMedia` needs a real
permission grant from a human at the browser prompt. The decode-and-compare half of that path *is* covered,
because the upload fallback runs through exactly the same `loadIntoUserTrack` → Wavesurfer → duration →
verdict pipeline.

---

## Platform notes (Windows)

This project was built on a machine with **Windows Application Control enabled**, which blocks unsigned native
binaries. Two consequences are baked into the scripts:

- `@next/swc-win32-x64-msvc` cannot load. Next falls back to **WASM SWC bindings**, which work — the
  build logs the block as a warning and completes anyway. A `.babelrc` forcing the Babel transform used to
  sit here for that reason; it has been removed, because it was both unnecessary and dangerous (its mere
  presence would have forced Babel on production builds too, where nothing is blocked).
- **Turbopack** has no such fallback, so `dev` and `build` still pass `--webpack`. Drop that flag on a
  machine without the policy — it will be considerably faster.
- `esbuild` cannot spawn, so `npm run seed` runs through Node 24's native type stripping with a small alias
  loader (`scripts/ts-alias-loader.mjs`) instead of `tsx`.
- Install with `--ignore-scripts`; a lifecycle script tries to spawn a blocked binary otherwise.

## Fonts

The Arabic stack prefers a locally installed **KFGQPC Uthmanic Script HAFS** or **Al Majeed Quranic**, and
falls back to **Amiri Quran** from Google Fonts. All three carry the Uthmani annotation marks the engine
relies on; a font without them will render correctly but look less like a printed mushaf.

The interface is set in **Plus Jakarta Sans**, with **Newsreader** for headings and the large figures.
Jakarta replaced Inter: Inter is a grotesque built for maximum neutrality, which is what made it fight this
page — set beside a classical Uthmani face and an editorial serif it read as a dashboard. Tamil and Sinhala
keep their own Noto sans and serif so both voices survive a language switch.

The masthead brand is `public/rahmah-logo.png` — the Rahmah lockup in the slot the four coloured dots used
to hold, at a fixed height (34px on a phone, 40px above) with the tagline under it. The artwork has no
transparency, so its black canvas is rounded and given a hairline: that reads as a deliberate badge on the
cream theme instead of a black rectangle, and disappears into the dark one. Without the file the header
falls back to the four-dot mark and a type wordmark, so nothing breaks by its absence. See
`public/README.md` for what a better version of the file would change.
