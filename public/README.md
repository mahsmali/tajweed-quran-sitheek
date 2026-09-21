# public/

Static assets served from the site root: `public/rahmah-logo.png` is available
at `/rahmah-logo.png`.

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
That disappears into the dark theme, but on the cream one a black rectangle in
the corner of the page is not what anyone intended — so the canvas is rounded to
soften it. The hairline that used to trace those corners was removed by request;
`ring-1 ring-line` in `Brand` is what to put back if the edge starts to read as
an accident in light mode.

Two changes to the artwork would let that treatment drop away:

- **A transparent background.** Then the logo sits directly on the page surface
  in both themes. Note that keying the black out programmatically is not safe
  here: the monogram's tower and its outlines are near-black themselves, so a
  colour key punches holes straight through the artwork. It has to come from
  whatever produced the original.
- **Twice the resolution.** At ~132px wide on a 2x screen the file wants to be
  about 1034px across; at 517 it is displayed at roughly 1:1 device pixels and
  the inner "Tajweed Engine" line softens.

Until a file exists here the header falls back to the four-dot mark and a type
wordmark, so nothing is broken by its absence.
