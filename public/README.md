# public/

Static assets served from the site root: `public/rahmah-logo.png` is available
at `/rahmah-logo.png`.

| File | Used by | What it is |
|---|---|---|
| `rahmah-logo-transparent.png` | `Brand` — **this is the one that ships** | the lockup with the black canvas knocked out |
| `rahmah-logo.png` | nothing; kept as the source | the original, opaque, as delivered |
| `famico.png` | the favicon, and the credit mark | 114 x 117 |

## rahmah-logo-transparent.png

Derived from `rahmah-logo.png` by `scripts/key-logo-background.ps1`. Re-run it
if the original is ever replaced:

```powershell
pwsh scripts/key-logo-background.ps1
```

### Why a flood fill and not a colour key

The note below used to say keying the black out was unsafe, and for a *colour
key* it is: the monogram's tower and its outlines are near-black themselves, so
removing every dark pixel punches holes straight through the artwork.

Flooding **inward from the border** does not have that problem. It only reaches
the background region actually connected to the edge, so interior darks are
never visited. The script uses two thresholds so the antialiased rim fades out
instead of leaving a dark halo on the cream theme: at or below luminance 42 a
pixel is cleared and the fill keeps spreading; between 42 and 95 it gets partial
alpha and the fill stops there. On the current file that clears 47,382 px and
feathers 3,330 of 81,169.

### The one thing this does not fix

"Tajweed Engine" is set in a silver-to-white gradient that was drawn to sit on
black. On the cream theme its lighter strokes now fall close to the page colour
and the line reads weaker than on dark. Nothing in the keying causes this and
nothing in CSS can undo it — a light-theme variant of the artwork, with that
line darkened, is the only real fix.

## rahmah-logo.png

The masthead brand lockup — the monogram and the words "Rahmah Tajweed Engine"
in one image. It takes the slot the four coloured dots used to hold, and because
it already carries the brand name it replaces the type wordmark that sat beside
them too.

`Brand` in `src/components/Nav.tsx` pins it by **height** and lets the width
follow, so a file of any proportion keeps the masthead on one line:

| | Phone | `sm` and up |
|---|---|---|
| Height | 44px | 52px |
| Width at the current 3.3 : 1 | ~145px | ~172px |
| Resulting header height | 81px | 93px |

The reader's sticky control rail is offset to 104px to clear it. If you change
the logo height, check `xl:top-[104px]` in `src/components/ReaderScreen.tsx`.

### What the current file is, and what would be better

The file in place is **517 x 157, fully opaque, drawn on a solid black canvas**.
That canvas is why `rahmah-logo-transparent.png` exists; the original is kept
here unmodified as the source the script runs against.

Two changes to the artwork would still be worth having:

- **A real transparent export.** The flood fill is good, but it is a derivation
  from a flattened file — an export that never had the canvas would carry proper
  edge alpha rather than a reconstruction of it.
- **Twice the resolution.** At ~172px wide on a 2x screen the file wants to be
  about 1034px across; at 517 it is displayed at roughly 1:1 device pixels and
  the inner "Tajweed Engine" line softens.
- **A light-theme variant**, with "Tajweed Engine" darkened — see above.

Until a file exists here the header falls back to the four-dot mark and a type
wordmark, so nothing is broken by its absence.
