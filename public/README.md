# public/

Static assets served from the site root: `public/famico.png` is available at
`/famico.png`. The `-source` files below are never requested by the app; they
are kept here so the derived ones can be rebuilt.

| File | Used by | What it is |
|---|---|---|
| `rahmah-logo-transparent.png` | `Brand`, **dark theme** | 508 x 142, keyed + trimmed |
| `rahmah-logo-light.png` | `Brand`, **light theme** | 600 x 166, keyed + trimmed + downscaled |
| `rahmah-logo.png` | nothing; the source for the dark one | original, opaque on black |
| `rahmah-logo-light-source.png` | nothing; the source for the light one | original, opaque on white |
| `famico.png` | the favicon, and the credit mark | 114 x 117 |

## Two lockups, one per theme

One file cannot do both jobs. "Tajweed Engine" is set in a metallic gradient,
and a gradient that reads on black is close to invisible on cream — that is
exactly what happened when the dark artwork was first keyed transparent and
shown on the light theme. So each theme gets the artwork drawn for it, swapped
in CSS (`dark:block` / `dark:hidden`) rather than in JS: the theme class is on
`<html>` before React hydrates, so a JS swap would flash the wrong lockup on
first paint. Both files are in the DOM and both load — `hidden` does not stop a
fetch — which is the cost of never showing the wrong one.

### Regenerating them

Both are derived by `scripts/key-logo-background.ps1` from the `-source` files
beside them. Re-run it if either original is replaced:

```powershell
pwsh scripts/key-logo-background.ps1 -In public/rahmah-logo.png `
  -Out public/rahmah-logo-transparent.png -Trim
pwsh scripts/key-logo-background.ps1 -In public/rahmah-logo-light-source.png `
  -Out public/rahmah-logo-light.png -Invert -Trim
```

`-Invert` keys a white canvas instead of a black one. `-Trim` crops to content,
and it is not cosmetic: the two originals pad their artwork differently, so
without it the same 52px box renders two visibly different logos. Trimmed they
are 3.58 : 1 and 3.62 : 1, which one height class sizes identically.

### Why a flood fill and not a colour key

The note below used to say keying the black out was unsafe, and for a *colour
key* it is: the monogram's tower and its outlines are near-black themselves, so
removing every dark pixel punches holes straight through the artwork.

Flooding **inward from the border** does not have that problem. It only reaches
the background region actually connected to the edge, so interior darks are
never visited. The script uses two thresholds so the antialiased rim fades out
instead of leaving a dark halo on the cream theme: at or below luminance 42 a
pixel is cleared and the fill keeps spreading; between 42 and 95 it gets partial
alpha and the fill stops there. On the dark file that clears 47,382 px and
feathers 3,330 of 81,169; on the light one, 721,360 and 10,907 of 1,335,332.

The same argument holds inverted for the white canvas: the light artwork's
highlights run to near-white, so a global "remove white" would eat them. Only
the white actually connected to the border goes.

## Sizing

The lockup takes the slot the four coloured dots used to hold, and because it
already carries the brand name it replaces the type wordmark that sat beside
them too.

`Brand` in `src/components/Nav.tsx` pins it by **height** and lets the width
follow, so a file of any proportion keeps the masthead on one line:

| | Phone | `sm` and up |
|---|---|---|
| Height | 44px | 52px |
| Width at the trimmed ~3.6 : 1 | ~158px | ~187px |
| Resulting header height | 81px | 93px |

The tagline under it is sized, not justified, to that width — 11.5px and
13.5px. If the logo height changes, that pair wants changing with it.

The reader's sticky control rail is offset to 104px to clear it. If you change
the logo height, check `xl:top-[104px]` in `src/components/ReaderScreen.tsx`.

### What would still be better

- **Real transparent exports.** The flood fill is good, but it derives alpha
  from a flattened file — an export that never had a canvas would carry proper
  edge alpha rather than a reconstruction of it.
- **More resolution on the dark file.** At ~187px wide on a 2x screen it wants
  to be about 1120px across; the source is 517, so it displays at roughly 1:1
  device pixels and the inner "Tajweed Engine" line softens. The light source
  arrived at 1999px and has no such problem — it is downscaled to 600 on the way
  in, because both files load on every page and 1.5MB to show half the time is
  not a trade worth making.

Until a file exists here the header falls back to the four-dot mark and a type
wordmark, so nothing is broken by its absence.
